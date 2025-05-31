const Doctor = require("../models/Doctor");

async function getAllDoctors() {
    try {
        const data = await Doctor.find();
        return data;
    }catch(error){
        throw new Error("Errore durante il recupero dei medici dal db");
    }
}

async function getDoctorById(doctorId) {
    try {
        const doctorData = await Doctor.findById(doctorId);
        if (!doctorData) {
            throw new Error(`Nessun medico trovato con id ${doctorId}`);
        }
        return doctorData;
    } catch (error) {
        throw new Error(`Errore durante il recupero del medico con id ${doctorId}`);
    }
}

async function createNewDoctor(doctorData) {
    try {
        if (!doctorData) {
            throw new Error("Tutti i campi sono obbligatori");
        }

        const newDoctor = new Doctor(doctorData);
        await newDoctor.save();

        return newDoctor;
    } catch (error) {
        throw new Error("Errore nella creazione del nuovo medico");
    }
}


async function deleteDoctor(idDoctorToRemove) {
    try {
        const deletedDoctor = await Doctor.findByIdAndDelete(idDoctorToRemove);

        if (!deletedDoctor) {
            throw new Error(`Nessun medico trovato con id: ${idDoctorToRemove}`);
        }

        return deletedDoctor; // oppure `true` o messaggio
    } catch (error) {
        throw new Error(`Errore durante la rimozione del medico con id: ${idDoctorToRemove}`);
    }
}

module.exports = {getAllDoctors, getDoctorById, createNewDoctor, deleteDoctor};