const express = require('express');
const router = express.Router();
const filteringController = require('../../controller/Analysis_controller/filteringDataController');

// POST /api/clean/mean
router.post('/low', filteringController.lowPassFilter);

// POST /api/clean/median
router.post('/high', filteringController.highPassFilter);

// POST /api/clean/ffill
router.post('/notch', filteringController.notchFilter);

module.exports = router;