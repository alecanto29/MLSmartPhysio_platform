import pandas as pd
import numpy as np
import sys
import os

def min_max_scaling(df):
    for col in df.columns:
        min_val = df[col].min()
        max_val = df[col].max()
        if max_val == min_val:
            print(f"[{col}] Tutti i valori sono uguali → Normalizzazione saltata", file=sys.stderr)
            continue
        df[col] = df[col].apply(lambda x: (x - min_val) / (max_val - min_val))
    return df

def standard_scaling(df):
    for col in df.columns:
        mean = df[col].mean()
        max_val = df[col].max()
        if max_val == mean:
            print(f"[{col}] Valore massimo uguale alla media → Normalizzazione saltata", file=sys.stderr)
            continue
        df[col] = df[col].apply(lambda x: (x - mean) / max_val)
    return df

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Uso: python normalize.py <csv_path> <minmax|standard>", file=sys.stderr)
        sys.exit(1)

    csv_path = sys.argv[1]
    method = sys.argv[2].lower()

    if not os.path.exists(csv_path):
        print(f"[ERRORE] Il file CSV non esiste: {csv_path}", file=sys.stderr)
        sys.exit(1)

    try:
        df = pd.read_csv(csv_path)
    except Exception as e:
        print(f"[ERRORE] Lettura CSV fallita: {e}", file=sys.stderr)
        sys.exit(1)

    if df.empty:
        print("[ERRORE] Il file CSV è vuoto", file=sys.stderr)
        sys.exit(1)

    try:
        if method == "minmax":
            df = min_max_scaling(df)
        elif method == "standard":
            df = standard_scaling(df)
        else:
            print(f"[ERRORE] Metodo di normalizzazione non valido: {method}", file=sys.stderr)
            sys.exit(1)
    except Exception as e:
        print(f"[ERRORE] Errore durante la normalizzazione: {e}", file=sys.stderr)
        sys.exit(1)

    try:
        df.to_csv(csv_path, index=False, sep=",", float_format="%.2f", encoding="utf-8")
        print(f"[DEBUG] CSV aggiornato correttamente in: {csv_path}", file=sys.stderr)
    except Exception as e:
        print(f"[ERRORE] Scrittura CSV fallita: {e}", file=sys.stderr)
        sys.exit(1)

    print(df.to_json(orient="records"))
