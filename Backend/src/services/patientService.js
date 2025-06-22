const patientModel = require("../models/Patient");
const bcrypt = require("bcrypt");
const appointmentsModel = require("../models/Appointment");
const doctorModel = require("../models/Doctor");
const i18next = require("i18next");

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
const createNewPatient = async (patientData, doctorId, lang) => {
    if (
        !patientData.name || !patientData.surname || !patientData.fiscalCode ||
        !patientData.healthCardNumber || !patientData.gender ||
        !patientData.birthDate || !patientData.medicalHistory
    ) {
        throw new Error(i18next.t("ALL_FIELDS_REQUIRED", { lng: lang }));
    }

    const birth = new Date(patientData.birthDate);
    const now = new Date();

    birth.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);

    if (birth > now) {
        throw new Error(i18next.t("FUTURE_DATE", { lng: lang }));
    }

    const newPatient = new patientModel({
        ...patientData,
        primaryDoctor: doctorId
    });

    await newPatient.save();

    await doctorModel.findByIdAndUpdate(
        doctorId,
        { $addToSet: { patientsInCare: newPatient._id } }, // $addToSet evita duplicati
        { new: true }

    );

    return newPatient;
};



// Eliminazione paziente SOLO se appartiene al medico loggato
const deleteNewPatient = async (patientId, doctorId) => {
    await appointmentsModel.deleteMany({ patient: patientId });

    await doctorModel.findByIdAndUpdate(
        doctorId,
        { $pull: { patientsInCare: patientId } }
    );

    return await patientModel.findOneAndDelete({
        _id: patientId,
        primaryDoctor: doctorId
    });
};


const updatePatientInfo = async (patientData, doctorID, patientID, lang) => {
    // Verifica che il paziente appartenga al medico
    const patient = await patientModel.findOne({ _id: patientID, primaryDoctor: doctorID });
    if (!patient) {
        throw new Error("Paziente non trovato o non autorizzato");
    }

    if (
        !patientData.name || !patientData.surname || !patientData.fiscalCode ||
        !patientData.healthCardNumber || !patientData.gender ||
        !patientData.birthDate || !patientData.medicalHistory
    ) {
        throw new Error(i18next.t("ALL_FIELDS_REQUIRED", { lng: lang }));
    }

    const birth = new Date(patientData.birthDate);
    const now = new Date();

    birth.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);

    if (birth > now) {
        throw new Error(i18next.t("FUTURE_DATE", { lng: lang }));
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
