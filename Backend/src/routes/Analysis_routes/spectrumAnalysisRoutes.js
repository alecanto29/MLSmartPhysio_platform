const express = require('express');
const router = express.Router();
const spectrumController = require('../../controller/Analysis_controller/spectrumAnalysisController');

// POST /api/clean/mean
router.post('/spectrumAnalysis', spectrumController.spectrumAnalysis);

module.exports = router;