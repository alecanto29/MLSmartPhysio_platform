const { testComWithRetry, resetFoundPorts, getSerialPorts, stopRetries, resetRetryFlag  } = require('../config/serialConfig');
const sEMGService = require("../services/sEMGdataService");
const InertialService = require("../services/inertialDataService");

//stato della connessione
let isConnected = false;
let io;

//oggetto contenente un riferimento alle due board con chiave valore
let serialPorts = {
    sEMG: null,
    IMU: null
};

//interruzione della conessione
let connectionAborted = false;

let activeSocketCount = 0;

const initializeSocket = (ioInstance) => {
    io = ioInstance;

    io.on("connection", (socket) => {
        console.log("Client connesso");
        activeSocketCount++;

        socket.on("disconnect", async () => {
            console.log("Client disconnesso");
            activeSocketCount--;

            if (activeSocketCount <= 0) {
                console.log("Nessun client attivo: chiusura delle porte seriali");
                await closeConnection();
            }
        });
    });
};

//metodo per ottenere lo stato della connessione
const getConnectionStatus = () => isConnected;

//metodo per mandare insequenza caratteri di un comando
const sendSequentially = (message, delay = 50, index = 0) => {
    //se non è associata nessuna porta alle chiavi return del metodo
    if (!serialPorts.sEMG && !serialPorts.IMU) {
        console.error("Nessuna porta seriale inizializzata per l'invio.");
        return;
    }

    //se l'indice non supera la lunghezza del comando da inviare invio ogni carattere con un ritardo di50ms
    if (index < message.length) {
        //ciclo su ogni oggetto di ogni COM seriale
        for (const [key, serial] of Object.entries(serialPorts)) {
            //se la connessione esiste ed è aperta
            if (serial && serial.isOpen) {
                //scrittura input del comando del carattere del messaggio a quell'indice specifico
                serial.write(message[index], (err) => {
                    if (err) {
                        return console.error(`Errore invio su ${key}:`, err.message);
                    }
                    console.log(`Lettera '${message[index]}' inviata su ${key}`);
                });
            }
        }

        //funzione chiamata ricorsivamente con indice incrementato per il carattere successivo
        setTimeout(() => sendSequentially(message, delay, index + 1), delay);
    }
};

//Metodo per la ricerca e apertura connessione
const openConnection = async () => {
    resetRetryFlag();
    //se il sistema è gia connesso return
    if (isConnected) {
        startReading();

        return;
    }

    connectionAborted = false;
    //pulizia delle porte trovate fino ad ora, in modo da eliminare memoria di tentativi precedenti
    resetFoundPorts();

    //ritorna i nomi delle porte trovate grazie al serialConfig
    const found = await testComWithRetry();

    if (connectionAborted) {
        console.warn("Connessione annullata manualmente prima del completamento.");
        return;
    }

    //se found non contiene entrambe allora return
    if (!found?.["sEMG_MLSmartPhysio"] || !found?.["IMU_MLSmartPhysio"]) {
        console.error("Una o entrambe le board non sono state rilevate.");
        return;
    }

    //get degli oggetti delle porte seriali dal serialConfig
    const allSerialPorts = getSerialPorts();
    //mappa dell'oggetto con le serialPorts ottenute per get
    serialPorts.sEMG = allSerialPorts["sEMG_MLSmartPhysio"];
    serialPorts.IMU  = allSerialPorts["IMU_MLSmartPhysio"];

    console.log("Porta SEMG:", serialPorts.sEMG?.path);
    console.log("Porta IMU:", serialPorts.IMU?.path);

    //se anceh una delle due non esiste return
    if (!serialPorts.sEMG || !serialPorts.IMU) {
        console.error("Le porte seriali non sono correttamente disponibili.");
        return;
    }

    //stato della connessione a true se tutto si completa
    isConnected = true;
    console.log("Connessione completata. Avvio lettura...");

    //preparazione delle porte per i dati da trasmettere
    startReading();
};

//buffer comtemitore per le sequenze sEMG
let sEMGBuffer = [];

//buffer comtemitore per le sequenze inerziali
let imuBuffer = [];

//Stringa della sequenza trasmessa da sEMG board
let sEMGTemp = "";

//Stringa della sequenza trasmessa da IMU board
let imuTemp = "";

const handleSEMGRawData = async (data, sessionID) => {
    //aggiunta dei dati in stringa al temp
    sEMGTemp += data.toString();

    //ricavo delle sequenze singole dividendo la stringa temp sul carattere \n
    const sequences = sEMGTemp.split('\n');
    sEMGTemp = sequences.pop().trim(); //rimozione degli spazi di inizio e fine

    //ciclo sulle sequenze
    for (const sequence of sequences) {

        //pasring e pulizia sequenza
        const parsed = parseIntegerSequence(sequence, 8);

        //verifica che la singola sequenza rispetti la lunghezza stabilita
        if (parsed.length === 8) {

            //push della sequenza nel buffer
            sEMGBuffer.push(parsed);

            //trasmissione dato al frontend
            if (io) io.emit("sEMG", parsed);

            //se il buffer raggiunge una quantità maggiore a 50 salvataggio dei dati sul db e svuotamento buffer
            if (sEMGBuffer.length >= 50) {
                await sEMGService.savesEMGdata(sEMGBuffer, sessionID);
                sEMGBuffer = [];
            }
        }
    }
};

const handleIMURawData = async (data, sessionID) => {
    imuTemp += data.toString();
    const sequences = imuTemp.split('\n');
    imuTemp = sequences.pop().trim();

    for (const sequence of sequences) {

        const parsed = parseFloatSequence(sequence, 9);

        if (parsed.length === 9) {
            imuBuffer.push(parsed);
            if (io) io.emit("imuData", parsed);
            if (imuBuffer.length >= 50) {
                await InertialService.saveInertialData(imuBuffer, sessionID);
                imuBuffer = [];
            }
        } else {
            console.warn(`Dato IMU scartato. Lunghezza: ${parsed.length} → Dati:`, parsed);
        }
    }
};

//Estrae una sequenza di interi da una stringa testuale.
const parseIntegerSequence = (sequence, expectedLength) => {
    return sequence
        .trim()                          // Rimuove eventuali spazi iniziali e finali
        .split(/\s+/)                   // Divide la stringa in base a spazi multipli o tabulazioni
        .map(n => parseInt(n.trim()))   // Converte ogni elemento in intero
        .filter(n => !isNaN(n))         // Rimuove eventuali valori non numerici
        .slice(0, expectedLength);      // Limita l'array al numero desiderato di valori
};

//Estrae una sequenza di numeri floating-point da una stringa.
const parseFloatSequence = (sequence, expectedLength) => {
    const results = [];

    // Inserisce uno spazio tra numeri float attaccati, es. "1.231.45" → "1.23 1.45"
    const fixedSequence = sequence.replace(/(\d+\.\d+)(?=\d)/g, '$1 ');

    // Estrae tutte le occorrenze di numeri float (positivi o negativi)
    const matches = fixedSequence.match(/-?\d+\.\d+/g);

    if (matches) {
        for (const str of matches) {
            const num = parseFloat(str);
            if (!isNaN(num)) {
                results.push(num);
            } else {
                console.warn(`Float non valido ignorato: '${str}'`);
            }
        }
    }

    return results.slice(0, expectedLength);  // Ritorna solo i primi 'expectedLength' valori
};

const startReading = (sessionID) => {
    if (!serialPorts.sEMG && !serialPorts.IMU) {
        console.warn("Nessuna porta seriale attiva per iniziare la lettura.");
    }

    if (serialPorts.sEMG) {
        serialPorts.sEMG.removeAllListeners("data");
        serialPorts.sEMG.on("data", (data) => handleSEMGRawData(data, sessionID));
    }

    if (serialPorts.IMU) {
        serialPorts.IMU.removeAllListeners("data");
        serialPorts.IMU.on("data", (data) => handleIMURawData(data, sessionID));
    }
};

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const closeConnection = async () => {
    console.log("closeConnection invocata");

    stopRetries();
    connectionAborted = true;

    if (!isConnected) {
        console.log("Nessuna connessione attiva da chiudere.");
        return;
    }

    for (const [key, serial] of Object.entries(serialPorts)) {
        if (serial) {

            if (serial.isOpen) {
                await new Promise((resolve) => {
                    serial.close((err) => {
                        if (err) {
                            console.error(`Errore chiusura porta ${key}:`, err.message);
                        } else {
                            console.log(`Porta ${key} chiusa correttamente`);
                        }
                        resolve();
                    });
                });
            } else {
                console.log(`Porta ${key} era già chiusa`);
            }
        }
    }

    await delay(500);

    isConnected = false;
    console.log("Connessione chiusa e risorse rilasciate.");
};



// Funzioni helper solo per testing
const __setConnected = (val) => { isConnected = val; };
const __mockSerialPorts = (sEMG, IMU) => {
    serialPorts.sEMG = sEMG;
    serialPorts.IMU = IMU;
};
const __test_parseIntegerSequence = parseIntegerSequence;
const __test_parseFloatSequence = parseFloatSequence;

module.exports = {
    initializeSocket,
    sendSequentially,
    openConnection,
    closeConnection,
    getConnectionStatus,
    startReading,
    // Export extra per i test
    __setConnected,
    __mockSerialPorts,
    __test_parseIntegerSequence,
    __test_parseFloatSequence
};
