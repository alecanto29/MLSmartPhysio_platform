
const service = require("../services/inertialDataService")

const express = require("express");

const app = express();
app.use(express.json);


const getData = async (req, res) => {
    try {
        //otteniamo i dati inerziali dal service
        const data = await service.getAllInertialData();

        //format json dei dati ricevuti dal service
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: "Errore restituzione dei dati" });
    }
};

const getDataByChannel = async (req, res) => {
    try {
        //format json dei dati ricevuti dal service per singolo canale passato per id dalla richiesta
        res.json(await service.getDataByChannel(req.params.id));
    } catch (error) {
        res.status(500).json({ error: "Errore restituzione dei dati per canale" });
    }
};


const deleteAllInertialData = async (req, res) => {
    try {
        // cancellazione dei dati inerziali sul db
        const result = await service.deleteAllInertialData();
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: "Errore eliminazione" });
    }
};

const InertialExportAsCSV = async (req, res) => {
    try {

        // Chiama il servizio che recupera i dati inerziali dal db e li converte in stringa CSV
        const csv = await service.InertialasCSVexport();

        // Impostazione header HTTP per risposta contenente file CSV
        res.setHeader("Content-Type", "text/csv");

        // Imposta l'header per forzare il download del file, con nome suggerito "inertial_data.csv"
        res.setHeader("Content-Disposition", "attachment; filename=inertial_data.csv");

        // Invia il file CSV come risposta
        res.status(200).send(csv);

        //cancellazione dati dopo ogni download della sessione
        await service.deleteAllInertialData();
        console.log("Dati Inerziali cancellati");
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getData,
    getDataByChannel,
    deleteAllInertialData,
    InertialExportAsCSV
}