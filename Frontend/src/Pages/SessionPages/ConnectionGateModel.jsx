import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import ControlPanel from "./ControlPanel.jsx";
import "../../ComponentsCSS/ConnectionGateStyle.css";

const ConnectionGateModel = () => {
    const [connected, setConnected] = useState(false);
    const [loading, setLoading] = useState(true);
    const [showRetry, setShowRetry] = useState(false);
    const statusIntervalRef = useRef(null);
    const retryIntervalRef = useRef(null);
    const isMountedRef = useRef(true);

    useEffect(() => {
        const cached = localStorage.getItem("boardsConnected");
        if (cached === "true") {
            setConnected(true);
            setLoading(false);
        }
    }, []);

    const pollConnectionStatus = async () => {
        console.log("Polling connection status...");

        try {
            const res = await axios.get("http://localhost:5000/smartPhysio/status");

            if (isMountedRef.current) {
                if (res.data.connected) {

                    localStorage.setItem("boardsConnected", "true");

                    setConnected(true);
                    setLoading(false);

                    clearInterval(statusIntervalRef.current);
                    clearInterval(retryIntervalRef.current);
                } else {

                    localStorage.removeItem("boardsConnected");
                    setConnected(false);
                }
            }
        } catch (err) {
            if (isMountedRef.current) {
                console.warn("Errore nel polling:", err.message);
            }
        }
    };


    useEffect(() => {
        isMountedRef.current = true;

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

        if (!connected) {
            tryConnect();
            pollConnectionStatus();

            statusIntervalRef.current = setInterval(pollConnectionStatus, 2000);
            retryIntervalRef.current = setInterval(() => {
                if (!connected && !loading) setShowRetry(true);
            }, 10000);
        }

        const handleBeforeUnload = () => {
            navigator.sendBeacon("http://localhost:5000/smartPhysio/stop");
        };

        window.addEventListener("beforeunload", handleBeforeUnload);

        return () => {
            isMountedRef.current = false;
            clearInterval(statusIntervalRef.current);
            clearInterval(retryIntervalRef.current);
            window.removeEventListener("beforeunload", handleBeforeUnload);
        };
    }, [connected]);

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
                                    setShowRetry(false);
                                    setLoading(true);
                                    axios.post("http://localhost:5000/smartPhysio/start").finally(() => setLoading(false));
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
