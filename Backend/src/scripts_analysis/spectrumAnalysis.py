# spectrumAnalysis.py
import pandas as pd, numpy as np, sys, os, re, json
from pathlib import Path
from scipy.fft import fft, fftfreq
from scipy.signal import welch, detrend

_RE_CSV = re.compile(r"session_(?P<sid>.+)_(?P<dtype>sEMG|IMU)data\.csv$")
WORKDIR = Path(os.getenv("SMARTPHYSIO_WORKDIR", "data_work"))

def _work_path_from_csv(csv_path: str) -> Path:
    m = _RE_CSV.search(os.path.basename(csv_path))
    if not m: return Path(csv_path).with_suffix(".parquet")
    return WORKDIR / f"{m.group('sid')}_{m.group('dtype')}.parquet"

def spectrum_analyzer(df, fs=1000):
    out = []
    for ch in df.columns:
        try:
            x = df[ch].to_numpy(dtype=float, copy=False)
            x = detrend(x, type='constant')  # togli DC residua

            # Welch: finestra Hann, 2048 campioni, 50% overlap
            f, Pxx = welch(
                x, fs=fs,
                window='hann',
                nperseg=2048,
                noverlap=1024,
                detrend=False,
                scaling='density',        # V^2/Hz
                return_onesided=True
            )

            # se preferisci dB:
            # Pxx = 10*np.log10(Pxx + 1e-20)

            out.append({"channel": ch, "frequencies": f.tolist(), "psd": Pxx.tolist()})
        except Exception as e:
            print(f"[ERRORE] PSD canale {ch}: {e}", file=sys.stderr)
    return out

if __name__ == "__main__":
    # STESSA CLI: python spectrumAnalysis.py <csv_path>
    if len(sys.argv) != 2:
        print("Uso: python spectrumAnalysis.py <csv_path>", file=sys.stderr); sys.exit(1)
    csv_path = sys.argv[1]
    wp = _work_path_from_csv(csv_path)

    if wp.exists():
        df = pd.read_parquet(wp)
    else:
        if not os.path.exists(csv_path):
            print(f"[ERRORE] CSV non esiste: {csv_path}", file=sys.stderr); sys.exit(1)
        df = pd.read_csv(csv_path)

    if df.empty:
        print("[ERRORE] Il file è vuoto", file=sys.stderr); sys.exit(1)

    data = spectrum_analyzer(df)
    print(json.dumps(data))
