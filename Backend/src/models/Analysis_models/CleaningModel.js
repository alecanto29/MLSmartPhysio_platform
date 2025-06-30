const mongoose = require ("mongoose");

const CleaningModelSchema = new mongoose.schema({
    isNaNvalueConsidered: {
        type: Boolean,
        default: false
    },
    isOutliersValueConsidered: {
        type: Boolean,
        default: false
    }
});

module.exports = mongoose.model("CleaningModel", CleaningModelSchema, "CleaningModel");