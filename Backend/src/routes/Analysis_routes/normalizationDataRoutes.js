const express = require('express');
const router = express.Router();
const normalizationController = require('../../controller/Analysis_controller/normalizationDataController');

// POST /api/clean/mean
router.post('/minmax', normalizationController.minmaxNormalization);

// POST /api/clean/median
router.post('/standard', normalizationController.standardNormalization);


module.exports = router;