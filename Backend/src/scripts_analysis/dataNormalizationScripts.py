import pandas as pd
import numpy as np
import sys
import json

def min_max_scaling(df):
    for col in df.columns:
        min_val = df[col].min()
        max_val = df[col].max()
        if max_val == min_val:
            print(f"[{col}] Tutti i valori sono uguali → Normalizzazione saltata")
            continue
        df[col] = df[col].apply(lambda x: (x - min_val) / (max_val - min_val))
    return df

def standard_scaling(df):
    for col in df.columns:
        mean = df[col].mean()
        std = df[col].std()
        if std == 0:
            print(f"[{col}] Deviazione standard nulla → Normalizzazione saltata")
            continue
        df[col] = df[col].apply(lambda x: (x - mean) / std)
    return df

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Uso: python normalize.py <csv_path> <minmax|standard>")
        sys.exit(1)

    csv_path = sys.argv[1]
    method = sys.argv[2]

    df = pd.read_csv(csv_path)

    if method == "minmax":
        df = min_max_scaling(df)
    elif method == "standard":
        df = standard_scaling(df)
    else:
        print(f"Metodo di normalizzazione non valido: {method}")
        sys.exit(1)

    print(df.to_json(orient="records"))
