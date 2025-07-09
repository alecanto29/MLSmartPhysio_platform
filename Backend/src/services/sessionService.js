
const sessionModel = require("../models/Session");
const patientModel = require("../models/Patient");
const sEMGdata = require('../models/sEMGdataModel');
const inertialData = require('../models/inertialDataModel');


const fs = require('fs');
const path = require('path');
const { Parser } = require('json2csv');


const getSession = async (doctorID) =>{
    return await sessionModel.find({doctor: doctorID});
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


//ritorna tutte le sessioni di un paziente in carico ad un dottore
const getPatientSessionById = async (patientID, doctorID) =>{
    return await sessionModel.find({doctor: doctorID, patient: patientID});
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
                obj[`ch${idx + 1}`] = (val);
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
    const filePathsEMG = path.join(__dirname, '../../../tmp', `session_${sessionID}_sEMGdata.csv`);
    const filePathIMU = path.join(__dirname, '../../../tmp', `session_${sessionID}_IMUdata.csv`);

    if (fs.existsSync(filePathsEMG)) fs.unlinkSync(filePathsEMG);
    if (fs.existsSync(filePathIMU)) fs.unlinkSync(filePathIMU);
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


module.exports = {
    getSession,
    getSessionByID,
    createSession,
    deleteSessionById,
    getPatientSessionById,
    updateSession,
    exportSessionCSV,
    deleteSessionCSV,
    downloadSessionCSV
}