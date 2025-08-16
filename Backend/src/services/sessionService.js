const sessionModel = require("../models/Session");
const patientModel = require("../models/Patient");
const sEMGdata = require('../models/sEMGdataModel');
const inertialData = require('../models/inertialDataModel');
const sEMGservice = require("../services/sEMGdataService");
const imuService = require("../services/inertialDataService");

const csv = require('csv-parser');

const fs = require('fs');
const path = require('path');
const { Parser } = require('json2csv');

const getSession = async (doctorID) => {
    return await sessionModel.find({ doctor: doctorID });
}

const getSessionByID = async (sessionID, doctorID) => {
    console.log("getSessionByID - Cerco sessione con:", { sessionID, doctorID });

    const result = await sessionModel
        .findOne({ doctor: doctorID, _id: sessionID })
        .populate("patient", "name surname")
        .populate("doctor", "name surname");

    if (!result) {
        console.warn("Nessuna sessione trovata con questi criteri!");
    } else {
        console.log("Sessione trovata:", result);
    }

    return result;
};

// ritorna tutte le sessioni di un paziente in carico ad un dottore
const getPatientSessionById = async (patientID, doctorID) => {
    return await sessionModel.find({ doctor: doctorID, patient: patientID });
}

const createSession = async (sessionData, doctorId) => {
    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0]; // "YYYY-MM-DD"

    const newSession = new sessionModel({
        patient: sessionData.patient,
        data: [],
        doctor: doctorId,
        time: today,
        date: formattedDate
    });

    await newSession.save();

    await patientModel.findByIdAndUpdate(sessionData.patient, {
        $push: { sessions: newSession._id }
    });

    return newSession;
};

const updateSession = async (newSessionData, doctorID, sessionID) => {
    console.log("Ricevuto per update:", { newSessionData, doctorID, sessionID });

    const targetSession = await getSessionByID(sessionID, doctorID);

    if (!targetSession) {
        throw new Error("Paziente non trovato o non autorizzato");
    }

    targetSession.notes = newSessionData.notes;

    await targetSession.save();
    return targetSession;
}

const deleteSessionById = async (sessionID, doctorID) => {
    const session = await sessionModel.findOneAndDelete({
        _id: sessionID,
        doctor: doctorID
    });

    if (session) {
        // Rimuove la sessione anche dal paziente
        await patientModel.findByIdAndUpdate(session.patient, {
            $pull: { sessions: sessionID }
        });
    }

    return session;
};

const exportSessionCSV = async (sessionID) => {
    try {
        console.log(`[EXPORT CSV] Avvio esportazione per sessione: ${sessionID}`);

        const SEMGdata = await sEMGdata.find({ sessionId: sessionID }).lean();
        const IMUdata = await inertialData.find({ sessionId: sessionID }).lean();

        console.log(`[EXPORT CSV] Numero dati sEMG trovati: ${SEMGdata.length}`);
        console.log(`[EXPORT CSV] Numero dati IMU trovati: ${IMUdata.length}`);

        if (!SEMGdata || !IMUdata || SEMGdata.length === 0 || IMUdata.length === 0) {
            console.warn(`[EXPORT CSV] Nessun dato disponibile per la sessione ${sessionID}`);
            throw new Error("Dati sEMG o IMU mancanti per questa sessione");
        }

        const flatDataSEMG = SEMGdata.map(doc => {
            const obj = {};
            doc.data.forEach((val, idx) => {
                obj[`ch${idx + 1}`] = (val / 4096) * 3.3;
            });
            return obj;
        });

        const flatDataIMU = IMUdata.map(doc => {
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

        const filePathsEMG = path.join(__dirname, '../../../tmp', fileNamesEMG);
        const filePathsIMU = path.join(__dirname, '../../../tmp', fileNameIMU);

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
    const csvSEMG = path.resolve(__dirname, '../../../tmp', `session_${sessionID}_sEMGdata.csv`);
    const csvIMU = path.resolve(__dirname, '../../../tmp', `session_${sessionID}_IMUdata.csv`);
    if (fs.existsSync(csvSEMG)) fs.unlinkSync(csvSEMG);
    if (fs.existsSync(csvIMU)) fs.unlinkSync(csvIMU);

    // 2) Svuota COMPLETAMENTE tmp/data_work (file + sottocartelle)
    const dataWorkDir = path.resolve(__dirname, '../../tmp/data_work');

    try {
        if (fs.existsSync(dataWorkDir)) {
            fs.rmSync(dataWorkDir, { recursive: true, force: true });
        }
    } catch (e) {
        console.warn('Clean data_work failed:', dataWorkDir, e.message);
    }
};

const downloadSessionCSV = (sessionId, dataType) => {
    const validTypes = ['sEMG', 'IMU'];
    if (!validTypes.includes(dataType)) {
        throw new Error("Tipo di dato non valido. Usa 'sEMG' o 'IMU'.");
    }

    const fileName = `session_${sessionId}_${dataType}data.csv`;
    const filePath = path.join(__dirname, '../../../tmp', fileName);

    if (!fs.existsSync(filePath)) {
        throw new Error("Il file richiesto non esiste. Devi prima esportarlo.");
    }

    return filePath;
};

const importCSVData = async (files, sessionId) => {
    if (!files || files.length !== 2) {
        console.error("❌ FILES mancanti o non corretti:", files);
        throw new Error("Servono esattamente 2 file CSV (sEMG e IMU)");
    }

    const [file1, file2] = files;

    console.log("✅ File ricevuti:", file1.originalname, file2.originalname);

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

function downsampleMinMax(arr, targetLength) {
    if (!Array.isArray(arr) || arr.length === 0) return [];
    if (arr.length <= targetLength) return arr.slice();

    const bucketSize = Math.ceil(arr.length / targetLength);
    const out = [];

    for (let i = 0; i < arr.length; i += bucketSize) {
        let min = Infinity, max = -Infinity;
        for (let j = i; j < i + bucketSize && j < arr.length; j++) {
            const v = arr[j];
            if (v < min) min = v;
            if (v > max) max = v;
        }
        out.push(min, max); // min e max per ogni bucket
    }

    return out;
}

const buildFastPreview = async (sessionID, dataType = "sEMG", maxPoints = 3000, sampleLimit = 100000) => {
    const Model = dataType === "sEMG" ? sEMGdata : inertialData;
    const numChannels = dataType === "sEMG" ? 8 : 9;

    // Prendiamo SOLO i primi N documenti per avere “first paint” rapidissimo:
    const cursor = Model.find({ sessionId: sessionID }, { data: 1, _id: 0 })
        .lean()
        .limit(sampleLimit)
        .cursor();

    const cols = Array.from({ length: numChannels }, () => []);
    for await (const doc of cursor) {
        const arr = doc.data;
        for (let i = 0; i < numChannels; i++) {
            const v = dataType === "sEMG" ? (arr[i] / 4096) * 3.3 : arr[i];
            cols[i].push(v);
        }
    }

    const channels = cols.map(ch => downsampleMinMax(ch, maxPoints));

    let yMin = Infinity, yMax = -Infinity;
    for (const ch of channels) for (const v of ch) { if (v < yMin) yMin = v; if (v > yMax) yMax = v; }

    const yRange = dataType === "sEMG" ? { min: 0, max: 4 } : { min: yMin, max: yMax };
    return { channels, yRange };
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
    buildFastPreview
};
