import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import ControlPanel from "./ControlPanel.jsx";
import "../../ComponentsCSS/ConnectionGateStyle.css";

const ConnectionGateModel = () => {
    const [connected, setConnected] = useState(false);
    const [loading, setLoading] = useState(true);
    const [showRetry, setShowRetry] = useState(false);
    const intervalRef = useRef(null);
    const statusIntervalRef = useRef(null);

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
        // ✅ Sempre tenta la connessione (anche dopo un refresh)
        tryConnect();
        pollConnectionStatus();

        statusIntervalRef.current = setInterval(pollConnectionStatus, 2000);
        intervalRef.current = setInterval(() => {
            if (!connected && !loading) setShowRetry(true);
        }, 10000);

        const handleBeforeUnload = () => {
            navigator.sendBeacon("http://localhost:5000/smartPhysio/stop");
        };

        window.addEventListener("beforeunload", handleBeforeUnload);

        return () => {
            clearInterval(statusIntervalRef.current);
            clearInterval(intervalRef.current);
            window.removeEventListener("beforeunload", handleBeforeUnload);
        };
    }, []);

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

    return <ControlPanel />;
};

export default ConnectionGateModel;
