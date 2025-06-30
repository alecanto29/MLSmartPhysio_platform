const mongoose = require ("mongoose");

const NormalizationModelSchema = new mongoose.schema({
    min_scaling_value: {
        type: Number,
    },
    max_scaling_value: {
        type: Number,
    },
    mean: {
        type: Number
    }
});

module.exports = mongoose.model("NormalizationModel", NormalizationModelSchema, "NormalizationModel");