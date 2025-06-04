const express = require ("express");

const router = express.Router();

const doctorController = require("../controller/DoctorController");
const auth = require("../middleware/auth");

router.get("/", doctorController.getAllDoctors);
router.get("/appointments", auth, doctorController.getDoctorAppointments);
router.get("/:id", doctorController.getDoctorById);
router.post("/", doctorController.createNewDoctor);
router.delete("/:id", doctorController.deleteDoctorById);

module.exports = router;