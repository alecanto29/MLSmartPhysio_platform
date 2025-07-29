const express = require('express');
const router = express.Router();
const filteringController = require('../../controller/Analysis_controller/filteringDataController');

// POST ../clean/mean
router.post('/low', filteringController.lowPassFilter);

// POST ../clean/median
router.post('/high', filteringController.highPassFilter);

// POST ../clean/ffill
router.post('/notch', filteringController.notchFilter);

module.exports = router;