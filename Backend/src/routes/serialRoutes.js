const express = require("express");
const router = express.Router();

const serialController = require("../controller/serialController")

router.post("/start", serialController.startScanning); // Avvia la connessione
router.post("/stop", serialController.stopScanning);   // Chiude la connessione
router.post("/send", serialController.sendMessage);    // Invio dati
router.get("/status", serialController.getStatus);

module.exports = router;
