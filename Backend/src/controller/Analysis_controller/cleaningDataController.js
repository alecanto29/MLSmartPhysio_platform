const cleaningService = require('../../services/Analysis_services/cleaningDataServices');
const path = require('path');
const fs = require('fs');



function parseBool(value) {
    return value === true || value === 'true';
}

const cleanWithMean = async (req, res) => {
    try {
        const { sessionId, isNaN, isOutliers, outliers_adv, dataType } = req.body;

        console.log("chiamata pulizia con mean: param isNaN: " + isNaN + " ouliers: " + isOutliers + " adv_outliers: " + outliers_adv);

        const rootPath = path.resolve(__dirname, '../../../../');
        const csvPath = path.join(rootPath, 'tmp', `session_${sessionId}_${dataType}data.csv`);


        if (!fs.existsSync(csvPath)) {
            return res.status(500).json({ error: `❌ Il file CSV non esiste: ${csvPath}` });
        }

        const result = await cleaningService.cleanWithMean(csvPath, isNaN, isOutliers, outliers_adv, dataType);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const cleanWithMedian = async (req, res) => {
    try {
        const { sessionId, isNaN, isOutliers, outliers_adv, dataType } = req.body;

        console.log("chiamata pulizia con median: param isNaN: " + isNaN + "ouliers: " + isOutliers + " adv_outliers: " + outliers_adv);
        const rootPath = path.resolve(__dirname, '../../../../');
        const csvPath = path.join(rootPath, 'tmp', `session_${sessionId}_${dataType}data.csv`);

        if (!fs.existsSync(csvPath)) {
            return res.status(500).json({ error: `❌ Il file CSV non esiste: ${csvPath}` });
        }

        const result = await cleaningService.cleanWithMedian(csvPath, parseBool(isNaN), parseBool(isOutliers), parseBool(outliers_adv), dataType);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const cleanWithForwardFill = async (req, res) => {
    try {
        const { sessionId, isNaN, isOutliers, outliers_adv, dataType } = req.body;
        console.log("chiamata pulizia con ffill: param isNaN: " + isNaN + "ouliers: " + isOutliers + " adv_outliers: " + outliers_adv);
        const rootPath = path.resolve(__dirname, '../../../../');
        const csvPath = path.join(rootPath, 'tmp', `session_${sessionId}_${dataType}data.csv`);

        if (!fs.existsSync(csvPath)) {
            return res.status(500).json({ error: `❌ Il file CSV non esiste: ${csvPath}` });
        }

        const result = await cleaningService.cleanWithForwardFill(csvPath, parseBool(isNaN), parseBool(isOutliers), parseBool(outliers_adv), dataType);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const cleanWithBackwardFill = async (req, res) => {
    try {
        const { sessionId, isNaN, isOutliers, outliers_adv, dataType } = req.body;
        console.log("chiamata pulizia con bfill: param isNaN: " + isNaN + "ouliers: " + isOutliers + " adv_outliers: " + outliers_adv);
        const rootPath = path.resolve(__dirname, '../../../../');
        const csvPath = path.join(rootPath, 'tmp', `session_${sessionId}_${dataType}data.csv`);

        if (!fs.existsSync(csvPath)) {
            return res.status(500).json({ error: `❌ Il file CSV non esiste: ${csvPath}` });
        }

        const result = await cleaningService.cleanWithBackwardFill(csvPath, parseBool(isNaN), parseBool(isOutliers), parseBool(outliers_adv), dataType);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};


module.exports = {
    cleanWithMean,
    cleanWithMedian,
    cleanWithForwardFill,
    cleanWithBackwardFill
};
