import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import ControlPanel from "./ControlPanel.jsx";

import "../../ComponentsCSS/ConnectionGateStyle.css";

/**
 * Componente responsabile della gestione della connessione seriale
 * con le board hardware. Mostra una schermata di caricamento durante la connessione
 * e rende disponibile l'interfaccia principale solo dopo il successo.
 */
const ConnectionGateModel = () => {
    const [connected, setConnected] = useState(false);      // Stato di connessione attiva
    const [loading, setLoading] = useState(true);           // Stato di caricamento connessione
    const [showRetry, setShowRetry] = useState(false);      // Mostra pulsante "Riprova"
    const intervalRef = useRef(null);                 // Ref per l'intervallo "Riprova"
    const statusIntervalRef = useRef(null);           // Ref per l'intervallo di polling stato

    /**
     * Polling per verificare lo stato di connessione con il backend
     */
    const pollConnectionStatus = async () => {
        try {
            const res = await axios.get("http://localhost:5000/smartPhysio/status");

            if (res.data.connected) {
                setConnected(true);
                setLoading(false);

                clearInterval(statusIntervalRef.current);
                clearInterval(intervalRef.current);
            }

        } catch (err) {
            console.warn("Errore nel polling:", err.message);
        }
    };

    /**
     * Tenta di avviare la connessione alle board seriali
     */
    const tryConnect = async () => {
        setLoading(true);
        setShowRetry(false);

        try {
            await axios.post("http://localhost:5000/smartPhysio/start");
        } catch (err) {
            console.warn("Errore avvio connessione:", err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Primo tentativo di connessione e polling stato
        tryConnect();
        pollConnectionStatus();

        // Polling ogni 2 secondi per verificare lo stato di connessione
        statusIntervalRef.current = setInterval(() => {
            pollConnectionStatus();
        }, 2000);

        // Ogni 10 secondi, se non connesso e non in caricamento, mostra "Riprova"
        intervalRef.current = setInterval(() => {
            if (!connected && !loading) {
                setShowRetry(true);
            }
        }, 10000);

        // Gestione chiusura seriale al ricaricamento o chiusura pagina
        const handleBeforeUnload = async () => {
            try {
                navigator.sendBeacon("http://localhost:5000/smartPhysio/stop");
            } catch (error) {
                console.error("Errore nella chiusura delle porte seriali:", error);
            }
        };

        window.addEventListener("beforeunload", handleBeforeUnload);

        // Cleanup in fase di smontaggio componente
        return () => {
            clearInterval(statusIntervalRef.current);
            clearInterval(intervalRef.current);

            // Chiude le connessioni seriali
            axios.post("http://localhost:5000/smartPhysio/stop")
                .then(() => console.log("Connessione seriale chiusa"))
                .catch((err) => console.error("Errore chiusura seriale:", err));

            window.removeEventListener("beforeunload", handleBeforeUnload);
        };
    }, []);

    // Interfaccia mostrata durante la fase di connessione
    if (!connected) {
        return (
            <>
                {loading && (
                    <div className="overlay">
                        <div className="modal">
                            <p>Connessione alla porta seriale in corso...</p>
                        </div>
                    </div>
                )}

                {!loading && (
                    <div className="error-message">
                        <p>Nessuna porta seriale disponibile.</p>
                        {showRetry && (
                            <button
                                onClick={() => {
                                    tryConnect();
                                    setShowRetry(false);
                                }}
                                className="retry-button"
                            >
                                Riprova
                            </button>
                        )}
                    </div>
                )}
            </>
        );
    }

    // Se connesso, mostra il pannello di controllo principale
    if (connected) {
        return <ControlPanel />;
    }

    return null;
};

export default ConnectionGateModel;
