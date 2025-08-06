const spectrumService = require('../../services/Analysis_services/spectrumAnalysisServices');
const path = require('path');
const fs = require('fs');



const  spectrumAnalysis = async (req, res) => {
    try {
        const { sessionId, dataType} = req.body;

        console.log(`chiamata analisi spettrale per dati ${dataType}`);

        const rootPath = path.resolve(__dirname, '../../../../');
        const csvPath = path.join(rootPath, 'tmp', `session_${sessionId}_${dataType}data.csv`);


        if (!fs.existsSync(csvPath)) {
            return res.status(500).json({ error: `Il file CSV non esiste: ${csvPath}` });
        }

        const result = await spectrumService.spectrumAnalysis(csvPath);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = {spectrumAnalysis}