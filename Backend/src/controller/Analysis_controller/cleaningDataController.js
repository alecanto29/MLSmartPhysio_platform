const cleaningService = require('../../services/Analysis_services/cleaningDataServices');
const path = require('path');
const fs = require('fs');

function parseBool(value) {
    return value === true || value === 'true';
}

function ensureSourceExistsOrWorking(csvPath, sessionId, dataType) {
    const workDir = process.env.SMARTPHYSIO_WORKDIR || 'data_work';
    const parquetPath = path.join(path.resolve(__dirname, '../../../../'), workDir, `${sessionId}_${dataType}.parquet`);
    if (!fs.existsSync(csvPath) && !fs.existsSync(parquetPath)) {
        return { ok: false, msg: `Sorgente non trovata: né CSV (${csvPath}) né Parquet (${parquetPath})` };
    }
    return { ok: true };
}

const cleanWithMean = async (req, res) => {
    try {
        const { sessionId, isNaN, isOutliers, outliers_adv, dataType } = req.body;
        const rootPath = path.resolve(__dirname, '../../../../');
        const csvPath = path.join(rootPath, 'tmp', `session_${sessionId}_${dataType}data.csv`);

        const check = ensureSourceExistsOrWorking(csvPath, sessionId, dataType);
        if (!check.ok) return res.status(500).json({ error: check.msg });

        const result = await cleaningService.cleanWithMean(csvPath, isNaN, isOutliers, outliers_adv, dataType);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const cleanWithMedian = async (req, res) => {
    try {
        const { sessionId, isNaN, isOutliers, outliers_adv, dataType } = req.body;
        const rootPath = path.resolve(__dirname, '../../../../');
        const csvPath = path.join(rootPath, 'tmp', `session_${sessionId}_${dataType}data.csv`);

        const check = ensureSourceExistsOrWorking(csvPath, sessionId, dataType);
        if (!check.ok) return res.status(500).json({ error: check.msg });

        const result = await cleaningService.cleanWithMedian(csvPath, parseBool(isNaN), parseBool(isOutliers), parseBool(outliers_adv), dataType);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const cleanWithForwardFill = async (req, res) => {
    try {
        const { sessionId, isNaN, isOutliers, outliers_adv, dataType } = req.body;
        const rootPath = path.resolve(__dirname, '../../../../');
        const csvPath = path.join(rootPath, 'tmp', `session_${sessionId}_${dataType}data.csv`);

        const check = ensureSourceExistsOrWorking(csvPath, sessionId, dataType);
        if (!check.ok) return res.status(500).json({ error: check.msg });

        const result = await cleaningService.cleanWithForwardFill(csvPath, parseBool(isNaN), parseBool(isOutliers), parseBool(outliers_adv), dataType);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const cleanWithBackwardFill = async (req, res) => {
    try {
        const { sessionId, isNaN, isOutliers, outliers_adv, dataType } = req.body;
        const rootPath = path.resolve(__dirname, '../../../../');
        const csvPath = path.join(rootPath, 'tmp', `session_${sessionId}_${dataType}data.csv`);

        const check = ensureSourceExistsOrWorking(csvPath, sessionId, dataType);
        if (!check.ok) return res.status(500).json({ error: check.msg });

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
    cleanWithBackwardFill,
};
