const mongoose = require("mongoose");

const doctorSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    surname: {
        type: String,
        required: true
    },
    birthDate: Date,
    fiscalCode: {
        type: String,
        unique: true,
        required: true
    },
    email: {
        type: String,
        unique: true,
        required: true
    },
    passwordHash: {
        type: String,
        required: true
    },
    licenseNumber: {
        type: String,
        unique: true,
        required: true
    },
    specialization: String,

    patientsInCare: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Patients"
    }],

    appointments: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Appointments"
    }]

});

module.exports = mongoose.model("Doctors", doctorSchema, "Doctors");
