import React, { useEffect, useRef, useState } from "react";
import Header from "../../src/AtomicComponents/Header";
import "../ComponentsCSS/SessionAnalysisPageStyle.css";
import axios from "axios";
import { useParams } from "react-router-dom";
import Papa from "papaparse";
import Plot from 'react-plotly.js';
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
    const [dataType, setDataType] = useState("sEMG"); // valore iniziale

    const [cleaningOptions, setCleaningOptions] = useState({
        methods: { mean: true, ffill: false, median: false, bfill: false },
        params: { isNaN: true, isOutliers: true, outliers_adv: true }
    });

    const [normalizationOptions, setNormalizationOptions] = useState({
        meanMax: false,
        standard: false
    });

    const [filteringOptions, setFilteringOptions] = useState({
        methods: { low: false, high: false, notch: false },
        params: {
            low: { cutoff: "", order: "" },
            high: { cutoff: "", order: "" },
            notch: { cutoff: "", order: "" }
        }
    });

    const [yAxisRange, setYAxisRange] = useState({ min: 0, max: 4 });

    const [chartKey, setChartKey] = useState(Date.now());

    useEffect(() => {
        setChartKey(Date.now());
    }, [yAxisRange, channels]);

    useEffect(() => {
        const oldSessionId = previousSessionIdRef.current;
        exportAndFetch();
        previousSessionIdRef.current = sessionId;

        return () => {
            deleteCSV(oldSessionId);
        };
    }, [sessionId]);

    const fetchParsedCSV = async (type = dataType) => {
        try {
            const res = await axios.get(`/smartPhysio/sessions/rawcsv/${sessionId}?dataType=${type}`, {
                responseType: "blob"
            });
            const text = await res.data.text();

            Papa.parse(text, {
                header: true,
                dynamicTyping: true,
                complete: (results) => {
                    const data = results.data;
                    const numChannels = type === "sEMG" ? 8 : 9;
                    const chData = Array.from({ length: numChannels }, () => []);

                    data.forEach((row) => {
                        for (let i = 0; i < numChannels; i++) {
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

    const exportAndFetch = async (type = dataType) => {
        try {
            await axios.post(`/smartPhysio/sessions/export/${sessionId}`, { dataType: type });
            console.log("✅ CSV esportato per sessione:", sessionId);
            await fetchParsedCSV(type);
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

    const downsampleMinMax = (array, factor = 50) => {
        const result = [];
        for (let i = 0; i < array.length; i += factor) {
            const chunk = array.slice(i, i + factor);
            const min = Math.min(...chunk);
            const max = Math.max(...chunk);
            result.push(min, max); // Preserva picchi
        }
        return result;
    };

    const handleCleaningExecution = async () => {
        const { methods, params } = cleaningOptions;

        for (const method in methods) {
            if (methods[method]) {
                try {
                    await axios.post(`/smartPhysio/clean/${method}`, {
                        sessionId,
                        dataType,
                        isNaN: params.isNaN,
                        isOutliers: params.isOutliers,
                        outliers_adv: params.outliers_adv
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
        const { meanMax, standard } = normalizationOptions;

        try {
            if (meanMax) {
                await axios.post(`/smartPhysio/normalize/minmax`, { sessionId, dataType });
                setYAxisRange({ min: 0, max: 1 });  // Aggiorna qui
                console.log('yAxisRange', yAxisRange);
            }
            if (standard) {
                await axios.post(`/smartPhysio/normalize/standard`, { sessionId, dataType });
                setYAxisRange({ min: -3, max: 3 }); // o un range adeguato
            }

            console.log("✅ Normalizzazione completata");
        } catch (err) {
            console.error("❌ Errore Normalization:", err.message);
        }

        await new Promise(resolve => setTimeout(resolve, 700));
        await fetchParsedCSV();
    };

    const handleFilteringExecution = async () => {
        const { methods, params } = filteringOptions;

        for (const method in methods) {
            if (methods[method]) {
                try {
                    await axios.post(`/smartPhysio/filter/${method}`, {
                        sessionId,
                        dataType,
                        cutoff: params[method].cutoff,
                        order: params[method].order
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
            const originalLength = data.length;
            const maxPoints = 5000;
            const factor = Math.ceil(originalLength / maxPoints);
            let yData = downsampleMinMax(data, factor);

            // 🔧 Fix se tutti i valori sono uguali (flat line)
            const uniqueY = new Set(yData);
            if (uniqueY.size === 1) {
                const val = yData[0];
                yData = [val - 0.001, val + 0.001]; // aggiungi due punti finti per forzare il rendering
            }

            const xData = Array.from({ length: yData.length }, (_, i) => i * factor);

            return (
                <div key={i} className="graph-container">
                    <h4>Channel {i + 1}</h4>
                    <Plot
                        data={[
                            {
                                x: xData,
                                y: yData,
                                type: 'scattergl',
                                mode: 'lines',
                                line: { color: 'rgba(54, 162, 235, 1)', width: 1 },
                            }
                        ]}
                        layout={{
                            width: 1100,
                            height: 300,
                            margin: { l: 50, r: 30, b: 40, t: 30 },
                            title: '',
                            xaxis: {
                                title: 'Sample',
                                showgrid: false,
                            },
                            yaxis: {
                                title: 'Amplitude',
                                range: (() => {
                                    if (dataType === "sEMG" || dataType === "IMU") {
                                        return [yAxisRange.min, yAxisRange.max];
                                    }
                                    const min = Math.min(...yData);
                                    const max = Math.max(...yData);
                                    return min === max ? [min - 1, max + 1] : [min, max];
                                })(),
                                showgrid: false,
                            }
                        }}
                        config={{
                            displayModeBar: false,
                            responsive: true
                        }}
                    />
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
                            {["isNaN", "isOutliers", "outliers_adv"].map((key) => (
                                <label key={key}>
                                    {key === "isNaN"
                                        ? "NaN Values"
                                        : key === "isOutliers"
                                            ? "Outliers"
                                            : "Advanced Outliers"}
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
                    <div className="section-content filtering-structured filtering-grid-rows">
                        <div className="filtering-row filtering-header">
                            <strong>Metodi: </strong>
                            <strong>Parametri:</strong>

                        </div>

                        {[
                            { key: "low", label: "Low-pass filter", p1: "Cutoff", p2: "Filter Order", k1: "cutoff", k2: "order" },
                            { key: "high", label: "High-pass filter", p1: "Cutoff", p2: "Filter Order", k1: "cutoff", k2: "order" },
                            { key: "notch", label: "Notch filter", p1: "Cutoff", p2: "Quality order", k1: "cutoff", k2: "order" },
                        ].map(({ key, label, p1, p2, k1, k2 }) => (
                            <div key={key} className="filtering-row">
                                <label className="filtering-method-checkbox">
                                    {label}
                                    <input
                                        type="checkbox"
                                        checked={filteringOptions.methods[key]}
                                        onChange={() =>
                                            setFilteringOptions((prev) => ({
                                                ...prev,
                                                methods: { ...prev.methods, [key]: !prev.methods[key] }
                                            }))
                                        }
                                    />
                                </label>
                                <label>
                                    {p1}:
                                    <input
                                        type="number"
                                        value={filteringOptions.params[key][k1]}
                                        onChange={(e) =>
                                            setFilteringOptions((prev) => ({
                                                ...prev,
                                                params: {
                                                    ...prev.params,
                                                    [key]: {
                                                        ...prev.params[key],
                                                        [k1]: Number(e.target.value)
                                                    }
                                                }
                                            }))
                                        }
                                    />
                                </label>
                                <label>
                                    {p2}:
                                    <input
                                        type="number"
                                        value={filteringOptions.params[key][k2]}
                                        onChange={(e) =>
                                            setFilteringOptions((prev) => ({
                                                ...prev,
                                                params: {
                                                    ...prev.params,
                                                    [key]: {
                                                        ...prev.params[key],
                                                        [k2]: Number(e.target.value)
                                                    }
                                                }
                                            }))
                                        }
                                    />
                                </label>
                            </div>
                        ))}
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
                <select
                    value={dataType}
                    onChange={(e) => {
                        setDataType(e.target.value);
                        exportAndFetch(e.target.value); // forza il refetch
                    }}
                    className="data-type-select"
                >
                    <option value="sEMG">sEMG</option>
                    <option value="IMU">IMU</option>
                </select>
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
                    <h3 className="graph-title">
                        {dataType === "sEMG" ? "sEMG Signal Visualization (8 Channels)" : "IMU Signal Visualization (9 Channels)"}
                    </h3>

                    <div className="charts-wrapper">
                        {renderCharts()}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SessionAnalysisPage;
