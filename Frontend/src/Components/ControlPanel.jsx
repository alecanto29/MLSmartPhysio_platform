import React, { useEffect, useRef, useState } from "react";
import ButtonModel from "../AtomicComponents/ButtonModel";
import DropDownButtonModel from "../AtomicComponents/DropDownButtonModel";
import axios from "axios";
import "../ComponentsCSS/ControlPanel.css";
import TimerModel from "../Components/TimerModel";
import GraphModel from "./GraphModel.jsx";
import Client from "../Client";

/**
 * Componente principale del pannello di controllo.
 * Permette la selezione del tipo di dato (sEMG/Inerziali),
 * avvio/arresto dello streaming e download dei dati.
 */
const MainMenu = () => {
    const dropdownItems = ["sEMG data", "Inertial data"];
    const [selectedItem, setSelectedItem] = useState("Graph type"); // Tipo di grafico selezionato

    const timerRef = useRef();                // Riferimento al componente TimerModel
    const counter = useRef(0);                // Contatore del tempo per asse X dei grafici
    const [isStreaming, setIsStreaming] = useState(false);  // Stato streaming attivo
    const [graphData, setGraphData] = useState(Array(8).fill().map(() => [])); // Dati per i grafici
    const latestPayload = useRef(Array(8).fill(0)); // Ultimi valori ricevuti (buffer temporaneo)

    /**
     * Gestisce il riempimento progressivo dei grafici durante lo streaming.
     * I dati vengono aggiornati ogni 100ms.
     */
    useEffect(() => {
        if (!isStreaming || !["sEMG data", "Inertial data"].includes(selectedItem)) return;

        const numChannels = selectedItem === "Inertial data" ? 9 : 8;

        const interval = setInterval(() => {
            counter.current += 1;

            setGraphData(prev => {
                // Se cambia il numero di canali, resetta i dati
                if (prev.length !== numChannels) {
                    return Array(numChannels).fill().map(() => []);
                }

                return prev.map((channelData, index) => {
                    const updated = [...channelData, {
                        time: counter.current,
                        value: latestPayload.current[index] ?? 0
                    }];
                    return updated.slice(-100); // Mantiene solo gli ultimi 100 punti
                });
            });
        }, 100);

        return () => clearInterval(interval);
    }, [isStreaming, selectedItem]);

    /**
     * Reset dei grafici ogni volta che cambia il tipo di dato selezionato.
     */
    useEffect(() => {
        if (!["sEMG data", "Inertial data"].includes(selectedItem)) return;

        const numChannels = selectedItem === "Inertial data" ? 9 : 8;
        setGraphData(Array(numChannels).fill().map(() => []));
        latestPayload.current = Array(numChannels).fill(0);
    }, [selectedItem]);

    /**
     * Invia il comando di avvio via API e avvia il timer.
     */
    const handleStart = async () => {
        try {
            timerRef.current?.start();
            await axios.post("/smartPhysio/send", {
                data: ["Start\\r"]
            });
            setIsStreaming(!isStreaming);
        } catch (err) {
            console.error("Errore start:", err);
        }
    };

    /**
     * Invia il comando di stop via API e ferma il timer.
     */
    const handleStop = async () => {
        try {
            timerRef.current?.stop();
            await axios.post("/smartPhysio/send", {
                data: ["Stop\\r"]
            });
            setIsStreaming(!isStreaming);
        } catch (err) {
            console.error("Errore stop:", err);
        }
    };

    /**
     * Gestione selezione voce dal menù a discesa.
     */
    const handleItemClick = (item) => {
        setSelectedItem(item);
    };

    /**
     * Gestione dati in arrivo dal backend tramite il componente <Client />.
     */
    const handleIncomingData = (type, payload) => {
        if ((selectedItem === "Inertial data" && type === "imuData") ||
            (selectedItem === "sEMG data" && type === "sEMG")) {

            if (type === "sEMG") {
                // Ignora valori anomali > 4096
                latestPayload.current = payload.map(val =>
                    typeof val === "number" && val <= 4096 ? val : 0
                );
            } else {
                latestPayload.current = payload;
            }
        }
    };

    /**
     * Avvia il download dei dati in base al tipo selezionato.
     */
    const handleDownload = () => {
        if (selectedItem === "sEMG data") {
            downloadsEMGData();
        } else if (selectedItem === "Inertial data") {
            downloadInertialData();
        }
    };

    /**
     * Scarica i dati sEMG in formato CSV.
     */
    const downloadsEMGData = async () => {
        const response = await axios.get("/smartPhysio/semg/export/csv", {
            responseType: "blob"
        });
        downloadCSVFile(response.data, "sEMG_collection_export.csv");
    };

    /**
     * Scarica i dati inerziali in formato CSV.
     */
    const downloadInertialData = async () => {
        const response = await axios.get("/smartPhysio/inertial/export/csv", {
            responseType: "blob"
        });
        downloadCSVFile(response.data, "inertial_collection_export.csv");
    };

    /**
     * Crea un link e forza il download del file CSV.
     */
    const downloadCSVFile = (blobData, fileName) => {
        const url = URL.createObjectURL(blobData);
        const link = document.createElement("a");
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="main-container">
            {/* Dropdown per selezione tipo dati */}
            <div className="top-left">
                <DropDownButtonModel
                    buttonText={selectedItem}
                    items={dropdownItems}
                    onItemClick={handleItemClick}
                    className="dropdown"
                />
            </div>

            {/* Bottone per download */}
            <div className="top-right">
                <ButtonModel
                    buttonText={<><i className="bi bi-download" style={{ marginRight: '8px' }}></i>Download</>}
                    onClick={handleDownload}
                    className="download-btn"
                    disabled={!["sEMG data", "Inertial data"].includes(selectedItem)}
                />
            </div>

            {/* Grafici e ricezione dati */}
            <div className={`graphContainer ${selectedItem === "Inertial data" ? "scroll-enabled" : "scroll-disabled"}`}>
                <Client isStreaming={isStreaming} onData={handleIncomingData} />
                <GraphModel data={graphData} type={selectedItem} />
            </div>

            {/* Pulsanti di avvio e stop */}
            <div className="bottom-right">
                <ButtonModel
                    buttonText={<><i className="bi bi-play" style={{ marginRight: '8px' }}></i>Start</>}
                    onClick={handleStart}
                    className="start-btn"
                />
                <ButtonModel
                    buttonText={<><i className="bi bi-stop-circle" style={{ marginRight: '8px' }}></i>Stop</>}
                    onClick={handleStop}
                    setIsStreaming={false}
                    className="stop-btn"
                />
            </div>

            {/* Timer visibile solo internamente (ref) */}
            <TimerModel ref={timerRef} />
        </div>
    );
};

export default MainMenu;
