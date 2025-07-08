
const sessionModel = require("../models/Session");
const patientModel = require("../models/Patient");
const sEMGdata = require('../models/sEMGdataModel');


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

        const data = await sEMGdata.find({ sessionId: sessionID }).lean();
        console.log(`[EXPORT CSV] Numero dati sEMG trovati: ${data.length}`);

        if (!data || data.length === 0) {
            console.warn(`[EXPORT CSV] Nessun dato sEMG trovato per la sessione ${sessionID}`);
            throw new Error("Nessun dato sEMG disponibile per questa sessione");
        }

        const flatData = data.map((doc, i) => {
            const obj = {};
            doc.data.forEach((val, idx) => {
                obj[`ch${idx + 1}`] = (val/4096)*3.3;
            });
            return obj;
        });
        console.log(`[EXPORT CSV] Dati flatten trasformati per il CSV (prima riga):`, flatData[0]);

        const parser = new Parser();
        const csv = parser.parse(flatData);
        console.log(`[EXPORT CSV] CSV generato, lunghezza caratteri: ${csv.length}`);

        const fileName = `session_${sessionID}_data.csv`;
        const filePath = path.join(__dirname, '../../../tmp', fileName);
        console.log(`[EXPORT CSV] Scrivo CSV su file: ${filePath}`);

        fs.writeFileSync(filePath, csv);

        console.log(`[EXPORT CSV] Esportazione completata con successo`);
        return filePath;

    } catch (err) {
        console.error(`[EXPORT CSV] Errore: ${err.message}`);
        throw new Error(`Errore nell'esportazione CSV: ${err.message}`);
    }
};


const deleteSessionCSV = (sessionID) => {
    const filePath = path.join(__dirname, '../../../tmp', `session_${sessionID}_data.csv`);
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    }
};

module.exports = {
    getSession,
    getSessionByID,
    createSession,
    deleteSessionById,
    getPatientSessionById,
    updateSession,
    exportSessionCSV,
    deleteSessionCSV
}