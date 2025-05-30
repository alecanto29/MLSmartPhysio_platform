const mongoose = require("mongoose");

const appointmentsSchema = new mongoose.Schema({
    date: {
        type: Date,
        required: true
    },
    time: {
        type: String,
        required: true
    },
    doctor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Doctors",
        required: true
    },
    patient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Patients",
        required: true
    },
    status: {
        type: String,
        enum: ["SCHEDULED", "COMPLETED", "CANCELLED"],
        default: "SCHEDULED"
    },
    notes: {
        type: String,
        default: ""
    }
}, {
    timestamps: true
});

module.exports = mongoose.model("Appointments", appointmentsSchema, "Appointments");
