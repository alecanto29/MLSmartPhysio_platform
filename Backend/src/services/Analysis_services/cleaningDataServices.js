const { spawn } = require('child_process');
const path = require('path');

const scriptPath = path.join(__dirname, '../../scripts_analysis/dataCleaningScripts.py');
const pythonExec = 'python'; // oppure 'python3' a seconda del tuo ambiente

function callPythonCleaning(csvPath, method, isNaN, isOutliers, outliers_adv, dataType) {
    return new Promise((resolve, reject) => {
        const process = spawn(pythonExec, [
            scriptPath,
            csvPath,
            method,
            isNaN.toString(),
            isOutliers.toString(),
            outliers_adv.toString(),
            dataType
        ]);

        let result = '';
        let error = '';

        process.stdout.on('data', (data) => {
            const output = data.toString();
            console.log('[PYTHON STDOUT]', output); // 👈 Log dei print()
            result += output;
        });

        process.stderr.on('data', (data) => {
            const err = data.toString();
            console.error('[PYTHON STDERR]', err); // 👈 Log degli errori
            error += err;
        });

        process.on('close', (code) => {
            if (code !== 0) {
                reject(new Error(`Errore Python: ${error}`));
            } else {
                try {
                    const parsed = JSON.parse(result);
                    resolve(parsed);
                } catch (e) {
                    reject(new Error(`Output non valido dal Python: ${result}`));
                }
            }
        });
    });
}

// METODI DEDICATI PER OGNI STRATEGIA

function cleanWithMean(csvPath, isNaN, isOutliers, outliers_adv, dataType) {
    return callPythonCleaning(csvPath, 'mean', isNaN, isOutliers, outliers_adv, dataType);
}

function cleanWithMedian(csvPath, isNaN, isOutliers, outliers_adv, dataType) {
    return callPythonCleaning(csvPath, 'median', isNaN, isOutliers, outliers_adv, dataType);
}

function cleanWithForwardFill(csvPath, isNaN, isOutliers, outliers_adv, dataType) {
    return callPythonCleaning(csvPath, 'ffill', isNaN, isOutliers, outliers_adv, dataType);
}

function cleanWithBackwardFill(csvPath, isNaN, isOutliers, outliers_adv, dataType) {
    return callPythonCleaning(csvPath, 'bfill', isNaN, isOutliers, outliers_adv, dataType);
}

module.exports = {
    cleanWithMean,
    cleanWithMedian,
    cleanWithForwardFill,
    cleanWithBackwardFill
};
