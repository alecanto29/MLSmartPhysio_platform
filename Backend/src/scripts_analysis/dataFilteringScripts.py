import pandas as pd
import sys
from scipy.signal import butter, filtfilt

def low_pass_filtering_butterworth(df, cut_off_frequency, filter_order, sampling_freq=1000):
    nyquist_freq = sampling_freq / 2
    normalized_cutoff = cut_off_frequency / nyquist_freq
    for col_name in df.columns:
        try:
            b, a = butter(N=filter_order, Wn=normalized_cutoff, btype='low', analog=False)
            df[col_name] = filtfilt(b, a, df[col_name])
        except Exception as e:
            print(f"Errore su {col_name}: {e}")
    return df

def high_pass_filtering_butterworth(df, cut_off_frequency, filter_order, sampling_freq=1000):
    nyquist_freq = sampling_freq / 2
    normalized_cutoff = cut_off_frequency / nyquist_freq
    for col_name in df.columns:
        try:
            b, a = butter(N=filter_order, Wn=normalized_cutoff, btype='high', analog=False)
            df[col_name] = filtfilt(b, a, df[col_name])
        except Exception as e:
            print(f"Errore su {col_name}: {e}")
    return df

def band_stop_filtering_butterworth(df, low_cut, high_cut, filter_order, sampling_freq=1000):
    nyquist_freq = sampling_freq / 2
    normalized_low = low_cut / nyquist_freq
    normalized_high = high_cut / nyquist_freq
    for col_name in df.columns:
        try:
            b, a = butter(N=filter_order, Wn=[normalized_low, normalized_high], btype='bandstop', analog=False)
            df[col_name] = filtfilt(b, a, df[col_name])
        except Exception as e:
            print(f"Errore su {col_name}: {e}")
    return df

if __name__ == "__main__":
    if len(sys.argv) < 6:
        print("Uso:\n"
              "Filtro passa basso/alto: python filters.py <csv_path> <low|high> <cutoff> <order> <sampling_freq>\n"
              "Filtro notch:            python filters.py <csv_path> bandstop <low_cut> <high_cut> <order> <sampling_freq>")
        sys.exit(1)

    csv_path = sys.argv[1]
    filter_type = sys.argv[2]

    df = pd.read_csv(csv_path)

    if filter_type == "low":
        cutoff = float(sys.argv[3])
        order = int(sys.argv[4])
        freq = float(sys.argv[5])
        df = low_pass_filtering_butterworth(df, cutoff, order, freq)
    elif filter_type == "high":
        cutoff = float(sys.argv[3])
        order = int(sys.argv[4])
        freq = float(sys.argv[5])
        df = high_pass_filtering_butterworth(df, cutoff, order, freq)
    elif filter_type == "bandstop":
        low_cut = float(sys.argv[3])
        high_cut = float(sys.argv[4])
        order = int(sys.argv[5])
        freq = float(sys.argv[6])
        df = band_stop_filtering_butterworth(df, low_cut, high_cut, order, freq)
    else:
        print(f"Filtro sconosciuto: {filter_type}")
        sys.exit(1)

    # Output JSON per il backend
    print(df.to_json(orient="records"))
