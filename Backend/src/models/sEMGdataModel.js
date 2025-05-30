const mongoose = require("mongoose");

const sEMGdataSchema = new mongoose.Schema({
    sessionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Sessions",
        required: true,
    },
    data: {
        type: [Number],
        required: true,
        validate: {
            validator: function (arr) {
                return arr.length === 8 && arr.every(num => typeof num === 'number');
            },
            message: "L'array deve contenere esattamente 8 valori numerici."
        }
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("sEMGdata", sEMGdataSchema, "sEMGdata");
