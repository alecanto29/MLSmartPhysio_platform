
const sessionModel = require("../models/Session");


const getSession = async (doctorID) =>{
    return await sessionModel.find({doctor: doctorID});
}

const getSessionByID = async (sessionID, doctorID) =>{
    return await sessionModel.findOne({doctor: doctorID, _id: sessionID});
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
    return newSession;
};


const deleteSessionById = async (sessionID, doctorID) =>{
    return await sessionModel.deleteOne({doctor: doctorID, _id: sessionID});
}

module.exports = {
    getSession,
    getSessionByID,
    createSession,
    deleteSessionById
}