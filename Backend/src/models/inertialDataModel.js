
const mongoose = require("mongoose");

const inertialDataSchema = new mongoose.Schema({
    data: {
        type: [Number],
        required: true,
        validate: {
            validator: function (arr) {
                return arr.length === 9 && arr.every(num => typeof num === 'number');
            },
            message: "L'array deve contenere esattamente 9 valori numerici."
        }
    },
});

module.exports = mongoose.model("inertialData", inertialDataSchema, "inertialData");