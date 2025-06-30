const mongoose = require ("mongoose");

const FilteringModelSchema = new mongoose.schema({
    cut_off_frequency: {
        type: Number,
    },
    filter_order: {
        type: Number,
    },
});

module.exports = mongoose.model("FilteringModel", FilteringModelSchema, "FilteringModel");