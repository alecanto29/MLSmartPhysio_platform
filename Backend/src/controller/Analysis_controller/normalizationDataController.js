const normalizationService = require('../../services/Analysis_services/normalizationDataServices');
const path = require('path');
const fs = require('fs');

function ensureSourceExistsOrWorking(csvPath, sessionId, dataType) {
    const workDir = process.env.SMARTPHYSIO_WORKDIR || 'data_work';
    const parquetPath = path.join(path.resolve(__dirname, '../../../../'), workDir, `${sessionId}_${dataType}.parquet`);
    if (!fs.existsSync(csvPath) && !fs.existsSync(parquetPath)) {
        return { ok: false, msg: `Sorgente non trovata: né CSV (${csvPath}) né Parquet (${parquetPath})` };
    }
    return { ok: true };
}

const minmaxNormalization = async (req, res) => {
    try {
        const { sessionId, dataType } = req.body;
        const rootPath = path.resolve(__dirname, '../../../../');
        const csvPath = path.join(rootPath, 'tmp', `session_${sessionId}_${dataType}data.csv`);

        const check = ensureSourceExistsOrWorking(csvPath, sessionId, dataType);
        if (!check.ok) return res.status(500).json({ error: check.msg });

        const result = await normalizationService.minmaxNormalization(csvPath);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const standardNormalization = async (req, res) => {
    try {
        const { sessionId, dataType } = req.body;
        const rootPath = path.resolve(__dirname, '../../../../');
        const csvPath = path.join(rootPath, 'tmp', `session_${sessionId}_${dataType}data.csv`);

        const check = ensureSourceExistsOrWorking(csvPath, sessionId, dataType);
        if (!check.ok) return res.status(500).json({ error: check.msg });

        const result = await normalizationService.standardNormalization(csvPath);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = {
    minmaxNormalization,
    standardNormalization,
};
