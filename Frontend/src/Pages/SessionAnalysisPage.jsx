import React, { useEffect, useRef, useState } from "react";
import Header from "../../src/AtomicComponents/Header";
import "../ComponentsCSS/SessionAnalysisPageStyle.css";
import axios from "axios";
import { useParams } from "react-router-dom";
import Papa from "papaparse";
import { Line } from "react-chartjs-2";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const SessionAnalysisPage = () => {
    const [openSections, setOpenSections] = useState({
        cleaning: false,
        normalization: false,
        filtering: false,
    });

    const { sessionId } = useParams();
    const previousSessionIdRef = useRef(null);
    const [channels, setChannels] = useState([]);

    const [cleaningOptions, setCleaningOptions] = useState({
        methods: { mean: true, ffill: false, median: false, bfill: false },
        params: { isNaN: true, isOutliers: true }
    });

    const [normalizationOptions, setNormalizationOptions] = useState({
        meanMax: false,
        standard: false
    });

    const [filteringOptions, setFilteringOptions] = useState({
        methods: { lowpass: false, highpass: false, bandstop: false },
        params: { cutoff: 19, high: "", low: "", order: 1 }
    });

    useEffect(() => {
        const oldSessionId = previousSessionIdRef.current;
        exportAndFetch();
        previousSessionIdRef.current = sessionId;

        return () => {
            deleteCSV(oldSessionId);
        };
    }, [sessionId]);

    const fetchParsedCSV = async () => {
        try {
            const res = await axios.get(`/smartPhysio/sessions/rawcsv/${sessionId}`, {
                responseType: "blob"
            });
            const text = await res.data.text();

            Papa.parse(text, {
                header: true,
                dynamicTyping: true,
                complete: (results) => {
                    const data = results.data;
                    const chData = Array.from({ length: 8 }, () => []);

                    data.forEach((row) => {
                        for (let i = 0; i < 8; i++) {
                            const val = row[`ch${i + 1}`];
                            if (!isNaN(val)) {
                                chData[i].push(val);
                            }
                        }
                    });

                    console.log("📊 Dati canali aggiornati:", chData);
                    setChannels(chData.map(arr => [...arr]));
                },
            });
        } catch (error) {
            console.error("❌ Errore nel fetch del CSV:", error.message);
        }
    };

    const exportAndFetch = async () => {
        try {
            await axios.post(`/smartPhysio/sessions/export/${sessionId}`);
            console.log("✅ CSV esportato per sessione:", sessionId);

            await fetchParsedCSV();
        } catch (error) {
            console.error("❌ Errore in export o fetch CSV:", error.message);
        }
    };

    const deleteCSV = async (sessionIdToDelete) => {
        if (!sessionIdToDelete) return;
        try {
            console.log("🧹 Eliminazione CSV per:", sessionIdToDelete);
            await axios.delete(`/smartPhysio/sessions/clean/${sessionIdToDelete}`);
        } catch (error) {
            console.error("❌ Errore nella cancellazione del CSV:", error.message);
        }
    };

    const handleCleaningExecution = async () => {
        const { methods, params } = cleaningOptions;

        for (const method in methods) {
            if (methods[method]) {
                try {
                    await axios.post(`/smartPhysio/clean/${method}`, {
                        sessionId,
                        isNaN: params.isNaN,
                        isOutliers: params.isOutliers
                    });

                    console.log(`✅ Pulizia con ${method} completata`);
                } catch (error) {
                    console.error(`❌ Errore durante la pulizia con ${method}:`, {
                        message: error.message,
                        response: error.response?.data || "Nessuna risposta dal server"
                    });
                }
            }
        }

        await new Promise(resolve => setTimeout(resolve, 700));
        await fetchParsedCSV(); // ⬅️ aggiorna i grafici
    };

    const handleNormalizationExecution = async () => {
        const csvPath = `/tmp/session_${sessionId}_data.csv`;
        const { meanMax, standard } = normalizationOptions;

        try {
            if (meanMax)
                await axios.post(`/smartPhysio/normalize/meanMax`, { csvPath });
            if (standard)
                await axios.post(`/smartPhysio/normalize/standard`, { csvPath });

            console.log("✅ Normalizzazione completata");
        } catch (err) {
            console.error("❌ Errore Normalization:", err.message);
        }

        await new Promise(resolve => setTimeout(resolve, 700));
        await fetchParsedCSV(); // ⬅️ aggiorna i grafici
    };

    const handleFilteringExecution = async () => {
        const { methods, params } = filteringOptions;
        const csvPath = `/tmp/session_${sessionId}_data.csv`;

        for (const method in methods) {
            if (methods[method]) {
                try {
                    await axios.post(`/smartPhysio/filter/${method}`, {
                        csvPath,
                        ...params
                    });
                    console.log(`✅ Filtro ${method} applicato`);
                } catch (err) {
                    console.error(`❌ Errore filtro ${method}:`, err.message);
                }
            }
        }

        await new Promise(resolve => setTimeout(resolve, 700));
        await fetchParsedCSV(); // ⬅️ aggiorna i grafici
    };

    const toggleSection = (section) => {
        setOpenSections((prev) => ({
            ...prev,
            [section]: !prev[section],
        }));
    };

    const renderCharts = () => {
        return channels.map((data, i) => {
            const chartData = {
                datasets: [
                    {
                        label: `Channel ${i + 1}`,
                        data: data.map((y, x) => ({ x, y })),
                        borderColor: "rgba(54, 162, 235, 1)",
                        borderWidth: 1,
                        pointRadius: 0,
                        fill: false
                    }
                ]
            };

            const stepX = 2500;
            const stepY = 500;

            const lastSample = data.length - 1;
            const maxTickX = Math.floor(lastSample / stepX) *stepX;
            const paddingX = stepX / 5;
            const maxX = lastSample;
            const maxY = Math.ceil(4096 / stepY) * stepY;

// Genera solo i tick desiderati
            const tickValuesX = [];
            for (let i = 0; i <= maxTickX; i += stepX) {
                tickValuesX.push(i);
            }

            const options = {
                responsive: true,
                plugins: {
                    legend: { display: false },
                    title: { display: false }
                },
                scales: {
                    x: {
                        type: 'linear',
                        min: 0,
                        max: maxX,
                        title: {
                            display: true,
                            text: "Sample"
                        },
                        ticks: {
                            callback: (value) => {
                                // Mostra solo 0, 2500, 5000, 7500, ecc.
                                return value % stepX === 0 ? value : '';
                            },
                            stepSize: 250, // valore piccolo per assicurare che generi abbastanza tick da filtrare
                            autoSkip: false
                        }
                    },
                    y: {
                        min: 0,
                        max: maxY,
                        title: {
                            display: true,
                            text: "Amplitude"
                        },
                        ticks: {
                            stepSize: stepY
                        }
                    }
                }
            };


            return (
                <div key={i} className="graph-container">
                    <h4>Channel {i + 1}</h4>
                    <Line key={`channel-${i}-${Date.now()}`} data={chartData} options={options} />
                </div>
            );
        });
    };

    const renderSectionContent = (section) => {
        switch (section) {
            case "cleaning":
                return (
                    <div className="section-content cleaning-structured">
                        <div className="section-title">Metodi:</div>
                        <div className="cleaning-methods">
                            {["mean", "ffill", "median", "bfill"].map((key) => (
                                <label key={key}>
                                    {key === "mean" ? "Mean replacement" :
                                        key === "ffill" ? "Linear interpolation - previous value" :
                                            key === "median" ? "Median replacement" :
                                                "Linear interpolation - next value"}
                                    <input
                                        type="checkbox"
                                        checked={cleaningOptions.methods[key]}
                                        onChange={() =>
                                            setCleaningOptions((prev) => ({
                                                ...prev,
                                                methods: { ...prev.methods, [key]: !prev.methods[key] }
                                            }))
                                        }
                                    />
                                </label>
                            ))}
                        </div>
                        <div className="section-title">Parametri:</div>
                        <div className="cleaning-params">
                            {["isNaN", "isOutliers"].map((key) => (
                                <label key={key}>
                                    {key === "isNaN" ? "NaN Values" : "Outliers value"}
                                    <input
                                        type="checkbox"
                                        checked={cleaningOptions.params[key]}
                                        onChange={() =>
                                            setCleaningOptions((prev) => ({
                                                ...prev,
                                                params: { ...prev.params, [key]: !prev.params[key] }
                                            }))
                                        }
                                    />
                                </label>
                            ))}
                        </div>
                    </div>
                );

            case "normalization":
                return (
                    <div className="section-content normalization-structured">
                        <div className="section-title">Metodi:</div>
                        <div className="normalization-methods">
                            {["meanMax", "standard"].map((key) => (
                                <label key={key}>
                                    {key === "meanMax" ? "Mean - Max Scaling" : "Standard Scaling"}
                                    <input
                                        type="checkbox"
                                        checked={normalizationOptions[key]}
                                        onChange={() =>
                                            setNormalizationOptions((prev) => ({
                                                ...prev,
                                                [key]: !prev[key]
                                            }))
                                        }
                                    />
                                </label>
                            ))}
                        </div>
                    </div>
                );

            case "filtering":
                return (
                    <div className="section-content filtering-structured">
                        <div className="section-title">Metodi:</div>
                        <div className="filtering-methods">
                            {["lowpass", "highpass", "bandstop"].map((type) => (
                                <label key={type}>
                                    {type.replace(/^\w/, (c) => c.toUpperCase()).replace("pass", "-pass filter")}
                                    <input
                                        type="checkbox"
                                        checked={filteringOptions.methods[type]}
                                        onChange={() =>
                                            setFilteringOptions((prev) => ({
                                                ...prev,
                                                methods: { ...prev.methods, [type]: !prev.methods[type] }
                                            }))
                                        }
                                    />
                                </label>
                            ))}
                        </div>

                        <div className="section-title">Parametri:</div>
                        <div className="filtering-params">
                            {["cutoff", "high", "low", "order"].map((key) => (
                                <label key={key} className="number-label">
                                    {key.charAt(0).toUpperCase() + key.slice(1)}:
                                    <input
                                        type="number"
                                        value={filteringOptions.params[key]}
                                        onChange={(e) =>
                                            setFilteringOptions((prev) => ({
                                                ...prev,
                                                params: {
                                                    ...prev.params,
                                                    [key]: key === "order" || key === "cutoff" ? Number(e.target.value) : e.target.value
                                                }
                                            }))
                                        }
                                    />
                                </label>
                            ))}
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    const sections = [
        { key: "cleaning", label: "Data cleaning", action: handleCleaningExecution },
        { key: "normalization", label: "Normalization", action: handleNormalizationExecution },
        { key: "filtering", label: "Data Filtering", action: handleFilteringExecution }
    ];

    const isAnyOpen = Object.values(openSections).some(Boolean);

    return (
        <div className="session-analysis-container">
            <Header />
            <div className="session-title-fixed">
                <i className="bi bi-search-heart session-icon"></i>
                <h1>Session Analysis</h1>
            </div>
            <div className="scrollable-content">
                <div className="session-analysis-content">
                    <div className={`accordion-wrapper ${isAnyOpen ? "expanded" : ""}`}>
                        {sections.map((section) => (
                            <div key={section.key} className="accordion-section">
                                <div className="accordion-header">
                                    {openSections[section.key] && (
                                        <button
                                            className="start-button"
                                            onClick={section.action}
                                            title={`Esegui ${section.label}`}
                                        >
                                            ▶
                                        </button>
                                    )}
                                    <button
                                        className={`accordion-button ${openSections[section.key] ? "active" : ""}`}
                                        onClick={() => toggleSection(section.key)}
                                    >
                                        {section.label}
                                        <i
                                            className={`bi ${openSections[section.key] ? "bi-caret-down-fill" : "bi-caret-right-fill"}`}
                                        ></i>
                                    </button>
                                </div>
                                {openSections[section.key] && (
                                    <div className="accordion-content">{renderSectionContent(section.key)}</div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* GRAFICI EMG */}
                    <div className="graph-section">
                        <h3 className="graph-title">EMG Signal Visualization (8 Channels)</h3>
                        {renderCharts()}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SessionAnalysisPage;
