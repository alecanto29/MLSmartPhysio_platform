# filters.py
import pandas as pd, numpy as np, sys, os, re, json
from pathlib import Path
from scipy.signal import butter, sosfiltfilt
from preview_utils import build_preview_from_df

_RE_CSV = re.compile(r"session_(?P<sid>.+)_(?P<dtype>sEMG|IMU)data\.csv$")
WORKDIR = Path(os.getenv("SMARTPHYSIO_WORKDIR", "data_work")); WORKDIR.mkdir(parents=True, exist_ok=True)

# tolleranza per inferenza del range se non esiste meta
TOL = 0.15

def _work_path_from_csv(csv_path: str) -> Path:
    m = _RE_CSV.search(os.path.basename(csv_path))
    if not m: return Path(csv_path).with_suffix(".parquet")
    return WORKDIR / f"{m.group('sid')}_{m.group('dtype')}.parquet"

def _meta_path_for(wp: Path) -> Path:
    return Path(str(wp) + ".yhint.json")

def _load_yhint(wp: Path):
    try:
        p = _meta_path_for(wp)
        if p.exists():
            obj = json.loads(p.read_text(encoding="utf-8"))
            if isinstance(obj, dict) and "min" in obj and "max" in obj:
                return {"min": float(obj["min"]), "max": float(obj["max"])}
    except Exception as e:
        print(f"[WARN] Impossibile leggere yhint: {e}", file=sys.stderr)
    return None

def _save_yhint(wp: Path, yhint: dict):
    try:
        _meta_path_for(wp).write_text(json.dumps(yhint), encoding="utf-8")
    except Exception as e:
        print(f"[WARN] Impossibile salvare yhint: {e}", file=sys.stderr)

def _to_float64(df: pd.DataFrame) -> pd.DataFrame:
    return df.apply(pd.to_numeric, errors="coerce").astype("float64", copy=False)

def _infer_y_hint(df: pd.DataFrame):
    if not isinstance(df, pd.DataFrame) or df.empty:
        return None
    vals = df.apply(pd.to_numeric, errors="coerce").to_numpy(dtype="float64")
    if vals.size == 0:
        return None
    vmin = float(np.nanmin(vals)); vmax = float(np.nanmax(vals))
    if vmin >= -1 - TOL and vmax <= 1 + TOL:
        return {"min": -1, "max": 1}
    if vmin >= 0 - TOL and vmax <= 1 + TOL:
        return {"min": 0, "max": 1}
    return None

def low_pass_filtering_butterworth(df, cut_off_frequency, filter_order, sampling_freq=1000.0):
    df = _to_float64(df)
    nyq = sampling_freq / 2.0
    sos = butter(N=filter_order, Wn=cut_off_frequency/nyq, btype='low', output='sos')
    for col in df.columns:
        x = df[col].to_numpy(copy=False)
        if np.isnan(x).any(): x = pd.Series(x).ffill().bfill().to_numpy(copy=False)
        df[col] = sosfiltfilt(sos, x)
    return df

def high_pass_filtering_butterworth(df, cut_off_frequency, filter_order, sampling_freq=1000.0):
    df = _to_float64(df)
    nyq = sampling_freq / 2.0
    sos = butter(N=filter_order, Wn=cut_off_frequency/nyq, btype='high', output='sos')
    for col in df.columns:
        x = df[col].to_numpy(copy=False)
        if np.isnan(x).any(): x = pd.Series(x).ffill().bfill().to_numpy(copy=False)
        df[col] = sosfiltfilt(sos, x)
    return df

def notch_filtering_butterworth(df, cutoff_freq, quality_order, sampling_freq=1000.0):
    df = _to_float64(df)
    nyq = sampling_freq / 2.0
    bw = cutoff_freq / quality_order
    low = max((cutoff_freq - bw/2.0) / nyq, 1e-6)
    high= min((cutoff_freq + bw/2.0) / nyq, 0.999999)
    if not (0 < low < high < 1):
        print(f"[ERRORE] Intervallo notch non valido (low={low}, high={high})", file=sys.stderr)
        return df
    sos = butter(N=2, Wn=[low, high], btype='bandstop', output='sos')
    for col in df.columns:
        x = df[col].to_numpy(copy=False)
        if np.isnan(x).any(): x = pd.Series(x).ffill().bfill().to_numpy(copy=False)
        df[col] = sosfiltfilt(sos, x)
    return df

if __name__ == "__main__":
    # STESSA CLI:
    #   python filters.py <csv_path> <low|high> <cutoff> <order> [sampling_freq]
    #   python filters.py <csv_path> notch <cutoff_freq> <quality_order> [sampling_freq]
    if len(sys.argv) < 5:
        print("Uso:\n  low/high: python filters.py <csv> <low|high> <cutoff> <order> [fs]\n  notch: python filters.py <csv> notch <cutoff> <Q> [fs]", file=sys.stderr)
        sys.exit(1)

    csv_path = sys.argv[1]
    filter_type = sys.argv[2].lower()
    wp = _work_path_from_csv(csv_path)

    # carica working o CSV
    if wp.exists():
        df = pd.read_parquet(wp)
    else:
        if not os.path.exists(csv_path):
            print(f"[ERRORE] CSV non esiste: {csv_path}", file=sys.stderr); sys.exit(1)
        df = pd.read_csv(csv_path, engine="c", low_memory=False, memory_map=True)

    if df.empty:
        print("[ERRORE] DataFrame vuoto", file=sys.stderr); sys.exit(1)

    # carica eventuale yRange scelto in normalizzazione
    preserved_yhint = _load_yhint(wp)

    fs = float(sys.argv[5]) if len(sys.argv) >= 6 else 1000.0

    try:
        if filter_type == "low":
            cutoff = float(sys.argv[3]); order = int(sys.argv[4])
            df = low_pass_filtering_butterworth(df, cutoff, order, fs)
        elif filter_type == "high":
            cutoff = float(sys.argv[3]); order = int(sys.argv[4])
            df = high_pass_filtering_butterworth(df, cutoff, order, fs)
        elif filter_type == "notch":
            cutoff = float(sys.argv[3]); quality = float(sys.argv[4])
            df = notch_filtering_butterworth(df, cutoff, quality, fs)
        else:
            print(f"[ERRORE] Tipo di filtro non valido: {filter_type}", file=sys.stderr); sys.exit(1)
    except Exception as e:
        print(f"[ERRORE] Errore durante il filtraggio: {e}", file=sys.stderr); sys.exit(1)

    # save Parquet + preview
    df.to_parquet(wp)
    dtype = "sEMG" if "sEMG" in csv_path else "IMU"
    preview = build_preview_from_df(df, dtype, max_points=3000)

    # priorità: se esiste un yRange salvato dalla normalizzazione, lo si riusa;
    # altrimenti si prova a inferirlo dai dati filtrati.
    yhint = preserved_yhint or _infer_y_hint(df)
    if yhint is not None:
        preview["yRange"] = yhint
        _save_yhint(wp, yhint)  # mantieni la scelta per i passaggi successivi

    print(json.dumps({"preview": preview}))
