// Import delle librerie per la gestione della porta seriale e del parsing dei dati
const { SerialPort } = require("serialport");
const { ReadlineParser } = require('@serialport/parser-readline');

// Comando inviato alle board per ricevere il loro nome identificativo
const TEST_COMMAND = "Name\r";

// Nomi delle board attese (devono essere riconosciute nella risposta della porta seriale)
const boardNames = ["sEMG_MLSmartPhysio", "IMU_MLSmartPhysio"];

// Oggetto che memorizza le porte COM trovate per ciascuna board
let globalFoundPorts = {};

// Oggetto che memorizza le istanze SerialPort delle board connesse
let serialPorts = {};  // E.g., { sEMG_MLSmartPhysio: SerialPortInstance, ... }

// Flag per interrompere il ciclo di retry delle connessioni
let shouldStopRetries = false;

//metodo per creare una porta serial con baudRate di interesse
const createSerialPort = (path) => {
    return new SerialPort({
        path,
        baudRate: 460800,
        autoOpen: false
    });
};

//metodo per la chiusura della porta seriale
const closePortSafely = (serial) => {
    if (serial && serial.isOpen) {
        serial.close((err) => {
            if (err) {
                console.error(`Errore nella chiusura della porta ${serial.path}: ${err.message}`);
            }
        });
    }
};

//metodo per mandare un messaggio alla board
const sendSequentially = (serial, message, delay = 10, index = 0, onComplete, portPath) => {
    if (index >= message.length) {
        if (onComplete) onComplete();
        return;
    }

    serial.write(message[index], (err) => {
        if (err) {
            console.error(`Errore invio: COM + ${portPath}`, err.message);
        } else {
            console.log(`Lettera inviata su ${portPath}: ${message[index]}`);
        }
    });

    //chiamata ricorsiva del metodo con indice aumentato per il carattere successivo
    setTimeout(() => sendSequentially(serial, message, delay, index + 1, onComplete, portPath), delay);
};


// Funzione per analizzare i dati ricevuti dalla seriale ed associare la board al nome corretto
const handleComData = async (parser, serial, portPath, resolve, reject, timeoutRef, resolved) => {
    parser.on("data", async (data) => {                           // Quando arrivano dati dalla seriale...
        const raw = data.toString();                              // Converte il buffer in stringa
        const cleanedData = raw.replace(/[^\x20-\x7E]/g, '').trim(); // Rimuove caratteri non stampabili e spazi

        for (const name of boardNames) {                          // Controlla ogni possibile nome di board
            if (cleanedData.includes(name) && !globalFoundPorts[name]) { // Se il nome è presente e non già trovato
                console.log(`Trovata porta per ${name}: ${portPath}`);
                globalFoundPorts[name] = portPath;                       // Salva la porta identificata
                console.log("globalFoundPorts updated:", globalFoundPorts);

                try {
                    if (!serial.isOpen) {                         // Se la porta è chiusa, prova ad aprirla
                        await new Promise((res, rej) => {
                            serial.open((err) => {               // Apre la porta seriale
                                if (err && err.message.includes("already open")) {
                                    console.warn(`Porta ${name} già aperta.`);
                                    serialPorts[name] = serial;  // Salva comunque l'oggetto
                                    return res();
                                } else if (err) {
                                    console.error(`Errore apertura ${name} (${portPath}): ${err.message}`);
                                    return rej(err);             // Errore critico, rifiuta la promessa
                                } else {
                                    console.log(`Porta ${name} aperta: ${portPath}`);
                                    serialPorts[name] = serial;  // Apre correttamente, salva la porta
                                    return res();
                                }
                            });
                        });
                    } else {
                        serialPorts[name] = serial;  // Se era già aperta, salva comunque
                    }
                } catch (openErr) {
                    console.error(`Fallita apertura della porta ${portPath}:`, openErr.message);
                }

                if (!resolved.called && serialPorts[name]) {     // Se non già risolta e porta valida...
                    resolved.called = true;                      // Segna come risolta
                    clearTimeout(timeoutRef);                    // Cancella il timeout
                    resolve();                                   // Risolve la promessa principale
                }
            }
        }
    });
};


// Funzione che invia il comando TEST alla board e imposta un timeout per evitare attese infinite
const sendTestCommand = (serial, reject, timeoutDuration = 3000, resolved, portPath) => {
    if (!serial.isOpen) { // Se la porta seriale non è aperta...
        console.warn(`Tentativo di invio comando a porta non aperta: ${portPath}`); // Avvisa in console

        if (!resolved.called) { // Se la prom non è stata ancora risolta/rifiutata...
            resolved.called = true; // segna come risolta
            reject(); // Rifiuta la prom
        }

        return;
    }

    //timeout: se la board non risponde entro 'timeoutDuration', la porta viene chiusa e la prom rifiutata
    const timeoutRef = setTimeout(() => {
        if (!resolved.called) { // Se non è stata risolta in tempo...
            resolved.called = true;
            closePortSafely(serial); // Chiude la porta
            reject(); // Rifiuta la promessa
        }
    }, timeoutDuration);

    // Invia il comando 'Name\r' carattere per carattere, con ritardo di 10ms tra ogni carattere
    sendSequentially(serial, TEST_COMMAND, 10, 0, () => {}, portPath);

    return timeoutRef;
};


// Funzione principale che effettua la scansione di tutte le porte seriali disponibili
const testCom = async () => {
    const ports = await SerialPort.list(); // Ottiene la lista delle porte seriali disponibili nel sistema
    console.log("Avvio testCom. globalFoundPorts attuali:", globalFoundPorts);

    if (Object.keys(globalFoundPorts).length === boardNames.length) {
        // Se entrambe le board sono già state trovate, evita di rifare la scansione
        console.log("Entrambe le board già trovate, nessuna scansione necessaria.");
        return globalFoundPorts;
    }

    if (ports.length === 0) {
        // Nessuna porta seriale disponibile
        console.log("Nessuna porta seriale disponibile.");
        return null;
    }

    // Cicla tutte le porte seriali disponibili
    for (const port of ports) {
        if (Object.values(globalFoundPorts).includes(port.path)) {
            // Se la porta è già associata a una board trovata, la salta
            console.log(`Porta già verificata: ${port.path}`);
            continue;
        }

        // Crea una nuova istanza di porta seriale per il test
        const serial = createSerialPort(port.path);

        // Collega un parser di tipo line-based alla seriale (split su \r\n)
        const parser = serial.pipe(new ReadlineParser({ delimiter: '\r\n' }));

        const resolved = { called: false }; // Flag che garantisce che la promise venga risolta una sola volta

        // Definisce una nuova promessa asincrona per gestire la verifica della singola porta
        const portCheck = new Promise((resolve, reject) => {
            serial.open((err) => {
                if (err) {
                    console.error(`Errore apertura ${port.path}: ${err.message}`);
                    return reject(err); // Se fallisce l'apertura, rifiuta la promessa
                }

                console.log(`Test in corso sulla porta: ${port.path}`);

                serial.on("error", (err) => {
                    // Gestione degli errori durante la comunicazione seriale
                    console.error(`Errore seriale su ${port.path}: ${err.message}`);
                    if (!resolved.called) {
                        resolved.called = true;
                        closePortSafely(serial); // Chiude la porta
                        reject(err); // Rifiuta la promessa
                    }
                });

                // Invia il comando di test e memorizza il timeout
                const timeoutRef = sendTestCommand(serial, reject, 3000, resolved, port.path);

                // Attiva il listener che analizza i dati ricevuti dalla porta
                handleComData(parser, serial, port.path, resolve, reject, timeoutRef, resolved);
            });
        });

        try {
            await portCheck; // Attende il completamento del test sulla porta corrente
            console.log(`Porta ${port.path} test completato.`);

            if (Object.keys(globalFoundPorts).length === boardNames.length) {
                // Se entrambe le board sono state trovate, termina il ciclo
                console.log("Entrambe le board trovate in questo ciclo testCom:", globalFoundPorts);
                return globalFoundPorts;
            }
        } catch (error) {
            // Gestione di errori durante il test della singola porta
            const errMsg = error instanceof Error ? error.message : String(error);
            console.error(`Fallito il test su ${port.path}:`, errMsg);
        }
    }

    // Dopo il ciclo di test, stampa lo stato finale
    console.log("serialPorts (verifica):", serialPorts);
    console.log("testCom completato. globalFoundPorts finali:", globalFoundPorts);

    return Object.keys(globalFoundPorts).length === boardNames.length ? globalFoundPorts : null;
};


const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const testComWithRetry = async (maxRetries = 0, retryDelayMs = 5000) => {
    let attempts = 0;
    shouldStopRetries = false; // reset all’inizio

    while (!shouldStopRetries) {
        console.log("Ciclo attivo in testComWithRetry (shouldStopRetries:", shouldStopRetries, ")");
        attempts++;
        console.log(`Tentativo di connessione #${attempts}...`);
        console.log("Current globalFoundPorts:", globalFoundPorts);

        try {
            const result = await testCom();
            if (result && result["sEMG_MLSmartPhysio"] && result["IMU_MLSmartPhysio"]) {
                console.log("Entrambe le board rilevate!", globalFoundPorts);
                return result;
            }
        } catch (err) {
            console.error("Errore in testCom:", err);
        }

        if (maxRetries > 0 && attempts >= maxRetries) {
            console.log("Raggiunto il numero massimo di tentativi.");
            return null;
        }

        console.log(`Ritento tra ${retryDelayMs / 1000} secondi...`);
        await delay(retryDelayMs);
    }

    console.log("Connessione interrotta manualmente da stopRetries().");
    return null;
};

const stopRetries = () => {
    console.log("stopRetries() invocato – richiesta di annullamento testComWithRetry");
    shouldStopRetries = true;
};

const resetRetryFlag = () => {
    shouldStopRetries = false;
};

module.exports = {
    testCom,
    testComWithRetry,
    createSerialPort,
    closePortSafely,
    getSerialPorts: () => serialPorts,
    resetFoundPorts: () => {
        globalFoundPorts = {};
        serialPorts = {};
        console.log("Found ports and serial ports reset.");
    },
    stopRetries,
    resetRetryFlag
};
