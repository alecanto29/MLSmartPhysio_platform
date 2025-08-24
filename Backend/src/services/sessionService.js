// src/services/sessionService.js
const sessionModel = require("../models/Session");
const patientModel = require("../models/Patient");
const sEMGdata = require("../models/sEMGdataModel");
const inertialData = require("../models/inertialDataModel");
const sEMGservice = require("../services/sEMGdataService");
const imuService = require("../services/inertialDataService");

const csv = require("csv-parser");
const fs = require("fs");
const path = require("path");
const { Parser } = require("json2csv");

// ------------------ Sessioni base ------------------
const getSession = async (doctorID) => {
    return await sessionModel.find({ doctor: doctorID });
};

const getSessionByID = async (sessionID, doctorID) => {
    const result = await sessionModel
        .findOne({ doctor: doctorID, _id: sessionID })
        .populate("patient", "name surname")
        .populate("doctor", "name surname");

    return result;
};

// ritorna tutte le sessioni di un paziente in carico ad un dottore
const getPatientSessionById = async (patientID, doctorID) => {
    return await sessionModel.find({ doctor: doctorID, patient: patientID });
};

const createSession = async (sessionData, doctorId) => {
    const today = new Date();
    const formattedDate = today.toISOString().split("T")[0]; // "YYYY-MM-DD"

    const newSession = new sessionModel({
        patient: sessionData.patient,
        data: [],
        doctor: doctorId,
        time: today,
        date: formattedDate,
    });

    await newSession.save();

    await patientModel.findByIdAndUpdate(sessionData.patient, {
        $push: { sessions: newSession._id },
    });

    return newSession;
};

const updateSession = async (newSessionData, doctorID, sessionID) => {
    const targetSession = await getSessionByID(sessionID, doctorID);
    if (!targetSession) throw new Error("Paziente non trovato o non autorizzato");

    targetSession.notes = newSessionData.notes;
    await targetSession.save();
    return targetSession;
};

const deleteSessionById = async (sessionID, doctorID) => {
    const session = await sessionModel.findOneAndDelete({
        _id: sessionID,
        doctor: doctorID,
    });

    if (session) {
        await patientModel.findByIdAndUpdate(session.patient, {
            $pull: { sessions: sessionID },
        });
    }

    return session;
};

// ------------------ CSV: export / delete / download ------------------
const exportSessionCSV = async (sessionID) => {
    try {
        console.log(`[EXPORT CSV] Avvio esportazione per sessione: ${sessionID}`);

        // ➜ ORDINE CRONOLOGICO GARANTITO
        const SEMGdata = await sEMGdata
            .find({ sessionId: sessionID }, { data: 1, _id: 1 })
            .sort({ _id: 1 })
            .lean();

        const IMUdata = await inertialData
            .find({ sessionId: sessionID }, { data: 1, _id: 1 })
            .sort({ _id: 1 })
            .lean();

        console.log(`[EXPORT CSV] sEMG: ${SEMGdata.length}, IMU: ${IMUdata.length}`);

        if (!SEMGdata?.length || !IMUdata?.length) {
            throw new Error("Dati sEMG o IMU mancanti per questa sessione");
        }

        const flatDataSEMG = SEMGdata.map((doc) => {
            const obj = {};
            doc.data.forEach((val, idx) => {
                obj[`ch${idx + 1}`] = (val / 4096) * 3.3;
            });
            return obj;
        });

        const flatDataIMU = IMUdata.map((doc) => {
            const obj = {};
            doc.data.forEach((val, idx) => {
                obj[`ch${idx + 1}`] = val;
            });
            return obj;
        });

        const parser = new Parser();
        const csvsEMG = parser.parse(flatDataSEMG);
        const csvIMU = parser.parse(flatDataIMU);

        const fileNamesEMG = `session_${sessionID}_sEMGdata.csv`;
        const fileNameIMU = `session_${sessionID}_IMUdata.csv`;

        const filePathsEMG = path.join(__dirname, "../../../tmp", fileNamesEMG);
        const filePathsIMU = path.join(__dirname, "../../../tmp", fileNameIMU);

        fs.writeFileSync(filePathsEMG, csvsEMG);
        fs.writeFileSync(filePathsIMU, csvIMU);

        console.log(`[EXPORT CSV] Esportazione completata con successo`);
        return { filePathsEMG, filePathsIMU };
    } catch (err) {
        console.error(`[EXPORT CSV] Errore: ${err.message}`);
        throw new Error(`Errore nell'esportazione CSV: ${err.message}`);
    }
};

const deleteSessionCSV = (sessionID) => {
    // 1) Elimina i CSV in tmp/
    const csvSEMG = path.resolve(
        __dirname,
        "../../../tmp",
        `session_${sessionID}_sEMGdata.csv`
    );
    const csvIMU = path.resolve(
        __dirname,
        "../../../tmp",
        `session_${sessionID}_IMUdata.csv`
    );
    if (fs.existsSync(csvSEMG)) fs.unlinkSync(csvSEMG);
    if (fs.existsSync(csvIMU)) fs.unlinkSync(csvIMU);

    // 2) Svuota COMPLETAMENTE tmp/data_work (file + sottocartelle)
    const dataWorkDir = path.resolve(__dirname, "../../tmp/data_work");
    try {
        if (fs.existsSync(dataWorkDir)) {
            fs.rmSync(dataWorkDir, { recursive: true, force: true });
        }
    } catch (e) {
        console.warn("Clean data_work failed:", dataWorkDir, e.message);
    }

    // 3) Elimina le preview cache
    const previewDir = path.resolve(__dirname, "../../../tmp/previews");
    try {
        if (fs.existsSync(previewDir)) {
            // rimuovi tutti i file che iniziano con sessionID
            const files = fs.readdirSync(previewDir);
            for (const f of files) {
                if (f.includes(`preview_${sessionID}_`)) {
                    fs.unlinkSync(path.join(previewDir, f));
                }
            }
        }
    } catch (e) {
        console.warn("Clean previews failed:", e.message);
    }
};


const downloadSessionCSV = (sessionId, dataType) => {
    const validTypes = ["sEMG", "IMU"];
    if (!validTypes.includes(dataType)) {
        throw new Error("Tipo di dato non valido. Usa 'sEMG' o 'IMU'.");
    }

    const fileName = `session_${sessionId}_${dataType}data.csv`;
    const filePath = path.join(__dirname, "../../../tmp", fileName);

    if (!fs.existsSync(filePath)) {
        throw new Error("Il file richiesto non esiste. Devi prima esportarlo.");
    }

    return filePath;
};

// ------------------ Import ------------------
const importCSVData = async (files, sessionId) => {
    if (!files || files.length !== 2) {
        throw new Error("Servono esattamente 2 file CSV (sEMG e IMU)");
    }

    const [file1, file2] = files;

    const parseCSV = (filePath) =>
        new Promise((resolve, reject) => {
            const results = [];
            fs.createReadStream(filePath)
                .pipe(csv())
                .on("data", (data) => {
                    const row = Object.values(data).map(Number);
                    results.push(row);
                })
                .on("end", () => resolve(results))
                .on("error", (err) => reject(err));
        });

    const data1 = await parseCSV(file1.path);
    const data2 = await parseCSV(file2.path);

    // Determina quale è sEMG (8 canali) e quale è IMU (9 canali)
    const isFirstEMG = data1[0]?.length === 8;
    const sEMGData = isFirstEMG ? data1 : data2;
    const imuData = isFirstEMG ? data2 : data1;

    await sEMGservice.savesEMGdataForImport(sEMGData, sessionId);
    await imuService.saveInertialDataForImport(imuData, sessionId);

    // Elimina file temporanei
    fs.unlinkSync(file1.path);
    fs.unlinkSync(file2.path);
};

// ------------------ Preview veloce ------------------

const { Types } = require("mongoose");
const PREVIEW_CACHE_DIR = path.join(__dirname, "../../../tmp/previews");
if (!fs.existsSync(PREVIEW_CACHE_DIR)) {
    fs.mkdirSync(PREVIEW_CACHE_DIR, { recursive: true });
}

function mkCachePath(sessionID, dataType, maxPoints) {
    return path.join(
        PREVIEW_CACHE_DIR,
        `preview_${sessionID}_${dataType}_${maxPoints}_approx.json`
    );
}

const buildFastPreview = async (
    sessionID,
    dataType = "sEMG",
    maxPoints = 3000
) => {
    const Model = dataType === "sEMG" ? sEMGdata : inertialData;
    const numChannels = dataType === "sEMG" ? 8 : 9;

    // --- CACHE ---
    const cacheFile = mkCachePath(sessionID, dataType, maxPoints);
    if (fs.existsSync(cacheFile)) {
        try {
            return JSON.parse(fs.readFileSync(cacheFile, "utf8"));
        } catch { /* cache corrotta → ricalcola */ }
    }

    // Match robusto
    const idObj = Types.ObjectId.isValid(sessionID) ? new Types.ObjectId(sessionID) : null;
    const matchExpr = idObj
        ? { $or: [{ sessionId: idObj }, { sessionId: sessionID }] }
        : { sessionId: sessionID };

    // Quanti documenti totali
    const total = await Model.countDocuments(matchExpr);
    if (!total) {
        const empty = {
            channels: Array.from({ length: numChannels }, () => []),
            yRange: dataType === "sEMG" ? { min: 0, max: 4 } : { min: 0, max: 0 },
        };
        fs.writeFileSync(cacheFile, JSON.stringify(empty));
        return empty;
    }

    // Campiono un numero limitato di documenti, sparsi
    const sampleSize = Math.min(total, Math.max(maxPoints * 8, 2000));

    const scaleExpr = (i) =>
        dataType === "sEMG"
            ? { $multiply: [{ $divide: [{ $arrayElemAt: ["$data", i] }, 4096] }, 3.3] }
            : { $toDouble: { $arrayElemAt: ["$data", i] } };

    const pipeline = [
        { $match: matchExpr },
        { $sample: { size: sampleSize } },
        { $sort: { _id: 1 } },
        {
            $bucketAuto: {
                groupBy: "$_id",
                buckets: Math.min(maxPoints, sampleSize),
                output: Object.fromEntries(
                    Array.from({ length: numChannels }).flatMap((_, i) => [
                        [`min${i}`, { $min: scaleExpr(i) }],
                        [`max${i}`, { $max: scaleExpr(i) }],
                    ])
                ),
            },
        },
    ];

    const buckets = await Model.aggregate(pipeline).allowDiskUse(true);

    // ricostruzione dai bucket
    const channels = Array.from({ length: numChannels }, () => []);
    let yMin = Infinity, yMax = -Infinity;

    for (const b of buckets) {
        for (let i = 0; i < numChannels; i++) {
            const vmin = b[`min${i}`];
            const vmax = b[`max${i}`];
            if (vmin === undefined && vmax === undefined) continue;
            if (vmin !== undefined) {
                channels[i].push(vmin);
                yMin = Math.min(yMin, vmin);
                yMax = Math.max(yMax, vmin);
            }
            if (vmax !== undefined && vmax !== vmin) {
                channels[i].push(vmax);
                yMin = Math.min(yMin, vmax);
                yMax = Math.max(yMax, vmax);
            }
        }
    }

    const yRange = dataType === "sEMG"
        ? { min: 0, max: 4 }
        : { min: yMin, max: yMax };

    const preview = { channels, yRange };

    // --- Salva in cache ---
    try {
        fs.writeFileSync(cacheFile, JSON.stringify(preview));
    } catch { /* ignore */ }

    return preview;
};





module.exports = {
    getSession,
    getSessionByID,
    createSession,
    deleteSessionById,
    getPatientSessionById,
    updateSession,
    exportSessionCSV,
    deleteSessionCSV,
    downloadSessionCSV,
    importCSVData,
    buildFastPreview,
};
