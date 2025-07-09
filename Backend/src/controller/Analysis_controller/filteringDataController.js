const filteringServices = require('../../services/Analysis_services/filteringDataServices');
const path = require('path');
const fs = require('fs');



function parseBool(value) {
    return value === true || value === 'true';
}

const lowPassFilter = async (req, res) => {
    try {
        const { sessionId, cutoff, order, dataType} = req.body;

        console.log("chiamata pulizia con low filter: param cutoff: " + cutoff + " order: " + order);

        const rootPath = path.resolve(__dirname, '../../../../');
        const csvPath = path.join(rootPath, 'tmp', `session_${sessionId}_${dataType}data.csv`);


        if (!fs.existsSync(csvPath)) {
            return res.status(500).json({ error: `❌ Il file CSV non esiste: ${csvPath}` });
        }

        const result = await filteringServices.lowPassFilter(csvPath, cutoff, order);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const highPassFilter = async (req, res) => {
    try {
        const { sessionId, cutoff, order, dataType} = req.body;

        console.log("chiamata pulizia con high filter: param cutoff: " + cutoff + " order: " + order);

        const rootPath = path.resolve(__dirname, '../../../../');
        const csvPath = path.join(rootPath, 'tmp', `session_${sessionId}_${dataType}data.csv`);

        if (!fs.existsSync(csvPath)) {
            return res.status(500).json({ error: `❌ Il file CSV non esiste: ${csvPath}` });
        }

        const result = await filteringServices.highPassFilter(csvPath, cutoff, order);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const notchFilter = async (req, res) => {
    try {
        const { sessionId, cutoff, order, dataType} = req.body;

        console.log("chiamata pulizia con notch filter: param cutoff: " + cutoff + " order: " + order);

        const rootPath = path.resolve(__dirname, '../../../../');
        const csvPath = path.join(rootPath, 'tmp', `session_${sessionId}_${dataType}data.csv`);

        if (!fs.existsSync(csvPath)) {
            return res.status(500).json({ error: `❌ Il file CSV non esiste: ${csvPath}` });
        }

        const result = await filteringServices.notchFilter(csvPath, cutoff, order);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};




module.exports = {
    lowPassFilter,
    highPassFilter,
    notchFilter
};
