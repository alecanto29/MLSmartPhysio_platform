const patientService = require("../services/patientService");

const getAllPatients = async (req, res) => {
    try {
        const allPatients = await patientService.getAllPatients(req.user.id);
        res.status(200).json(allPatients);
    } catch (error) {
        res.status(500).json({ error: "Errore durante la restituzione dei pazienti" });
    }
};

const getPatientById = async (req, res) => {
    try {
        const patient = await patientService.getPatientById(req.user.id, req.params.id);
        if (!patient) {
            return res.status(404).json({ error: "Paziente non trovato o non autorizzato" });
        }
        res.status(200).json(patient);
    } catch (error) {
        res.status(500).json({ error: `Errore durante la restituzione del paziente con id ${req.params.id}` });
    }
};

const getAllCriticPatients = async (req, res) => {
    try {
        const criticalPatients = await patientService.getAllCriticPatients(req.user.id);
        res.status(200).json(criticalPatients);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const createNewPatient = async (req, res) => {
    try {
        const newPatient = await patientService.createNewPatient(req.body, req.user.id);
        res.status(201).json(newPatient);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const deleteNewPatient = async (req, res) => {
    try {
        const deletedPatient = await patientService.deleteNewPatient(req.params.id, req.user.id);
        if (!deletedPatient) {
            return res.status(404).json({ error: "Paziente non trovato o non autorizzato" });
        }
        res.status(200).json(deletedPatient);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getAllPatients,
    getPatientById,
    getAllCriticPatients,
    createNewPatient,
    deleteNewPatient
};
