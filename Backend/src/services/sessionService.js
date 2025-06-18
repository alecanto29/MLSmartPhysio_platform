
const sessionModel = require("../models/Session");
const patientModel = require("../models/Patient");


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

    targetSession.save();
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

module.exports = {
    getSession,
    getSessionByID,
    createSession,
    deleteSessionById,
    getPatientSessionById,
    updateSession
}