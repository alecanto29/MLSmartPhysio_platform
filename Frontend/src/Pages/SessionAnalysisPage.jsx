// SessionAnalysisPage.jsx
import React, { useEffect, useRef, useState } from "react";
import Header from "../../src/AtomicComponents/Header";
import "../ComponentsCSS/SessionAnalysisPageStyle.css";
import axios from "axios";
import { useParams } from "react-router-dom";
import Papa from "papaparse";
import { useLocation, useNavigate } from "react-router-dom";
import Plot from "react-plotly.js";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
} from "chart.js";
import i18n from "i18next";
import { useTranslation } from "react-i18next";
import DropDownButtonModel from "../AtomicComponents/DropDownButtonModel";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const SessionAnalysisPage = () => {
    const { sessionId } = useParams();
    const previousSessionIdRef = useRef(null);
    const [dataType, setDataType] = useState("sEMG");
    const [channels, setChannels] = useState([]);
    const [cachedChannels, setCachedChannels] = useState({ sEMG: null, IMU: null });
    const { t } = useTranslation();

    const [openSections, setOpenSections] = useState({
        cleaning: false,
        normalization: false,
        filtering: false,
    });

    const [cleaningOptions, setCleaningOptions] = useState({
        methods: { mean: true, ffill: false, median: false, bfill: false },
        params: { isNaN: true, isOutliers: true, outliers_adv: true },
    });

    const [normalizationOptions, setNormalizationOptions] = useState({
        meanMax: false,
        standard: false,
    });

    const [normalizationStatus, setNormalizationStatus] = useState({
        sEMG: false,
        IMU: false,
    });

    const [filteringOptions, setFilteringOptions] = useState({
        methods: { low: false, high: false, notch: false },
        params: {
            low: { cutoff: "", order: "" },
            high: { cutoff: "", order: "" },
            notch: { cutoff: "", order: "" },
        },
    });

    const [yAxisRangeMap, setYAxisRangeMap] = useState({
        sEMG: { min: 0, max: 4 },
        IMU: { min: -20, max: 20 },
    });

    const yAxisRange = yAxisRangeMap[dataType];

    const setYAxisRange = (newRange) => {
        setYAxisRangeMap((prev) => ({ ...prev, [dataType]: newRange }));
    };

    const location = useLocation();
    const navigate = useNavigate();
    const patientId = location.state?.patientId;

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

    useEffect(() => {
        if (cachedChannels[dataType]) {
            console.log(`📦 Caricamento da cache per ${dataType}`);
            setChannels(cachedChannels[dataType].map((arr) => [...arr]));
        } else {
            fetchParsedCSV(dataType);
        }
    }, [dataType]);

    useEffect(() => {
        if (normalizationStatus[dataType]) return;

        if (dataType === "sEMG") setYAxisRange({ min: 0, max: 4 });
        else setYAxisRange({ min: -20, max: 20 });
    }, [dataType, normalizationStatus]);

    const fetchParsedCSV = async (type = dataType) => {
        try {
            const res = await axios.get(`/smartPhysio/sessions/rawcsv/${sessionId}?dataType=${type}`, {
                responseType: "blob",
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
                            if (!isNaN(val)) chData[i].push(val);
                        }
                    });
                    console.log("Dati canali aggiornati:", chData);
                    setChannels(chData.map((arr) => [...arr]));
                    setCachedChannels((prev) => ({ ...prev, [type]: chData.map((arr) => [...arr]) }));
                },
            });
        } catch (error) {
            console.error("Errore nel fetch del CSV:", error.message);
        }
    };

    const exportAndFetch = async (type = dataType) => {
        try {
            await axios.post(`/smartPhysio/sessions/export/${sessionId}`, { dataType: type });
            console.log("CSV esportato per sessione:", sessionId);
            await fetchParsedCSV(type);
        } catch (error) {
            console.error("Errore in export o fetch CSV:", error.message);
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
                        dataType,
                        isNaN: params.isNaN,
                        isOutliers: params.isOutliers,
                        outliers_adv: params.outliers_adv,
                    });
                    console.log(`Pulizia con ${method} completata`);
                } catch (error) {
                    console.error(`Errore durante la pulizia con ${method}:`, error.message);
                }
            }
        }
        await new Promise((res) => setTimeout(res, 700));
        await fetchParsedCSV();
    };

    const handleNormalizationExecution = async () => {
        const { meanMax, standard } = normalizationOptions;
        try {
            if (meanMax) {
                await axios.post(`/smartPhysio/normalize/minmax`, { sessionId, dataType });
                setYAxisRange({ min: 0, max: 1 });
                setNormalizationStatus((prev) => ({ ...prev, [dataType]: true }));
            }
            if (standard) {
                await axios.post(`/smartPhysio/normalize/standard`, { sessionId, dataType });
                setYAxisRange({ min: -3, max: 3 });
                setNormalizationStatus((prev) => ({ ...prev, [dataType]: true }));
            }
            console.log("Normalizzazione completata");
        } catch (err) {
            console.error("Errore Normalization:", err.message);
        }
        await new Promise((res) => setTimeout(res, 700));
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
                        order: params[method].order,
                    });
                    console.log(`Filtro ${method} applicato`);
                } catch (err) {
                    console.error(`Errore filtro ${method}:`, err.message);
                }
            }
        }
        await new Promise((res) => setTimeout(res, 700));
        await fetchParsedCSV();
    };

    const handleDownloadAnalysis = async () => {
        try {
            const response = await axios.get(`/smartPhysio/sessions/download/${sessionId}/${dataType}`, {
                responseType: "blob",
            });
            const blob = new Blob([response.data], { type: "text/csv" });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", `${sessionId}_${dataType}_analysis.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error(`Errore download ${dataType} csv:`, error.message);
        }
    };

    const toggleSection = (section) => {
        setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
    };

    const renderCharts = () =>
        channels.map((data, i) => {
            const yData = data;
            const xData = Array.from({ length: yData.length }, (_, i) => i);
            return (
                <div key={i} className="graph-container">
                    <h4>{t("CHANNEL")} {i + 1}</h4>
                    <Plot
                        data={[
                            {
                                x: xData,
                                y: yData,
                                type: "scattergl",
                                mode: "lines",
                                line: { color: "rgba(54, 162, 235, 1)", width: 1 },
                            },
                        ]}
                        layout={{
                            width: 1100,
                            height: 300,
                            margin: { l: 50, r: 30, b: 40, t: 30 },
                            title: "",
                            xaxis: { title: "Sample", showgrid: false },
                            yaxis: {
                                title: "Amplitude",
                                range:
                                    dataType === "sEMG"
                                        ? [yAxisRange.min, yAxisRange.max]
                                        : (() => {
                                            const min = Math.min(...yData);
                                            const max = Math.max(...yData);
                                            const padding = (max - min) * 0.1 || 1;
                                            return [min - padding, max + padding];
                                        })(),
                                showgrid: false,
                            },
                        }}
                        config={{ displayModeBar: false, responsive: true }}
                    />
                </div>
            );
        });


    const renderSectionContent = (section) => {
        switch (section) {
            case "cleaning":
                return (
                    <div className="section-content cleaning-structured">
                        <div className="section-title">{t("METHODS")}:</div>
                        <div className="cleaning-methods">
                            {["mean", "ffill", "median", "bfill"].map((key) => (
                                <label key={key}>
                                    {key === "mean" ? t("CLEANING_MEDIAN") :
                                        key === "ffill" ? t("CLEANING_LINEAR_PREVIUOS") :
                                            key === "median" ? t("CLEANING_MEDIAN") :
                                                t("CLEANING_LINEAR_NEXT")}
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
                        <div className="section-title">{t("PARAMETERS")}:</div>
                        <div className="cleaning-params">
                            {["isNaN", "isOutliers", "outliers_adv"].map((key) => (
                                <label key={key}>
                                    {key === "isNaN"
                                        ? t("CLEANING_NAN_VALUES")
                                        : key === "isOutliers"
                                            ? t("CLEANING_OUTLIERS")
                                            : t("CLEANING_OUTLIERS_ADVANCED")}
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
                        <div className="section-title">{t("METHODS")}:</div>
                        <div className="normalization-methods">
                            {["meanMax", "standard"].map((key) => (
                                <label key={key}>
                                    {key === "meanMax" ? t("NORMALIZATION_MIN_MAX_SCALING") : t("NORMALIZATION_STANDARD_SCALING")}
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
                            <strong>{t("METHODS")}: </strong>
                            <strong>{t("PARAMETERS")}:</strong>

                        </div>

                        {[
                            { key: "low", label: t("FILTERING_LOW_PASS"), p1: t("CUTOFF"), p2: t("FILTER_ORDER"), k1: "cutoff", k2: "order" },
                            { key: "high", label: t("FILTERING_HIGH_PASS"), p1: t("CUTOFF"), p2: t("FILTER_ORDER"), k1: "cutoff", k2: "order" },
                            { key: "notch", label: t("FILTERING_NOTCH"), p1: t("CUTOFF"), p2: t("FILTER_QUALITY"), k1: "cutoff", k2: "order" },
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
        { key: "cleaning", label: t("CLEANING_DROP_MENU"), action: handleCleaningExecution },
        { key: "normalization", label: t("NORMALIZATION_DROP_MENU"), action: handleNormalizationExecution },
        { key: "filtering", label: t("FILTERING_DROP_MENU"), action: handleFilteringExecution }
    ];

    const isAnyOpen = Object.values(openSections).some(Boolean);

    return (

        <div className="session-analysis-container">
            <Header />
            <div className="session-title-fixed">
                <div className="session-title-left">
                    <i className="bi bi-search-heart session-icon"></i>
                    <h1>{t("SESSION_ANALYSIS_TITLE")}</h1>
                </div>
                <div className="session-title-right">
                    <DropDownButtonModel
                        buttonText={t("ANALYSIS_MENU")}
                        items={[
                            t("SPECTRUM_ANALYSIS_BUTTON"),
                            t("DOWNLOAD_CSV_BUTTON"),
                            t("RESET_CSV_BUTTON")
                        ]}
                        onItemClick={(item) => {
                            if (item === t("SPECTRUM_ANALYSIS_BUTTON")) {
                                // TODO: implementa la logica di Spectrum analysis
                                console.log("Spectrum analysis triggered");
                            } else if (item === t("DOWNLOAD_CSV_BUTTON")) {
                                handleDownloadAnalysis();
                            } else if (item === t("RESET_CSV_BUTTON")) {
                                setCachedChannels((prev) => ({ ...prev, [dataType]: null }));
                                setYAxisRangeMap((prev) => ({
                                    ...prev,
                                    [dataType]: dataType === "sEMG"
                                        ? { min: 0, max: 4 }
                                        : { min: -20, max: 20 }
                                }));
                                setNormalizationStatus((prev) => ({ ...prev, [dataType]: false }));
                                exportAndFetch(dataType);
                            }
                        }}
                        className="session-options-dropdown"
                    />

                    <DropDownButtonModel
                        buttonText={
                            [{ label: t("SEMG_DATA"), value: "sEMG" }, { label: t("IMU_DATA"), value: "IMU" }]
                                .find((i) => i.value === dataType)?.label ?? "Select"
                        }
                        items={[
                            { label: t("SEMG_DATA"), value: "sEMG" },
                            { label: t("IMU_DATA"), value: "IMU" }
                        ]}
                        onItemClick={(item) => setDataType(item.value)}
                        className="session-data-dropdown"
                    />

                </div>
            </div>

            <div className="scrollable-content">
                <div className="session-analysis-content">

                    <div className="menu-container">
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
                                                className={`bi ${
                                                    openSections[section.key]
                                                        ? "bi-caret-down-fill"
                                                        : "bi-caret-right-fill"
                                                }`}
                                            ></i>
                                        </button>
                                    </div>
                                    {openSections[section.key] && (
                                        <div className="accordion-content">
                                            {renderSectionContent(section.key)}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="charts-container">
                        <h3 className={`graph-title ${isAnyOpen ? "expanded" : "collapsed"}`}>
                            {dataType === "sEMG" ? t("GRAPH_TITLE_SEMG") : t("GRAPH_TITLE_IMU")}
                        </h3>
                        <div className="charts-wrapper">{renderCharts()}</div>
                    </div>

                </div>
            </div>

            <div
                className="back-icon-container"
                onClick={() => navigate(`/patient-session/${patientId}`)}
            >
                <i className="bi bi-arrow-left"></i>
            </div>
        </div>

    );

};

export default SessionAnalysisPage;