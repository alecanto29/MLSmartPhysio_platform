const express = require("express");
const router = express.Router();

const sessionController = require("../controller/sessionController");
const auth = require("../middleware/auth");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const upload = multer({
    dest: path.join(__dirname, "../../../tmp")
});

// Rotte protette da auth
router.get("/", auth, sessionController.getSession);
router.get("/preview/:sessionId", sessionController.fastPreview);
router.get("/:id", auth, sessionController.getSessionByID);
router.get("/patient/:id", auth, sessionController.getPatientSessionById);
router.post("/", auth, sessionController.createSession);
router.delete("/:sessionId", auth, sessionController.deleteSessionById);
router.put("/:sessionId", auth, sessionController.updateSession);

// Upload CSV -> non richiede auth perché il token non viene letto
router.post("/import/:sessionId", upload.array("files", 2), sessionController.importCSVData);

// CSV export / download / clean
router.post("/export/:sessionId", sessionController.exportSessionCSV);
router.delete("/clean/:sessionId", sessionController.deleteSessionCSV);
router.get('/download/:sessionId/:dataType', sessionController.downloadSessionCSV);

// CSV raw access (debug o download diretto)
router.get("/rawcsv/:sessionId", (req, res) => {
    const { sessionId } = req.params;
    const { dataType } = req.query;

    if (!dataType || !["sEMG", "IMU"].includes(dataType)) {
        return res.status(400).send("'dataType' mancante o non valido (usa 'sEMG' o 'IMU')");
    }

    const filePath = path.join(
        __dirname,
        "../../../tmp",
        `session_${sessionId}_${dataType}data.csv`
    );

    if (!fs.existsSync(filePath)) {
        console.warn(`[RAWCSV] CSV mancante per sessionId=${sessionId}, tipo=${dataType} -> ${filePath}`);
        return res.status(404).send("CSV non ancora pronto, riprova più tardi");
    }

    res.sendFile(filePath);
});


module.exports = router;
