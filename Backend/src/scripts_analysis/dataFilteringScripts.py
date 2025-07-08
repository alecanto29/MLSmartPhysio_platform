import pandas as pd
import sys
import os
from scipy.signal import butter, filtfilt

def low_pass_filtering_butterworth(df, cut_off_frequency, filter_order, sampling_freq=1000):
    nyquist_freq = sampling_freq / 2
    normalized_cutoff = cut_off_frequency / nyquist_freq
    for col_name in df.columns:
        try:
            b, a = butter(N=filter_order, Wn=normalized_cutoff, btype='low', analog=False)
            df[col_name] = filtfilt(b, a, df[col_name])
        except Exception as e:
            print(f"[ERRORE] Filtro Passa Basso su '{col_name}': {e}", file=sys.stderr)
    return df

def high_pass_filtering_butterworth(df, cut_off_frequency, filter_order, sampling_freq=1000):
    nyquist_freq = sampling_freq / 2
    normalized_cutoff = cut_off_frequency / nyquist_freq
    for col_name in df.columns:
        try:
            b, a = butter(N=filter_order, Wn=normalized_cutoff, btype='high', analog=False)
            df[col_name] = filtfilt(b, a, df[col_name])
        except Exception as e:
            print(f"[ERRORE] Filtro Passa Alto su '{col_name}': {e}", file=sys.stderr)
    return df

def notch_filtering_butterworth(df, cutoff_freq, quality_order, sampling_freq=1000):
    nyquist_freq = sampling_freq / 2
    bandwidth = cutoff_freq / quality_order
    low = (cutoff_freq - bandwidth / 2) / nyquist_freq
    high = (cutoff_freq + bandwidth / 2) / nyquist_freq

    for col_name in df.columns:
        try:
            b, a = butter(N=2, Wn=[low, high], btype='bandstop', analog=False)
            df[col_name] = filtfilt(b, a, df[col_name])
        except Exception as e:
            print(f"[ERRORE] Filtro Notch su '{col_name}': {e}", file=sys.stderr)
    return df

if __name__ == "__main__":
    if len(sys.argv) < 5:
        print("Uso:\n"
              "  Passa Basso/Alto: python filters.py <csv_path> <low|high> <cutoff> <order>\n"
              "  Notch (bandstop): python filters.py <csv_path> notch <cutoff_freq> <quality_order>",
              file=sys.stderr)
        sys.exit(1)

    csv_path = sys.argv[1]
    filter_type = sys.argv[2].lower()

    if not os.path.exists(csv_path):
        print(f"[ERRORE] Il file CSV non esiste: {csv_path}", file=sys.stderr)
        sys.exit(1)

    try:
        df = pd.read_csv(csv_path)
    except Exception as e:
        print(f"[ERRORE] Lettura CSV fallita: {e}", file=sys.stderr)
        sys.exit(1)

    if df.empty:
        print("[ERRORE] DataFrame vuoto o non caricato", file=sys.stderr)
        sys.exit(1)

    try:
        if filter_type == "low":
            cutoff = float(sys.argv[3])
            order = int(sys.argv[4])
            df = low_pass_filtering_butterworth(df, cutoff, order)  # default 1000 Hz
        elif filter_type == "high":
            cutoff = float(sys.argv[3])
            order = int(sys.argv[4])
            df = high_pass_filtering_butterworth(df, cutoff, order)
        elif filter_type == "notch":
            cutoff = float(sys.argv[3])
            quality = float(sys.argv[4])
            df = notch_filtering_butterworth(df, cutoff, quality)
        else:
            print(f"[ERRORE] Tipo di filtro non valido: {filter_type}", file=sys.stderr)
            sys.exit(1)
    except Exception as e:
        print(f"[ERRORE] Errore durante il filtraggio: {e}", file=sys.stderr)
        sys.exit(1)

    try:
        df.to_csv(csv_path, index=False, sep=",", float_format='%.2f', encoding='utf-8')
        print(f"[DEBUG] CSV aggiornato correttamente in: {csv_path}", file=sys.stderr)
    except Exception as e:
        print(f"[ERRORE] Scrittura CSV fallita: {e}", file=sys.stderr)
        sys.exit(1)

    print(df.to_json(orient="records"))

