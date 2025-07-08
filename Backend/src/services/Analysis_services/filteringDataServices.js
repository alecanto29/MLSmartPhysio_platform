const { spawn } = require('child_process');
const path = require('path');

const scriptPath = path.join(__dirname, '../../scripts_analysis/dataFilteringScripts.py');
const pythonExec = 'python'; // oppure 'python3' a seconda del tuo ambiente

function callPythonFilter(csvPath, method, cut_off_frequency, filter_order, outliers_adv) {
    return new Promise((resolve, reject) => {
        const process = spawn(pythonExec, [
            scriptPath,
            csvPath,
            method,
            cut_off_frequency,
            filter_order
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

function lowPassFilter(csvPath,cut_off_frequency, filter_order) {
    return callPythonFilter(csvPath, 'low', cut_off_frequency, filter_order);
}

function highPassFilter(csvPath,cut_off_frequency, filter_order) {
    return callPythonFilter(csvPath, 'high', cut_off_frequency, filter_order);
}

function notchFilter(csvPath,cut_off_frequency, filter_order) {
    return callPythonFilter(csvPath, 'notch', cut_off_frequency, filter_order);
}


module.exports = {
    lowPassFilter,
    highPassFilter,
    notchFilter,
};
