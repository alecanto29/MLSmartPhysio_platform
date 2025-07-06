import pandas as pd
import numpy as np
import sys
import os
import json


min_threshold = 0
max_threshold = 4096

def clean_mean(df, is_nan, is_out):
    for col in df.columns:
        df[col] = df[col].astype(float)
        mean = df[col][(df[col] >= min_threshold) & (df[col] <= max_threshold)].mean()
        for i in range(len(df)):
            val = df.at[i, col]
            if is_nan and pd.isna(val):
                df.at[i, col] = mean
            elif is_out and (val < min_threshold or val > max_threshold):
                df.at[i, col] = mean
    return df

def clean_median(df, is_nan, is_out):
    for col in df.columns:
        df[col] = df[col].astype(float)
        median = df[col][(df[col] >= min_threshold) & (df[col] <= max_threshold)].median()
        for i in range(len(df)):
            val = df.at[i, col]
            if is_nan and pd.isna(val):
                df.at[i, col] = median
            elif is_out and (val < min_threshold or val > max_threshold):
                df.at[i, col] = median
    return df

def clean_ffill(df, is_nan, is_out):
    for col in df.columns:
        for i in range(len(df)):
            val = df.at[i, col]
            if is_nan and pd.isna(val) and i > 0:
                df.at[i, col] = df.at[i - 1, col]
            elif is_out and (val < min_threshold or val > max_threshold) and i > 0:
                df.at[i, col] = df.at[i - 1, col]
    return df

def clean_bfill(df, is_nan, is_out):
    for col in df.columns:
        for i in range(len(df)):
            val = df.at[i, col]
            if is_nan and pd.isna(val) and i < len(df) - 1:
                df.at[i, col] = df.at[i + 1, col]
            elif is_out and (val < min_threshold or val > max_threshold) and i < len(df) - 1:
                df.at[i, col] = df.at[i + 1, col]
    return df

if __name__ == "__main__":
    if len(sys.argv) < 5:
        print("Uso: python data_cleaning.py <csv_path> <method> <NaN: true|false> <Outliers: true|false>", file=sys.stderr)
        sys.exit(1)

    csv_path = sys.argv[1]
    method = sys.argv[2]
    is_nan = sys.argv[3].lower() == "true"
    is_outliers = sys.argv[4].lower() == "true"

    if not os.path.exists(csv_path):
        print(f" Il file CSV non esiste: {csv_path}", file=sys.stderr)
        sys.exit(1)

    try:
        df = pd.read_csv(csv_path)
    except Exception as e:
        print(f" Errore nella lettura del CSV: {e}", file=sys.stderr)
        sys.exit(1)

    if df is None or df.empty:
        print(" DataFrame vuoto o non caricato", file=sys.stderr)
        sys.exit(1)

    if method == "mean":
        df = clean_mean(df, is_nan, is_outliers)
    elif method == "median":
        df = clean_median(df, is_nan, is_outliers)
    elif method == "ffill":
        df = clean_ffill(df, is_nan, is_outliers)
    elif method == "bfill":
        df = clean_bfill(df, is_nan, is_outliers)
    else:
        print(f" Metodo non valido: {method}", file=sys.stderr)
        sys.exit(1)

    try:
        df.to_csv(csv_path, index=False, sep=",", float_format='%.2f', encoding='utf-8')

        print(f"[DEBUG] CSV aggiornato in: {csv_path}", file=sys.stderr)
    except Exception as e:
        print(f"[ERRORE] Scrittura CSV fallita: {e}", file=sys.stderr)
        sys.exit(1)

    print(df.to_json(orient="records"))
