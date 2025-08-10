# normalize.py
import pandas as pd, numpy as np, sys, os, re, json
from pathlib import Path
from preview_utils import build_preview_from_df

try:
    pd.options.mode.copy_on_write = True
except Exception:
    pass

_RE_CSV = re.compile(r"session_(?P<sid>.+)_(?P<dtype>sEMG|IMU)data\.csv$")
WORKDIR = Path(os.getenv("SMARTPHYSIO_WORKDIR", "data_work"))
WORKDIR.mkdir(parents=True, exist_ok=True)

def _work_path_from_csv(csv_path: str) -> Path:
    m = _RE_CSV.search(os.path.basename(csv_path))
    if not m:
        return Path(csv_path).with_suffix(".parquet")
    return WORKDIR / f"{m.group('sid')}_{m.group('dtype')}.parquet"

def _meta_path_for(wp: Path) -> Path:
    return Path(str(wp) + ".yhint.json")

def _save_yhint(wp: Path, yhint: dict):
    try:
        _meta_path_for(wp).write_text(json.dumps(yhint), encoding="utf-8")
    except Exception as e:
        print(f"[WARN] Impossibile salvare yhint: {e}", file=sys.stderr)

def _to_numeric_float32(df: pd.DataFrame) -> pd.DataFrame:
    return df.apply(pd.to_numeric, errors="coerce").astype("float32", copy=False)

def min_max_scaling(df: pd.DataFrame) -> pd.DataFrame:
    df = _to_numeric_float32(df)
    col_min = df.min(axis=0)
    col_max = df.max(axis=0)
    denom = (col_max - col_min).replace(0, np.nan)
    out = (df - col_min) / denom      # 0..1
    out = (out * 2) - 1               # -1..1
    const_cols = denom.index[denom.isna()]
    for c in const_cols:
        print(f"[{c}] Colonna costante → min-max=0", file=sys.stderr)
    return out.fillna(0.0)

def standard_scaling(df: pd.DataFrame) -> pd.DataFrame:
    # z-scaling basato sul max assoluto → poi shift a 0..1
    df = _to_numeric_float32(df)
    max_val = df.abs().max(axis=0).replace(0, np.nan)
    out = df / max_val        # -1..1
    out = (out + 1) / 2       # 0..1
    const_cols = max_val.index[max_val.isna()]
    for c in const_cols:
        print(f"[{c}] max=0 → output=0", file=sys.stderr)
    return out.fillna(0.0)

if __name__ == "__main__":
    # STESSA CLI: python normalize.py <csv_path> <minmax|standard>
    if len(sys.argv) != 3:
        print("Uso: python normalize.py <csv_path> <minmax|standard>", file=sys.stderr)
        sys.exit(1)

    csv_path, method = sys.argv[1], sys.argv[2].lower()
    wp = _work_path_from_csv(csv_path)

    # carica working o CSV
    if wp.exists():
        df = pd.read_parquet(wp).astype("float32", copy=False)
    else:
        if not os.path.exists(csv_path):
            print(f"[ERRORE] CSV non esiste: {csv_path}", file=sys.stderr); sys.exit(1)
        df = pd.read_csv(csv_path, engine="c", low_memory=False, memory_map=True)

    if df.empty:
        print("[ERRORE] DataFrame vuoto", file=sys.stderr); sys.exit(1)

    if method == "minmax":
        df = min_max_scaling(df)
        yhint = {"min": -1, "max": 1}
    elif method == "standard":
        df = standard_scaling(df)
        yhint = {"min": 0, "max": 1}
    else:
        print(f"[ERRORE] Metodo non valido: {method}", file=sys.stderr); sys.exit(1)

    # save Parquet + preview + meta yhint
    df.to_parquet(wp)
    _save_yhint(wp, yhint)

    preview = build_preview_from_df(df, "sEMG" if "sEMG" in csv_path else "IMU", max_points=3000)
    preview["yRange"] = yhint  # forza il range voluto
    print(json.dumps({"preview": preview}))
