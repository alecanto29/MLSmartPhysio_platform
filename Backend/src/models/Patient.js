const mongoose = require("mongoose");

const patientSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    surname: {
        type: String,
        required: true
    },
    birthDate: {
        type: Date,
        required: true
    },
    fiscalCode: {
        type: String,
        required: true
    },
    healthCardNumber: {
        type: String,
        required: true
    },
    gender: {
        type: String,
        enum: ['Male', 'Female'],
        required: true
    },
    isCritical: {
        type: Boolean,
        default: false
    },
    medicalHistory: {
        type: String,
        default: ""
    },
    primaryDoctor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Doctors"
    },
    appointments: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Appointments"
    }],
    sessions: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Sessions"
    }]
});

module.exports = mongoose.model("Patients", patientSchema, "Patients");
