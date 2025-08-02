import pandas as pd
import numpy as np
import sys
import os
from scipy.fft import fft, fftfreq

def spectrum_analyzer(df, sampling_rate=1000):
    n_samples = df.shape[0]
    freqs = fftfreq(n_samples, d=1/sampling_rate)

    result = []
    for ch in df.columns:
        try:
            signal = df[ch].values
            fft_result = fft(signal)
            magnitudes = np.abs(fft_result[:n_samples // 2])
            freqs_half = freqs[:n_samples // 2]

            result.append({
                "channel": ch,
                "frequencies": freqs_half.tolist(),
                "magnitudes": magnitudes.tolist()
            })
        except Exception as e:
            print(f"[ERRORE] FFT fallita sul canale {ch}: {e}", file=sys.stderr)

    return result

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Uso: python spectrumAnalysis.py <csv_path>", file=sys.stderr)
        sys.exit(1)

    csv_path = sys.argv[1]

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
        spectrum_data = spectrum_analyzer(df)
    except Exception as e:
        print(f"[ERRORE] Errore durante l'analisi spettrale: {e}", file=sys.stderr)
        sys.exit(1)

    try:
        import json
        print(json.dumps(spectrum_data))
    except Exception as e:
        print(f"[ERRORE] Output JSON fallito: {e}", file=sys.stderr)
        sys.exit(1)
