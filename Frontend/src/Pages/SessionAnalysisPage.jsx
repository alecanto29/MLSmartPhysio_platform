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

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

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

    const [isSpectrumMode, setIsSpectrumMode] = useState(false);
    const [spectrumData, setSpectrumData] = useState([]);

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

    // tiene sempre l'ultimo sessionId corrente
    useEffect(() => {
        previousSessionIdRef.current = sessionId;
    }, [sessionId]);

// monta: PREVIEW veloce dal DB (no CSV) + avvio export CSV in parallelo
    useEffect(() => {
        let canceled = false;
        const currentType = dataType; // inizialmente 'sEMG'

        (async () => {
            // 1) prova preview istantanea (DB -> downsample -> JSON)
            try {
                const { data: prev } = await axios.get(
                    `/smartPhysio/sessions/preview/${sessionId}`,
                    { params: { dataType: currentType, maxPoints: 3000, sampleLimit: 100000 } }
                );

                if (!canceled && prev?.channels) {
                    applyPreview(prev, currentType);
                } else {
                    // fallback se preview non disponibile
                    await fetchParsedCSV(currentType);
                }
            } catch (e) {
                console.warn("Preview veloce fallita, fallback CSV:", e.message);
                await fetchParsedCSV(currentType);
            }

            // 2) avvia export CSV in background (NO await)
            axios.post(`/smartPhysio/sessions/export/${sessionId}`, { dataType: currentType })
                .catch(err => console.warn("Export CSV async fallito:", err.message));
        })();

        return () => {
            canceled = true;
            const idToDelete = previousSessionIdRef.current ?? sessionId;
            if (idToDelete) {
                // non serve await nel cleanup
                deleteCSV(idToDelete);
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // deps vuote: esegue solo al mount

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

    // --- Downsampling: preserva i picchi (min/max per bucket) ---
    const downsampleMinMax = (arr, targetLength) => {
        if (!Array.isArray(arr) || arr.length === 0) return [];
        const n = arr.length;
        if (n <= targetLength) return arr.slice();

        const out = [];
        for (let k = 0; k < targetLength; k++) {
            const start = Math.floor((k * n) / targetLength);
            const end   = Math.floor(((k + 1) * n) / targetLength);
            let min = Infinity, max = -Infinity, iMin = -1, iMax = -1;

            for (let j = start; j < end; j++) {
                const v = arr[j];
                if (v < min) { min = v; iMin = j; }
                if (v > max) { max = v; iMax = j; }
            }
            if (iMin === -1) continue;             // bucket vuoto (raro)
            // emetti in ordine temporale
            if (iMin <= iMax) {
                out.push(min);
                if (iMax !== iMin) out.push(max);
            } else {
                out.push(max);
                out.push(min);
            }
        }
        // opzionale: garantisci in/out
        if (out.length && out[0] !== arr[0]) out[0] = arr[0];
        if (out.length > 1 && out[out.length - 1] !== arr[n - 1]) out[out.length - 1] = arr[n - 1];

        return out;
    };


    // Applica la preview tornata dal backend agli stati UI
    const applyPreview = (preview, type = dataType) => {
        if (!preview || !Array.isArray(preview.channels)) return;

        // canali downsamplati già pronti
        const reduced = preview.channels.map((arr) => (Array.isArray(arr) ? [...arr] : []));

        setChannels(reduced);
        setCachedChannels((prev) => ({ ...prev, [type]: reduced }));

        // y-range suggerito dal backend (es. dopo normalizzazione)
        if (
            preview.yRange &&
            typeof preview.yRange.min === "number" &&
            typeof preview.yRange.max === "number"
        ) {
            setYAxisRange(preview.yRange);
            setNormalizationStatus((prev) => ({ ...prev, [type]: true }));
        }
    };

    // Numero massimo di punti da mostrare per canale
    const MAX_POINTS = 3000;

    // Cache per gli assi X: key = length, value = [0..length-1]
    const xCache = new Map();
    const getX = (len) => {
        if (xCache.has(len)) return xCache.get(len);
        const arr = Array.from({ length: len }, (_, i) => i);
        xCache.set(len, arr);
        return arr;
    };

    // ---- Target massimo di punti per canale nello spettro ----
    const MAX_SPECTRUM_POINTS = 4000;

    // Binning "min/max per bucket": preserva i picchi (come nel time-domain)
    const binSpectrumMinMax = (x, y, target = MAX_SPECTRUM_POINTS) => {
        if (!x || !y || x.length !== y.length) return { x, y };
        const n = x.length;
        if (n <= target) return { x: x.slice(), y: y.slice() };

        const bucketSize = Math.ceil(n / target);
        const bx = [],
            by = [];
        for (let i = 0; i < n; i += bucketSize) {
            let minY = Infinity,
                maxY = -Infinity;
            let minXi = -1,
                maxXi = -1;
            // troviamo min e max PSD nel bucket
            for (let j = i; j < i + bucketSize && j < n; j++) {
                const vy = y[j];
                if (vy < minY) {
                    minY = vy;
                    minXi = j;
                }
                if (vy > maxY) {
                    maxY = vy;
                    maxXi = j;
                }
            }
            // spingiamo 2 punti (min e max) così i picchi restano visibili
            if (minXi !== -1) {
                bx.push(x[minXi]);
                by.push(y[minXi]);
            }
            if (maxXi !== -1 && maxXi !== minXi) {
                bx.push(x[maxXi]);
                by.push(y[maxXi]);
            }
        }
        return { x: bx, y: by };
    };

    const fetchParsedCSV = async (type = dataType) => {
        try {
            const res = await axios.get(
                `/smartPhysio/sessions/rawcsv/${sessionId}?dataType=${type}`,
                { responseType: "blob" }
            );

            const text = await res.data.text();

            Papa.parse(text, {
                header: true,
                dynamicTyping: true,
                worker: true, // 🔥 usa il web worker interno
                complete: (results) => {
                    const rows = results.data;
                    const numChannels = type === "sEMG" ? 8 : 9;

                    // accumula i canali grezzi
                    const chDataFull = Array.from({ length: numChannels }, () => []);

                    for (let r = 0; r < rows.length; r++) {
                        const row = rows[r];
                        for (let i = 0; i < numChannels; i++) {
                            const v = row[`ch${i + 1}`];
                            if (typeof v === "number" && !Number.isNaN(v)) {
                                chDataFull[i].push(v);
                            }
                        }
                    }

                    // Sottocampionamento PRIMA di settare lo stato
                    const reduced = chDataFull.map((arr) => downsampleMinMax(arr, MAX_POINTS));

                    setChannels(reduced.map((a) => [...a])); // copia difensiva
                    setCachedChannels((prev) => ({
                        ...prev,
                        [type]: reduced.map((a) => [...a]),
                    }));
                },
                error: (err) => {
                    console.error("Errore parsing CSV:", err);
                },
            });
        } catch (error) {
            if (error?.response?.status === 404) {
                // CSV non ancora pronto → log “soft”
                console.info(`[CSV] Non pronto per sessionId=${sessionId}, tipo=${type}`);
                return; // esci senza errore
            }
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

        for (const method of Object.keys(methods)) {
            if (!methods[method]) continue;
            try {
                const { data } = await axios.post(`/smartPhysio/clean/${method}`, {
                    sessionId,
                    dataType,
                    isNaN: params.isNaN,
                    isOutliers: params.isOutliers,
                    outliers_adv: params.outliers_adv,
                });
                // 🔥 usa la preview tornata dallo script Python (Parquet aggiornato)
                if (data && data.preview) applyPreview(data.preview);
                console.log(`Pulizia con ${method} completata`);
            } catch (error) {
                console.error(`Errore durante la pulizia con ${method}:`, error.message);
            }
        }

        // Se in modalità spettro, ricalcola sul working Parquet
        if (isSpectrumMode) {
            try {
                const res = await axios.post(`/smartPhysio/spectrum/spectrumAnalysis`, { sessionId, dataType });
                if (res.data && Array.isArray(res.data)) setSpectrumData(res.data);
            } catch (err) {
                console.error("Errore nell'analisi spettro dopo pulizia:", err.message);
            }
        }
    };

    const handleNormalizationExecution = async () => {
        const { meanMax, standard } = normalizationOptions;

        try {
            if (meanMax) {
                const { data } = await axios.post(`/smartPhysio/normalize/minmax`, { sessionId, dataType });
                if (data && data.preview) applyPreview(data.preview);
            }
            if (standard) {
                const { data } = await axios.post(`/smartPhysio/normalize/standard`, { sessionId, dataType });
                if (data && data.preview) applyPreview(data.preview);
            }
            console.log("Normalizzazione completata");
        } catch (err) {
            console.error("Errore Normalization:", err.message);
        }

        // Se in modalità spettro, ricalcola sul working Parquet
        if (isSpectrumMode) {
            try {
                const res = await axios.post(`/smartPhysio/spectrum/spectrumAnalysis`, { sessionId, dataType });
                if (res.data && Array.isArray(res.data)) setSpectrumData(res.data);
            } catch (err) {
                console.error("Errore nell'analisi spettro dopo normalizzazione:", err.message);
            }
        }
    };

    const handleFilteringExecution = async () => {
        const { methods, params } = filteringOptions;

        for (const method of Object.keys(methods)) {
            if (!methods[method]) continue;

            try {
                const { data } = await axios.post(`/smartPhysio/filter/${method}`, {
                    sessionId,
                    dataType,
                    cutoff: params[method].cutoff,
                    order: params[method].order,
                });
                if (data && data.preview) applyPreview(data.preview);
                console.log(`Filtro ${method} applicato`);
            } catch (err) {
                console.error(`Errore filtro ${method}:`, err.message);
            }
        }

        if (isSpectrumMode) {
            try {
                const res = await axios.post(`/smartPhysio/spectrum/spectrumAnalysis`, { sessionId, dataType });
                if (res.data && Array.isArray(res.data)) setSpectrumData(res.data);
            } catch (err) {
                console.error("Errore nell'analisi spettro dopo filtro:", err.message);
            }
        }
    };

    const handleToggleSpectrum = async () => {
        if (!isSpectrumMode) {
            try {
                const res = await axios.post(`/smartPhysio/spectrum/spectrumAnalysis`, {
                    sessionId,
                    dataType,
                });
                if (res.data && Array.isArray(res.data)) {
                    setSpectrumData(res.data);
                    setIsSpectrumMode(true);
                    console.log("Analisi spettro completata");
                } else {
                    console.warn("Formato dati spettro inatteso:", res.data);
                }
            } catch (err) {
                console.error("Errore nell'analisi spettro:", err.message);
            }
        } else {
            setIsSpectrumMode(false);
            setSpectrumData([]);
        }
    };

    const handleDownloadAnalysis = async () => {
        try {
            const response = await axios.get(
                `/smartPhysio/sessions/download/${sessionId}/${dataType}`,
                {
                    responseType: "blob",
                }
            );
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

    const renderTimeDomainCharts = () =>
        channels.map((yData, i) => {
            const xData = getX(yData.length); // riusa la cache

            return (
                <div key={i} className="graph-container">
                    <h4>
                        {t("CHANNEL")} {i + 1}
                    </h4>
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

    const renderSpectrumCharts = () =>
        spectrumData.map((channelData, i) => {
            const fx = channelData?.frequencies || [];
            const fy = channelData?.psd || [];

            // 🔻 Binning se i punti sono tanti
            // Usa min/max (consigliato per PSD) o mean, come preferisci:
            const { x, y } =
                fx.length > MAX_SPECTRUM_POINTS
                    ? binSpectrumMinMax(fx, fy, MAX_SPECTRUM_POINTS) // oppure binSpectrumMean(fx, fy, MAX_SPECTRUM_POINTS)
                    : { x: fx, y: fy };

            return (
                <div key={i} className="graph-container">
                    <h4>
                        {t("CHANNEL")} {i + 1}
                    </h4>
                    <Plot
                        data={[
                            {
                                x,
                                y,
                                type: "scattergl",
                                mode: "lines",
                                line: { color: "rgba(255, 99, 132, 1)", width: 1 },
                            },
                        ]}
                        layout={{
                            width: 1100,
                            height: 300,
                            margin: { l: 50, r: 30, b: 40, t: 30 },
                            title: "",
                            xaxis: { title: "Frequency (Hz)", showgrid: false },
                            // Se preferisci scala log: yaxis: { type: "log", title: "PSD", showgrid: false }
                            yaxis: { title: "Power Spectral Density", showgrid: false },
                        }}
                        config={{ displayModeBar: false, responsive: true, scrollZoom: true }}
                        useResizeHandler
                        style={{ width: "100%", height: "300px" }}
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
                                    {key === "mean"
                                        ? t("CLEANING_MEDIAN")
                                        : key === "ffill"
                                            ? t("CLEANING_LINEAR_PREVIUOS")
                                            : key === "median"
                                                ? t("CLEANING_MEDIAN")
                                                : t("CLEANING_LINEAR_NEXT")}
                                    <input
                                        type="checkbox"
                                        checked={cleaningOptions.methods[key]}
                                        onChange={() =>
                                            setCleaningOptions((prev) => ({
                                                ...prev,
                                                methods: { ...prev.methods, [key]: !prev.methods[key] },
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
                                                params: { ...prev.params, [key]: !prev.params[key] },
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
                                    {key === "meanMax"
                                        ? t("NORMALIZATION_MIN_MAX_SCALING")
                                        : t("NORMALIZATION_STANDARD_SCALING")}
                                    <input
                                        type="checkbox"
                                        checked={normalizationOptions[key]}
                                        onChange={() =>
                                            setNormalizationOptions((prev) => ({
                                                ...prev,
                                                [key]: !prev[key],
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
                                                methods: { ...prev.methods, [key]: !prev.methods[key] },
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
                                                        [k1]: Number(e.target.value),
                                                    },
                                                },
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
                                                        [k2]: Number(e.target.value),
                                                    },
                                                },
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
        { key: "filtering", label: t("FILTERING_DROP_MENU"), action: handleFilteringExecution },
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
                            isSpectrumMode ? t("RETURN_TIME_DOMAIN") : t("SPECTRUM_ANALYSIS_BUTTON"),
                            t("DOWNLOAD_CSV_BUTTON"),
                            t("RESET_CSV_BUTTON"),
                        ]}
                        onItemClick={async (item) => {
                            // <<< async qui
                            if (
                                item === t("SPECTRUM_ANALYSIS_BUTTON") ||
                                item === t("RETURN_TIME_DOMAIN")
                            ) {
                                handleToggleSpectrum();
                            } else if (item === t("DOWNLOAD_CSV_BUTTON")) {
                                handleDownloadAnalysis();
                            } else if (item === t("RESET_CSV_BUTTON")) {
                                // reset time-domain (com’era già)
                                setCachedChannels((prev) => ({ ...prev, [dataType]: null }));
                                setYAxisRangeMap((prev) => ({
                                    ...prev,
                                    [dataType]:
                                        dataType === "sEMG" ? { min: 0, max: 4 } : { min: -20, max: 20 },
                                }));
                                setNormalizationStatus((prev) => ({ ...prev, [dataType]: false }));

                                await deleteCSV(sessionId);
                                // ricarica CSV iniziale
                                await exportAndFetch(dataType);

                                // *** NUOVO: se sei in spettro, azzera e ricalcola lo spettro iniziale ***
                                if (isSpectrumMode) {
                                    setSpectrumData([]); // pulizia immediata UI
                                    try {
                                        const res = await axios.post(`/smartPhysio/spectrum/spectrumAnalysis`, {
                                            sessionId,
                                            dataType,
                                        });
                                        if (res.data && Array.isArray(res.data)) {
                                            setSpectrumData(res.data); // spettro “originale” dopo il reset
                                        }
                                    } catch (err) {
                                        console.error(
                                            "Errore ricalcolo spettro dopo reset:",
                                            err.message
                                        );
                                    }
                                }
                            }
                        }}
                        className="session-options-dropdown"
                    />

                    <DropDownButtonModel
                        buttonText={
                            [
                                { label: t("SEMG_DATA"), value: "sEMG" },
                                { label: t("IMU_DATA"), value: "IMU" },
                            ].find((i) => i.value === dataType)?.label ?? "Select"
                        }
                        items={[
                            { label: t("SEMG_DATA"), value: "sEMG" },
                            { label: t("IMU_DATA"), value: "IMU" },
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
                                            className={`accordion-button ${
                                                openSections[section.key] ? "active" : ""
                                            }`}
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
                            {dataType === "sEMG"
                                ? t("GRAPH_TITLE_SEMG")
                                : t("GRAPH_TITLE_IMU")}
                        </h3>
                        <div className="charts-wrapper">
                            {isSpectrumMode ? renderSpectrumCharts() : renderTimeDomainCharts()}
                        </div>
                    </div>
                </div>
            </div>

            <div
                className="back-icon-container"
                onClick={async () => {
                    await deleteCSV(sessionId);
                    navigate(`/patient-session/${patientId}`);
                }}
            >
                <i className="bi bi-arrow-left"></i>
            </div>
        </div>
    );
};

export default SessionAnalysisPage;
