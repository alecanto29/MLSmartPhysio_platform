const express = require('express');
const router = express.Router();
const cleaningController = require('../../controller/Analysis_controller/cleaningDataController');

// POST /api/clean/mean
router.post('/mean', cleaningController.cleanWithMean);

// POST /api/clean/median
router.post('/median', cleaningController.cleanWithMedian);

// POST /api/clean/ffill
router.post('/ffill', cleaningController.cleanWithForwardFill);

// POST /api/clean/bfill
router.post('/bfill', cleaningController.cleanWithBackwardFill);

module.exports = router;
