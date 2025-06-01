// Import dei moduli React necessari
import React, {
    forwardRef,             // Permette di passare un ref a un componente figlio
    useImperativeHandle,   // Espone funzioni/metodi a chi utilizza il ref
    useRef,                // Crea riferimenti mutabili che non causano rerender
    useState,              // Hook per gestire lo stato
} from "react";

import "../../ComponentsCSS/Timer.css";

import TextInfoModel from "../../AtomicComponents/TextInfoModel.jsx";

// Definizione del componente TimerModel, controllato tramite `ref` esterno
const TimerModel = forwardRef((props, ref) => {

    // Stato per il tempo trascorso, in millisecondi
    const [elapsed, setElapsed] = useState(0);

    // Riferimento all'intervallo di aggiornamento (avviare/fermare il timer)
    const intervalRef = useRef(null);

    // Riferimento al timestamp in cui è iniziato il timer
    const startTimeRef = useRef(null);

    // Funzione per formattare i valori
    function format(value) {
        //se valore minore di 10 allora -> 03, altrimenti normale
        return value < 10 ? `0${value}` : value;
    }

    // Funzione per avviare il timer
    const start = () => {
        // Se timer è già attivo, non fa nulla
        if (intervalRef.current) return;

        // Calcola l'orario di partenza
        startTimeRef.current = Date.now() - elapsed;

        // Avvia l'intervallo che aggiorna il tempo ogni 50 ms
        intervalRef.current = setInterval(() => {
            const diff = Date.now() - startTimeRef.current;
            setElapsed(diff); // Aggiorna lo stato con il tempo trascorso
        }, 50); // Intervallo di aggiornamento frequente per una visualizzazione fluida
    };

    // Funzione per fermare il timer e resettarlo
    const stop = () => {
        clearInterval(intervalRef.current); // Ferma l'intervallo
        intervalRef.current = null;         // Reset del riferimento
        setElapsed(0);                // Reset del tempo trascorso
    };

    // Espone le funzioni `start` e `stop` al componente genitore tramite ref
    useImperativeHandle(ref, () => ({
        start,
        stop,
    }));

    // Calcola i minuti, i secondi e le "decine di millisecondi" da visualizzare
    const seconds = Math.floor((elapsed / 1000) % 60);
    const minutes = Math.floor((elapsed / 1000 / 60) % 60);
    const tens = Math.floor((elapsed % 1000) / 15); // 1000 ms / 15 = ~60 unità per secondo


    return (
        <div className="bottom-left">
            <div className="clock">
                <div className="timer-display">

                    {/* Etichetta del timer */}
                    <TextInfoModel
                        textInfo={"Session Time: "}
                        className="timer-box"
                    />

                    {/* Minuti */}
                    <TextInfoModel
                        textInfo={format(minutes)}
                        className="timer-box"
                    />

                    {/* Secondi */}
                    <TextInfoModel
                        textInfo={format(seconds)}
                        className="timer-box"
                    />

                    {/* Decimi/centisecondi (frazioni di secondo per effetto visuale) */}
                    <TextInfoModel
                        textInfo={format(tens)}
                        className="timer-box"
                    />

                </div>
            </div>
        </div>
    );
});

export default TimerModel;
