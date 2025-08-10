# scripts_analysis/preview_utils.py
import numpy as np
import pandas as pd
from typing import List, Dict, Any

def downsample_minmax(arr: np.ndarray, target_len: int) -> List[float]:
    """
    Downsampling per bucket con preservazione dei picchi:
    per ogni bucket inserisce [min, max]. Se il bucket ha 1 elemento, inserisce solo quello.
    - arr: array 1D (NaN verranno rimossi)
    - target_len: numero target di punti (approssimato; con min+max per bucket possono essere ~2*target_len)
    """
    if arr is None:
        return []

    # assicurati di avere un array float e senza NaN
    x = np.asarray(arr, dtype=float)
    if x.size == 0:
        return []
    x = x[~np.isnan(x)]
    if x.size == 0:
        return []

    if x.size <= target_len:
        # ritorna una copia float
        return x.astype(float).tolist()

    # dimensione del bucket
    bs = int(np.ceil(x.size / target_len))
    out: List[float] = []
    # scansiona a blocchi e prendine min e max
    for i in range(0, x.size, bs):
        seg = x[i : i + bs]
        if seg.size == 0:
            continue
        seg_min = float(np.min(seg))
        out.append(seg_min)
        if seg.size > 1:
            seg_max = float(np.max(seg))
            # evita duplicato se min==max e seg.size==1 gestito sopra
            if seg_max != seg_min:
                out.append(seg_max)
    return out


def _coerce_numeric_df(df: pd.DataFrame) -> pd.DataFrame:
    """
    Converte tutte le colonne a numerico (float32), non numeriche -> NaN.
    NON cambia l'ordine delle colonne.
    """
    if not isinstance(df, pd.DataFrame):
        raise TypeError("build_preview_from_df si aspetta un pandas.DataFrame")
    # to_numeric su tutte, poi cast a float32 per efficienza
    out = df.apply(pd.to_numeric, errors="coerce").astype("float32", copy=False)
    return out


def build_preview_from_df(df: pd.DataFrame, dataType: str, max_points: int = 3000) -> Dict[str, Any]:
    """
    Costruisce l'oggetto preview:
      {
        "channels": [[...], [...], ...],  # un array per colonna
        "yRange": {"min": X, "max": Y}
      }

    - df: DataFrame con colonne canali (ch1, ch2, ...)
    - dataType: "sEMG" o "IMU" (serve solo per la yRange di default)
    - max_points: target punti per canale (con min/max saranno ~2*max_points nei bucket pieni)

    NOTE:
      - Rimuove i NaN prima del downsampling.
      - Se una colonna è vuota o tutta NaN -> lista vuota per quel canale.
      - Mantiene l'ordine delle colonne così come in df.columns.
    """
    if dataType not in ("sEMG", "IMU"):
        # fallback prudente
        dataType = "sEMG"

    pdf = _coerce_numeric_df(df)

    channels: List[List[float]] = []
    for c in pdf.columns:
        col = pdf[c].to_numpy(copy=False)
        preview_col = downsample_minmax(col, max_points)
        channels.append(preview_col)

    # y-range base (il frontend può sovrascriverla per normalize)
    if dataType == "sEMG":
        y_range = {"min": 0, "max": 4}
    else:
        y_range = {"min": -20, "max": 20}

    return {"channels": channels, "yRange": y_range}
