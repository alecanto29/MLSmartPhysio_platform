const express = require("express");
const router = express.Router();


const sessionController = require("../controller/sessionController");
const auth = require("../middleware/auth");

router.get("/", auth, sessionController.getSession);              // tutte le sessioni del medico
router.get("/:id", auth, sessionController.getSessionByID);      // una singola sessione
router.get("/patient/:id", auth, sessionController.getPatientSessionById); //tutte le sessioni di un paziente
router.post("/", auth, sessionController.createSession);         // creazione nuova sessione
router.delete("/:sessionId", auth, sessionController.deleteSessionById); // eliminazione
router.put("/:sessionId", auth, sessionController.updateSession); // update di una sessione specifica
router.post("/export/:sessionId", sessionController.exportSessionCSV);
router.delete("/clean/:sessionId", sessionController.deleteSessionCSV);
router.get('/download/:sessionId/:dataType', sessionController.downloadSessionCSV);

const path = require("path");
const fs = require("fs");
const {serialize} = require("mongodb");

router.get("/rawcsv/:sessionId", (req, res) => {
    const { sessionId } = req.params;
    const { dataType } = req.query;

    if (!dataType || !["sEMG", "IMU"].includes(dataType)) {
        return res.status(400).send("'dataType' mancante o non valido (usa 'sEMG' o 'IMU')");
    }

    const filePath = path.join(__dirname, "../../../tmp", `session_${sessionId}_${dataType}data.csv`);

    if (!fs.existsSync(filePath)) {
        console.warn(`CSV non trovato: ${filePath}`);
        return res.status(404).send("CSV non trovato");
    }

    res.sendFile(filePath);
});


module.exports = router;
