# scripts_analysis/preview_utils.py
import numpy as np
import pandas as pd
from typing import List, Dict, Any

def downsample_minmax(arr: np.ndarray, target_len: int) -> List[float]:
    x = np.asarray(arr, dtype=float)
    x = x[np.isfinite(x)]
    n = x.size
    if n == 0 or n <= target_len:
        return x.tolist()

    out: List[float] = []
    for k in range(target_len):
        start = (k * n) // target_len
        end   = ((k + 1) * n) // target_len
        seg = x[start:end]
        if seg.size == 0:
            continue
        i_min = int(np.argmin(seg)); vmin = float(seg[i_min])
        i_max = int(np.argmax(seg)); vmax = float(seg[i_max])
        # indici relativi -> assoluti
        a_min = start + i_min; a_max = start + i_max
        if a_min <= a_max:
            out.append(vmin)
            if a_max != a_min: out.append(vmax)
        else:
            out.append(vmax)
            out.append(vmin)
    if out:
        out[0] = float(x[0])
        out[-1] = float(x[-1])
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
