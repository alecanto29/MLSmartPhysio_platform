const doctorService = require("../services/DoctorServices");
const express = require ("express");

const app = express();
app.use(express.json());

const getAllDoctors = async (req, res) => {
    try{
        const data = await doctorService.getAllDoctors();

        res.status(200).json(data);
    }catch(error){
        res.status(500).json({error: "Errore durante la restituzione dei dottori"});
    }
};

const getDoctorById = async(req, res) =>{
    try{
        const doctorData = await doctorService.getDoctorById(req.params.id);
        res.json(doctorData);
    }catch(error){
        res.status(500).json({error: `Errore durante la restituzione del medico, id: ${req.params.id}`});
    }
};


const createNewDoctor = async (req, res) => {
    try {
        const doctorData = req.body;
        const newDoctor = await doctorService.createNewDoctor(doctorData);
        res.status(201).json(newDoctor);
    } catch (error) {
        res.status(500).json({ error: "Errore durante la creazione del medico" });
    }
};


const deleteDoctorById = async(req, res) =>{
    try{
        const result = await doctorService.deleteDoctor(req.params.id);

        res.status(200).json(result);
    }catch(error){
        res.status(500).json({error: "Errore durant l'eliminazione del medico"})
    }
};

module.exports = {
    getAllDoctors,
    getDoctorById,
    createNewDoctor,
    deleteDoctorById
};
