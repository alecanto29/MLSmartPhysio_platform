const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema({
    date: {
        type: Date,
        required: true
    },
    time: {
        type: String,
        required: true
    },
    notes: {
        type: String,
        default: ""
    },
    status: {
        type: String,
        enum: ["SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELLED", "ERROR"],
        default: "SCHEDULED"
    },
    patient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Patients",
        required: true,
        index: true
    },
    doctor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Doctors",
        required: true,
        index: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model("Sessions", sessionSchema, "Sessions");
