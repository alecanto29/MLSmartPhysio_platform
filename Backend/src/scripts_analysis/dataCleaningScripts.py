import pandas as pd
import numpy as np
import sys
import os

def get_bounds(df_col, outliers_adv, use_median=False, dataType="sEMG"):
    if dataType == "sEMG":
        min_threshold = 0
        max_threshold = 4096
    elif dataType == "IMU":
        min_threshold = -100
        max_threshold = 100
    else:
        raise ValueError(f"Tipo di dato non valido: {dataType}")

    # Filtro percentili (10°–90°) per evitare estremi
    lower_q = df_col.quantile(0.10)
    upper_q = df_col.quantile(0.90)
    filtered = df_col[(df_col >= lower_q) & (df_col <= upper_q)]

    center = filtered.median() if use_median else filtered.mean()
    spread = filtered.std()

    if outliers_adv:
        lower_bound = center - 3 * spread
        upper_bound = center + 3 * spread
    else:
        lower_bound = min_threshold
        upper_bound = max_threshold

    return lower_bound, upper_bound, min_threshold, max_threshold


def clean_column(df_col, is_nan, is_out, lower_bound, upper_bound, replacement_value, min_threshold, max_threshold):
    for i in range(len(df_col)):
        val = df_col.iat[i]
        if is_nan and pd.isna(val):
            df_col.iat[i] = replacement_value
        elif is_out and (val < lower_bound or val > upper_bound):
            df_col.iat[i] = replacement_value
    return df_col.clip(lower=min_threshold, upper=max_threshold)


def clean_mean(df, is_nan, is_out, outliers_adv, dataType):
    for col in df.columns:
        df[col] = df[col].astype(float)
        lb, ub, min_t, max_t = get_bounds(df[col], outliers_adv, dataType=dataType)
        valid_values = df[col][(df[col] >= lb) & (df[col] <= ub)]
        replacement = valid_values.mean() if not valid_values.empty else 0
        df[col] = clean_column(df[col], is_nan, is_out, lb, ub, replacement, min_t, max_t)
    return df


def clean_median(df, is_nan, is_out, outliers_adv, dataType):
    for col in df.columns:
        df[col] = df[col].astype(float)
        lb, ub, min_t, max_t = get_bounds(df[col], outliers_adv, use_median=True, dataType=dataType)
        valid_values = df[col][(df[col] >= lb) & (df[col] <= ub)]
        replacement = valid_values.median() if not valid_values.empty else 0
        df[col] = clean_column(df[col], is_nan, is_out, lb, ub, replacement, min_t, max_t)
    return df


def clean_ffill(df, is_nan, is_out, outliers_adv, dataType):
    for col in df.columns:
        df[col] = df[col].astype(float)
        lb, ub, min_t, max_t = get_bounds(df[col], outliers_adv, dataType=dataType)
        for i in range(1, len(df)):
            val = df.at[i, col]
            if (is_nan and pd.isna(val)) or (is_out and (val < lb or val > ub)):
                df.at[i, col] = df.at[i - 1, col]
        df[col] = df[col].clip(lower=min_t, upper=max_t)
    return df


def clean_bfill(df, is_nan, is_out, outliers_adv, dataType):
    for col in df.columns:
        df[col] = df[col].astype(float)
        lb, ub, min_t, max_t = get_bounds(df[col], outliers_adv, dataType=dataType)
        for i in range(len(df) - 2, -1, -1):
            val = df.at[i, col]
            if (is_nan and pd.isna(val)) or (is_out and (val < lb or val > ub)):
                df.at[i, col] = df.at[i + 1, col]
        df[col] = df[col].clip(lower=min_t, upper=max_t)
    return df


if __name__ == "__main__":
    if len(sys.argv) < 7:
        print("Uso: python data_cleaning.py <csv_path> <method> <NaN: true|false> <Outliers: true|false> <Advanced: true|false> <dataType>", file=sys.stderr)
        sys.exit(1)

    csv_path = sys.argv[1]
    method = sys.argv[2]
    is_nan = sys.argv[3].lower() == "true"
    is_outliers = sys.argv[4].lower() == "true"
    outliers_adv = sys.argv[5].lower() == "true"
    dataType = sys.argv[6]

    if dataType not in ["sEMG", "IMU"]:
        print(f"[ERRORE] dataType deve essere 'sEMG' o 'IMU', ricevuto: {dataType}", file=sys.stderr)
        sys.exit(1)

    if not os.path.exists(csv_path):
        print(f"[ERRORE] Il file CSV non esiste: {csv_path}", file=sys.stderr)
        sys.exit(1)

    try:
        df = pd.read_csv(csv_path)
    except Exception as e:
        print(f"[ERRORE] Lettura CSV fallita: {e}", file=sys.stderr)
        sys.exit(1)

    if df is None or df.empty:
        print("[ERRORE] DataFrame vuoto o non caricato", file=sys.stderr)
        sys.exit(1)

    try:
        if method == "mean":
            df = clean_mean(df, is_nan, is_outliers, outliers_adv, dataType)
        elif method == "median":
            df = clean_median(df, is_nan, is_outliers, outliers_adv, dataType)
        elif method == "ffill":
            df = clean_ffill(df, is_nan, is_outliers, outliers_adv, dataType)
        elif method == "bfill":
            df = clean_bfill(df, is_nan, is_outliers, outliers_adv, dataType)
        else:
            print(f"[ERRORE] Metodo non valido: {method}", file=sys.stderr)
            sys.exit(1)
    except Exception as e:
        print(f"[ERRORE] Errore durante la pulizia dei dati: {e}", file=sys.stderr)
        sys.exit(1)

    try:
        df.to_csv(csv_path, index=False, sep=",", float_format='%.2f', encoding='utf-8')
        print(f"[DEBUG] CSV aggiornato correttamente in: {csv_path}", file=sys.stderr)
    except Exception as e:
        print(f"[ERRORE] Scrittura CSV fallita: {e}", file=sys.stderr)
        sys.exit(1)

    print(df.to_json(orient="records"))
