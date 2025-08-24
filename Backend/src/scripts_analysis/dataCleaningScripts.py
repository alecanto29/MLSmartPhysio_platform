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
    # NB: i sEMG nel CSV sono già scalati in Volt: 0..3.3
    if dataType == "sEMG":
        return 0.0, 3.3
    elif dataType == "IMU":
        return -100.0, 100.0
    else:
        raise ValueError(f"Tipo di dato non valido: {dataType}")

# =================================================
# --------- Utilità per outlier "avanzati" --------
# =================================================

# Soglia dimensione per scegliere FAST (EWM) vs ROBUST (MAD)
_ADV_FAST_THRESHOLD = 100_000

def _rolling_outlier_mask_fast(s: pd.Series, span: int = 256, zthr: float = 4.0) -> np.ndarray:
    """
    Maschera outlier con z-score esponenziale (EWM) → molto veloce.
    """
    mu = s.ewm(span=span, adjust=False, min_periods=max(16, span//8)).mean()
    sd = s.ewm(span=span, adjust=False, min_periods=max(16, span//8)).std(bias=False)
    sd = sd.replace(0, np.nan)
    z = (s - mu) / sd
    mask = z.abs() > zthr
    return mask.fillna(False).to_numpy()

def _rolling_outlier_mask_robust(s: pd.Series, win: int = 512, zthr: float = 4.0) -> np.ndarray:
    """
    Maschera outlier con z-score robusto: mediana + MAD rolling (più lento).
    """
    minp = max(32, win // 8)
    med = s.rolling(win, min_periods=minp, center=True).median()
    mad = s.rolling(win, min_periods=minp, center=True) \
        .apply(lambda x: np.median(np.abs(x - np.median(x))), raw=True)
    mad = mad.replace(0, np.nan)
    z = (s - med) / (1.4826 * mad)
    mask = z.abs() > zthr
    return mask.fillna(False).to_numpy()

def _adv_mask_dispatch(s: pd.Series, adv_win: int, adv_zthr: float) -> np.ndarray:
    """
    Sceglie automaticamente FAST (EWM) per serie grandi e ROBUST (MAD) per piccole.
    Per stabilità, prima si riempiono eventuali buchi solo ai fini del calcolo.
    """
    s_for_mask = s.ffill().bfill()
    min_t, max_t = s_for_mask.min(), s_for_mask.max()
    # evitiamo infinities/NaN; in pratica già ffill/bfill ha risolto
    if not np.isfinite(min_t) or not np.isfinite(max_t):
        s_for_mask = s_for_mask.fillna(0.0)

    n = len(s_for_mask)
    if n >= _ADV_FAST_THRESHOLD:
        span = max(32, int(adv_win * 0.5))  # mappa grossolana win->span
        return _rolling_outlier_mask_fast(s_for_mask, span=span, zthr=adv_zthr)
    else:
        return _rolling_outlier_mask_robust(s_for_mask, win=adv_win, zthr=adv_zthr)

def _ensure_float32_df(df: pd.DataFrame) -> pd.DataFrame:
    return df.apply(pd.to_numeric, errors="coerce").astype("float32", copy=False)

def _build_target_mask(s: pd.Series, dataType: str, is_nan: bool, is_out: bool, outliers_adv: bool) -> np.ndarray:
    """
    Ritorna la mask dei valori da SOSTITUIRE secondo il metodo scelto:
    - NaN (se is_nan)
    - Outlier HW (se is_out)
    - Outlier avanzati (se outliers_adv)
    """
    s = pd.to_numeric(s, errors="coerce").astype("float32", copy=False)
    mask = np.zeros(len(s), dtype=bool)

    if is_nan:
        mask |= s.isna().to_numpy()

    if is_out:
        lo, hi = _thresholds(dataType)
        sv = s.to_numpy()
        mask |= ((sv < lo) | (sv > hi))

    if outliers_adv:
        # calcola mask avanzata su serie stabilizzata (solo per la mask)
        advm = _adv_mask_dispatch(s, adv_win=512, adv_zthr=4.0)
        mask |= advm

    return mask

def _replace_by_method(s: pd.Series, mask: np.ndarray, method: str, dataType: str) -> pd.Series:
    """
    Applica la sostituzione sui punti marcati nella mask usando il metodo scelto.
    """
    s = pd.to_numeric(s, errors="coerce").astype("float32", copy=False)
    method = method.lower()

    if method == "mean":
        # media calcolata sui soli valori NON target (più robusto)
        valid = s[~pd.Series(mask)]
        rep = float(valid.mean()) if valid.size else 0.0
        s = s.where(~pd.Series(mask), rep)

    elif method == "median":
        valid = s[~pd.Series(mask)]
        rep = float(valid.median()) if valid.size else 0.0
        s = s.where(~pd.Series(mask), rep)

    elif method == "ffill":
        s2 = s.copy()
        s2[pd.Series(mask)] = np.nan
        s = s2.ffill().bfill()

    elif method == "bfill":
        s2 = s.copy()
        s2[pd.Series(mask)] = np.nan
        s = s2.bfill().ffill()

    else:
        # fallback prudente: nessuna sostituzione
        pass

    # clip di sicurezza ai limiti hardware
    lo, hi = _thresholds(dataType)
    return s.clip(lower=lo, upper=hi)

# =========================================
# ---- Vecchie firme (compat mantenuta) ----
# =========================================
def get_bounds(df_col, outliers_adv, use_median=False, dataType="sEMG"):
    """
    Conservata per compatibilità con il tuo codice precedente.
    Restituisce (lb, ub, min_threshold, max_threshold).
    """
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
    """
    Firma mantenuta per compatibilità; NON usata nel nuovo flusso.
    """
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

# =========================================
# ---- Entry points con stesse firme  -----
# =========================================
def clean_mean(df, is_nan, is_out, outliers_adv, dataType):
    """
    Metodo 'mean' → tutti i target (NaN, outlier HW, outlier avanzati)
    sostituiti con la media della colonna (calcolata sui NON-target).
    """
    df = _ensure_float32_df(df)
    for col in df.columns:
        s = df[col]
        mask = _build_target_mask(s, dataType, is_nan, is_out, outliers_adv)
        df[col] = _replace_by_method(s, mask, "mean", dataType)
    return df

def clean_median(df, is_nan, is_out, outliers_adv, dataType):
    """
    Metodo 'median' → tutti i target sostituiti con la mediana della colonna
    (calcolata sui NON-target).
    """
    df = _ensure_float32_df(df)
    for col in df.columns:
        s = df[col]
        mask = _build_target_mask(s, dataType, is_nan, is_out, outliers_adv)
        df[col] = _replace_by_method(s, mask, "median", dataType)
    return df

def clean_ffill(df, is_nan, is_out, outliers_adv, dataType):
    """
    Metodo 'ffill' → tutti i target messi a NaN, poi ffill+bfill.
    """
    df = _ensure_float32_df(df)
    for col in df.columns:
        s = df[col]
        mask = _build_target_mask(s, dataType, is_nan, is_out, outliers_adv)
        df[col] = _replace_by_method(s, mask, "ffill", dataType)
    return df

def clean_bfill(df, is_nan, is_out, outliers_adv, dataType):
    """
    Metodo 'bfill' → tutti i target messi a NaN, poi bfill+ffill.
    """
    df = _ensure_float32_df(df)
    for col in df.columns:
        s = df[col]
        mask = _build_target_mask(s, dataType, is_nan, is_out, outliers_adv)
        df[col] = _replace_by_method(s, mask, "bfill", dataType)
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

    # Applica cleaning secondo metodo
    m = method.lower()
    if m == "mean":
        df = clean_mean(df, is_nan, is_out, adv, dataType)
    elif m == "median":
        df = clean_median(df, is_nan, is_out, adv, dataType)
    elif m == "ffill":
        df = clean_ffill(df, is_nan, is_out, adv, dataType)
    elif m == "bfill":
        df = clean_bfill(df, is_nan, is_out, adv, dataType)
    else:
        print(f"[ERRORE] Metodo non valido: {method}", file=sys.stderr)
        sys.exit(1)

    # Salva working Parquet (niente CSV qui)
    df.to_parquet(wp)

    # Preview JSON
    preview = build_preview_from_df(df, dataType, max_points=3000)
    print(json.dumps({"preview": preview}))
