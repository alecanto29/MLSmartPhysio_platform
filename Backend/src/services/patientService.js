const patientModel = require("../models/Patient");
const bcrypt = require("bcrypt");
const appointmentsModel = require("../models/Appointment");

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
    await appointmentsModel.deleteMany({ patient: patientId });

    return await patientModel.findOneAndDelete({
        _id: patientId,
        primaryDoctor: doctorId
    });
};

const updatePatientInfo = async (patientData, doctorID, patientID) => {
    // Verifica che il paziente appartenga al medico
    const patient = await patientModel.findOne({ _id: patientID, primaryDoctor: doctorID });
    if (!patient) {
        throw new Error("Paziente non trovato o non autorizzato");
    }

    // Aggiorna solo i campi specificati
    patient.name = patientData.name;
    patient.surname = patientData.surname;
    patient.fiscalCode = patientData.fiscalCode;
    patient.healthCardNumber = patientData.healthCardNumber;
    patient.gender = patientData.gender;
    patient.birthDate = patientData.birthDate;
    patient.medicalHistory = patientData.medicalHistory;
    patient.isCritical = patientData.isCritical;

    await patient.save();
    return patient;
};


module.exports = {
    getAllPatients,
    getPatientById,
    getAllCriticPatients,
    createNewPatient,
    deleteNewPatient,
    updatePatientInfo
};
