# data_cleaning_ultra.py
import sys, os, re, json
from pathlib import Path

import pandas as pd
import numpy as np
from preview_utils import build_preview_from_df  # deve stare accanto a questo file

# (opzionale ma utile su pandas 2.x per ridurre copie)
try:
    pd.options.mode.copy_on_write = True
except Exception:
    pass

# ================================
# ---- Working area Parquet  -----
# ================================
WORKDIR = Path(os.getenv("SMARTPHYSIO_WORKDIR", "data_work"))
WORKDIR.mkdir(parents=True, exist_ok=True)

# tmp/session_<sid>_<dtype>data.csv  ->  data_work/<sid>_<dtype>.parquet
_RE_CSV = re.compile(r"session_(?P<sid>.+)_(?P<dtype>sEMG|IMU)data\.csv$")

def _work_path_from_csv(csv_path: str) -> Path:
    base = os.path.basename(csv_path)
    m = _RE_CSV.search(base)
    if not m:
        # fallback: parquet affiancato
        return Path(csv_path).with_suffix(".parquet")
    sid = m.group("sid")
    dtype = m.group("dtype")
    return WORKDIR / f"{sid}_{dtype}.parquet"

def _thresholds(dataType: str):
    if dataType == "sEMG":
        return 0.0, 4096.0
    elif dataType == "IMU":
        return -100.0, 100.0
    else:
        raise ValueError(f"Tipo di dato non valido: {dataType}")

# =========================================
# --------- Fallback Pandas (vector) -------
# =========================================
def get_bounds(df_col, outliers_adv, use_median=False, dataType="sEMG"):
    min_threshold, max_threshold = _thresholds(dataType)
    s = pd.to_numeric(df_col, errors="coerce").astype("float32", copy=False)

    if outliers_adv:
        lower_q = s.quantile(0.10)
        upper_q = s.quantile(0.90)
        filtered = s[(s >= lower_q) & (s <= upper_q)]
        center = (filtered.median() if use_median else filtered.mean())
        spread = filtered.std()
        if np.isfinite(center) and np.isfinite(spread) and spread > 0:
            lb = center - 3 * spread
            ub = center + 3 * spread
        else:
            lb, ub = min_threshold, max_threshold
    else:
        # IQR “classico”
        q1 = s.quantile(0.25)
        q3 = s.quantile(0.75)
        iqr = q3 - q1
        if np.isfinite(iqr) and iqr > 0:
            lb = q1 - 1.5 * iqr
            ub = q3 + 1.5 * iqr
        else:
            lb, ub = min_threshold, max_threshold

    # clamp finale ai limiti hardware
    lb = max(lb, min_threshold)
    ub = min(ub, max_threshold)
    return lb, ub, min_threshold, max_threshold

def clean_column(df_col, is_nan, is_out, lower_bound, upper_bound, replacement_value, min_threshold, max_threshold):
    """STESSA FIRMA ORIGINALE. Implementazione vettoriale."""
    s = pd.to_numeric(df_col, errors="coerce").astype("float32", copy=False)

    mask = np.zeros(len(s), dtype=bool)
    if is_nan:
        mask |= s.isna().to_numpy()
    if is_out:
        sv = s.to_numpy()
        mask |= ((sv < lower_bound) | (sv > upper_bound))

    if replacement_value is None or not np.isfinite(replacement_value):
        replacement_value = 0.0

    s = s.where(~pd.Series(mask), replacement_value)
    s = s.clip(lower=min_threshold, upper=max_threshold)
    return s

def clean_mean(df, is_nan, is_out, outliers_adv, dataType):
    """STESSA FIRMA ORIGINALE. Vettoriale."""
    df = df.apply(pd.to_numeric, errors="coerce").astype("float32", copy=False)
    for col in df.columns:
        lb, ub, min_t, max_t = get_bounds(df[col], outliers_adv, use_median=False, dataType=dataType)
        valid = df[col][(df[col] >= lb) & (df[col] <= ub)]
        replacement = float(valid.mean()) if valid.size else 0.0
        df[col] = clean_column(df[col], is_nan, is_out, lb, ub, replacement, min_t, max_t)
    return df

def clean_median(df, is_nan, is_out, outliers_adv, dataType):
    """STESSA FIRMA ORIGINALE. Vettoriale."""
    df = df.apply(pd.to_numeric, errors="coerce").astype("float32", copy=False)
    for col in df.columns:
        lb, ub, min_t, max_t = get_bounds(df[col], outliers_adv, use_median=True, dataType=dataType)
        valid = df[col][(df[col] >= lb) & (df[col] <= ub)]
        replacement = float(valid.median()) if valid.size else 0.0
        df[col] = clean_column(df[col], is_nan, is_out, lb, ub, replacement, min_t, max_t)
    return df

def clean_ffill(df, is_nan, is_out, outliers_adv, dataType):
    df = df.apply(pd.to_numeric, errors="coerce").astype("float32", copy=False)
    for col in df.columns:
        s = df[col]
        lb, ub, min_t, max_t = get_bounds(s, outliers_adv, use_median=False, dataType=dataType)

        mask = np.zeros(len(s), dtype=bool)
        if is_nan:
            mask |= s.isna().to_numpy()
        if is_out:
            sv = s.to_numpy()
            mask |= ((sv < lb) | (sv > ub))

        base = s.where(~mask, np.nan)
        filled = base.ffill().bfill()   # fallback ai bordi
        df[col] = s.where(~mask, filled).clip(lower=min_t, upper=max_t)
    return df

def clean_bfill(df, is_nan, is_out, outliers_adv, dataType):
    df = df.apply(pd.to_numeric, errors="coerce").astype("float32", copy=False)
    for col in df.columns:
        s = df[col]
        lb, ub, min_t, max_t = get_bounds(s, outliers_adv, use_median=False, dataType=dataType)

        mask = np.zeros(len(s), dtype=bool)
        if is_nan:
            mask |= s.isna().to_numpy()
        if is_out:
            sv = s.to_numpy()
            mask |= ((sv < lb) | (sv > ub))

        base = s.where(~mask, np.nan)
        filled = base.bfill().ffill()   # fallback opposto
        df[col] = s.where(~mask, filled).clip(lower=min_t, upper=max_t)
    return df


if __name__ == "__main__":
    # STESSA CLI: python data_cleaning_ultra.py <csv_path> <method> <NaN: true|false> <Outliers: true|false> <Advanced: true|false> <dataType>
    if len(sys.argv) < 7:
        print("Uso: python data_cleaning_ultra.py <csv_path> <method> <NaN: true|false> <Outliers: true|false> <Advanced: true|false> <dataType>", file=sys.stderr)
        sys.exit(1)

    csv_path, method = sys.argv[1], sys.argv[2]
    is_nan = sys.argv[3].lower() == "true"
    is_out = sys.argv[4].lower() == "true"
    adv = sys.argv[5].lower() == "true"
    dataType = sys.argv[6]

    if dataType not in ["sEMG", "IMU"]:
        print(f"[ERRORE] dataType deve essere 'sEMG' o 'IMU', ricevuto: {dataType}", file=sys.stderr)
        sys.exit(1)

    wp = _work_path_from_csv(csv_path)

    # Carica working Parquet o CSV iniziale
    if wp.exists():
        df = pd.read_parquet(wp).astype("float32", copy=False)
    else:
        if not os.path.exists(csv_path):
            print(f"[ERRORE] Sorgente non trovata: né CSV ({csv_path}) né Parquet working.", file=sys.stderr)
            sys.exit(1)
        df = pd.read_csv(csv_path, engine="c", low_memory=False, memory_map=True)
        if df is None or df.empty:
            print("[ERRORE] DataFrame vuoto o non caricato", file=sys.stderr)
            sys.exit(1)

    # Applica cleaning
    if method == "mean":
        df = clean_mean(df, is_nan, is_out, adv, dataType)
    elif method == "median":
        df = clean_median(df, is_nan, is_out, adv, dataType)
    elif method == "ffill":
        df = clean_ffill(df, is_nan, is_out, adv, dataType)
    elif method == "bfill":
        df = clean_bfill(df, is_nan, is_out, adv, dataType)
    else:
        print(f"[ERRORE] Metodo non valido: {method}", file=sys.stderr)
        sys.exit(1)

    # Salva working Parquet (niente CSV qui)
    df.to_parquet(wp)

    # Preview JSON
    preview = build_preview_from_df(df, dataType, max_points=3000)
    print(json.dumps({"preview": preview}))
