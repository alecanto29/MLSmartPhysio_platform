const express = require("express");
const router = express.Router();

const appointmentsController = require("../controller/appointmentsController");
const auth = require("../middleware/auth");

router.get("/", auth, appointmentsController.getAllAppointments);
router.get("/date", auth, appointmentsController.getAllAppointmentsDate);
router.get("/time", auth, appointmentsController.getAllAppointmentsTime);
router.post("/newAppointments", auth, appointmentsController.takeNewAppointment);

module.exports = router;
