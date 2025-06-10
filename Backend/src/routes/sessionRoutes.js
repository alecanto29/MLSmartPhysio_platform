const express = require("express");
const router = express.Router();

const sessionController = require("../controller/sessionController");
const auth = require("../middleware/auth");

router.get("/", auth, sessionController.getSession);              // tutte le sessioni del medico
router.get("/:id", auth, sessionController.getSessionByID);      // una singola sessione
router.post("/", auth, sessionController.createSession);         // creazione nuova sessione
router.delete("/:id", auth, sessionController.deleteSessionById); // eliminazione

module.exports = router;
