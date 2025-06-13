const serialService = require("../services/serialService.js");
const sessionService = require("../services/sessionService");

const startScanning = async () => {
    try {
        //chiama il service per iniziare la scannerizzazione delle porte
        await serialService.openConnection();
    } catch (error) {
        console.error("Errore durante l'apertura della connessione seriale:", error);
    }
}

const stopScanning = async () => {
    try {
        //chiama il service per chiudere lo scan delle porte e disconnessione
        await serialService.closeConnection();
    } catch (error) {
        console.error("Errore durante la chiusura della connessione seriale:", error);
    }
}

//metodo per stato della connessione
const getStatus = (req, res) => {
    const status = serialService.getConnectionStatus();
    res.json({ connected: status });
};


const sendMessage = async (req, res) => {
    try {
        const command = req.body.data[0].replace("\\r", "\r");
        const sessionID = req.body.sessionId;

        if (!sessionID) {
            return res.status(400).json({ error: "sessionId mancante nel body" });
        }

        console.log(`Comando ricevuto: ${command} (sessionId: ${sessionID})`);

        await serialService.sendSequentially(command);

        if (command === "Start\r") {
            console.log("Avvio lettura dati...");
            serialService.startReading(sessionID);
        }

        res.status(200).json({ message: "Comando inviato con successo" });
    } catch (error) {
        console.error("Errore nell'invio dei dati: ", error);
        res.status(500).json({ error: "Errore nell'invio dei dati." });
    }
};



module.exports = {
    startScanning,
    stopScanning,
    sendMessage,
    getStatus

}

