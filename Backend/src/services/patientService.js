const patientModel = require("../models/Patient");
const bcrypt = require("bcrypt");

// Tutti i pazienti del medico loggato
const getAllPatients = async (doctorId) => {
    return await patientModel.find({ primaryDoctor: doctorId });
};

// Singolo paziente del medico loggato
const getPatientById = async (doctorId, patientId) => {
    return await patientModel.findOne({ _id: patientId, primaryDoctor: doctorId });
};

// Tutti i pazienti critici del medico loggato
const getAllCriticPatients = async (doctorId) => {
    return await patientModel.find({ primaryDoctor: doctorId, isCritical: true });
};

// Creazione di un nuovo paziente assegnato al medico loggato
const createNewPatient = async (patientData, doctorId) => {

    if (
        !patientData.name || !patientData.surname || !patientData.fiscalCode ||
        !patientData.healthCardNumber || !patientData.gender ||
        !patientData.birthDate || !patientData.medicalHistory
    ) {
        throw new Error("Tutti i campi sono obbligatori");
    }


    const newPatient = new patientModel({
        ...patientData,
        primaryDoctor: doctorId
    });
    await newPatient.save();
    return newPatient;
};

// Eliminazione paziente SOLO se appartiene al medico loggato
const deleteNewPatient = async (patientId, doctorId) => {
    return await patientModel.findOneAndDelete({ _id: patientId, primaryDoctor: doctorId });
};

module.exports = {
    getAllPatients,
    getPatientById,
    getAllCriticPatients,
    createNewPatient,
    deleteNewPatient
};
