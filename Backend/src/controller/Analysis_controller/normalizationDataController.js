const normalizationService = require('../../services/Analysis_services/normalizationDataServices');
const path = require('path');
const fs = require('fs');

const minmaxNormalization = async (req, res) => {
    try {
        const { sessionId, dataType } = req.body;

        console.log("chiamata normalizzazione min-max");

        const rootPath = path.resolve(__dirname, '../../../../');
        const csvPath = path.join(rootPath, 'tmp', `session_${sessionId}_${dataType}data.csv`);


        if (!fs.existsSync(csvPath)) {
            return res.status(500).json({ error: `Il file CSV non esiste: ${csvPath}` });
        }

        const result = await normalizationService.minmaxNormalization(csvPath);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const standardNormalization = async (req, res) => {
    try {
        const { sessionId, dataType } = req.body;

        console.log("chiamata normalizzazione standard");

        const rootPath = path.resolve(__dirname, '../../../../');
        const csvPath = path.join(rootPath, 'tmp', `session_${sessionId}_${dataType}data.csv`);


        if (!fs.existsSync(csvPath)) {
            return res.status(500).json({ error: `Il file CSV non esiste: ${csvPath}` });
        }

        const result = await normalizationService.standardNormalization(csvPath);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = {
    minmaxNormalization,
    standardNormalization
}
