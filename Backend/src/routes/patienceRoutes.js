const express = require("express");
const router = express.Router();

const patientController = require("../controller/patientController");
const auth = require("../middleware/auth");

router.get("/", auth, patientController.getAllPatients);
router.get("/critical", auth, patientController.getAllCriticPatients);
router.get("/:id", auth, patientController.getPatientById);
router.post("/", auth, patientController.createNewPatient);
router.delete("/:id", auth, patientController.deleteNewPatient);

module.exports = router;
