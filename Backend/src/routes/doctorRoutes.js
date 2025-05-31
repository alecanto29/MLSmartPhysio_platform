const express = require ("express");

const router = express.Router();

const doctorController = require("../controller/DoctorController");

router.get("/", doctorController.getAllDoctors);
router.get("/:id", doctorController.getDoctorById);
router.post("/", doctorController.createNewDoctor);
router.delete("/:id", doctorController.deleteDoctorById);

module.exports = router;