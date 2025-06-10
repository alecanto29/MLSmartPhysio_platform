const sEMGService = require("../services/sEMGdataService");

const express = require("express");

const app = express();
app.use(express.json()); // Assicura che Express possa leggere il body JSON


const getData = async (req, res) => {
    try {
        //otteniamo i dati sEMG dal service
        const data = await sEMGService.getAllsEMGdata();

        //format dei dati in json
        res.status(200).json(data);
        return data;
    } catch (error) {
        res.status(500).json({ error: "Errore restituzione dei dati" });
    }
};

const getAllsEMGdataBySession = async (req, res) => {
    try{
        const sessionData = await sEMGService.getAllsEMGdataBySession(req.params.id);
        res.status(200).json(sessionData);
    }catch(error){
        res.status(500).json({error: error.message});
    }
}

const getDataByChannel = async (req, res) => {
    try {
        //otteniamo i dati sEMG relativi ad un canale passato per id preso dalla richiesta
        res.json(await sEMGService.getDataByChannel(req.params.id));
    } catch (error) {
        res.status(500).json({ error: "Errore restituzione dei dati per canale" });
    }
};


const deleteAllsEMGdata = async (req, res) => {
    try {
        //cancellazione dei dati sEMG da db
        const result = await sEMGService.deleteAllsEMGdata();
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: "Errore eliminazione" });
    }
};

const deleteAllsEMGdataBySession = async (req, res) =>{
    try{
        const result = await sEMGService.deleteAllsEMGdataBySession(req.params.id);
        res.json(result);
    }catch(error){
        res.status(500).json({error: error.message});
    }
}

const sEMGexportAsCSV = async (req, res) => {
    try {

        // Chiama il servizio che recupera i dati sEMG dal db e li converte in stringa CSV
        const csv = await sEMGService.sEMGasCSVexport();

        // Impostazione header HTTP per risposta contenente file CSV
        res.setHeader("Content-Type", "text/csv");

        // Imposta l'header per forzare il download del file, con nome suggerito "semg_data.csv"
        res.setHeader("Content-Disposition", "attachment; filename=semg_data.csv");

        // Invia il file CSV come risposta
        res.status(200).send(csv);

        //cancellazione dei dati sEMG dal db dopo il download di ogni sessione
        await sEMGService.deleteAllsEMGdata();
        console.log("Dati sEMG cancellati dal database");
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getData,
    getDataByChannel,
    deleteAllsEMGdata,
    sEMGexportAsCSV,
    deleteAllsEMGdataBySession,
    getAllsEMGdataBySession
};
