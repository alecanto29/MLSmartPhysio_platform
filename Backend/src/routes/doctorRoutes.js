const express = require ("express");

const router = express.Router();

const doctorController = require("../controller/DoctorController");

router.get("/doctor", doctorController.getAllDoctors);
router.get("/doctor/:id", doctorController.getDoctorById);
router.post("/doctor", doctorController.createNewDoctor);
router.delete("/doctor/:id", doctorController.deleteDoctorById);

module.exports = router;