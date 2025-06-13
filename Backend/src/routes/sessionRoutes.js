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


module.exports = router;
