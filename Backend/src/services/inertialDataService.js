
const inertialData = require("../models/inertialDataModel");
const {Parser} = require("json2csv");


//Metodo per ricavare tutti inerziali i dati inerziali dal db
async function getAllInertialData(){
    try{
        const data = await inertialData.find();
        return data;
    }catch(error){
        throw new Error(`Errore durante il recupero dei dati sEMG: ${error.message}`);
    }
}

const getAllInertialDataBySession = async (sessionID) =>{
    const sessionData = await inertialData.find({sessionId: sessionID});
    return sessionData
}

//Metodo per ricavare tutti i dati inerziali di un canale specifico
async function getDataByChannel(channelNumber){

    //controllo che il numero del canale sia nei range corretti stabiliti
    if(channelNumber < 0 || channelNumber > 9) {
        throw new Error(`Il numero del canale deve essere compreso tra 0 e 9, canale fornito: ${channelNumber}`);
    }

    try {
        const allData = await inertialData.find();

        //array contenitore per i dati del singolo canale
        let chooseChannelData = [];

        for (let i = 0; i < allData.length; i++) {
            //verifico che la lunghezza del dati sia esattamente di 9 canali (stabilita)
            if(allData[i].data.length === 9){
                //push del valore relativo a quello specifico canale della i-esima sequenza nell'array
                chooseChannelData.push(allData[i].data[channelNumber]);
            }
        }

        return chooseChannelData;

    } catch(error){
        throw new Error(`Errore durante il recupero dei dati per il canale ${channelNumber}: ${error.message}`)
    }
}

//Metodo per cancellare tutti i dati inerziali dal db
async function deleteAllInertialData(){
    try {
        await inertialData.deleteMany({});
        return { message: "Dati cancellati correttamente" };
    } catch (error) {
        throw new Error(`Errore durante la cancellazione dei dati: ${error.message}`);
    }
}

const deleteAllInertialDataBySession = async (sessionID) =>{
    return await inertialData.deleteMany({sessionId: sessionID});
}

//Metodo per salvare i dati inerziali sul db
async function saveInertialData(dataArray, sessionID) {
    try {
        // Filtra solo le sequenze valide di 9 elementi
        const validData = dataArray.filter(entry =>
            Array.isArray(entry) &&
            entry.length === 9 &&
            entry.every(num => typeof num === 'number')
        );

        //se valid data ha lunghezza a 0, non c'è nessun dato da salvare
        if (validData.length === 0) {
            console.warn("Nessun dato valido da salvare.");
            return;
        }

        //Adattamento dei dati al formato previsto dal modello inertialDataModel che dichiara una prop. data
        const formattedData = validData.map(entry => ({
            data: entry,
            sessionId: sessionID
        }));

        //salva tutti gli oggetti formattedData nel database MongoDB in una sola operazione (mongoose)
        await inertialData.insertMany(formattedData);

        console.log(`${formattedData.length} dati salvati con successo su MongoDB.`);
    } catch (error) {
        console.error("Errore durante il salvataggio dei dati:", error);
    }
}

async function InertialasCSVexport() {
    try {
        //Recupera tutti i dati inerziali dalla collezione MongoDB come oggetti JS "lean"
        const data = await inertialData.find().lean();

        //Per ogni documento, crea un oggetto con le chiavi ch1, ch2, ..., ch9 e valori arrotondati
        const flatData = data.map(doc => {
            const obj = {};
            (doc.data || []).forEach((val, idx) => {
                // Se il valore è un numero, lo formatta con una cifra decimale, altrimenti lo lascia invariato
                obj[`ch${idx + 1}`] = typeof val === 'number' ? val.toFixed(1) : val;
            });
            return obj; // Oggetto trasformato, pronto per la conversione in CSV
        });

        //Crea un parser CSV usando la libreria `json2csv`
        const parser = new Parser();

        //Converte i dati trasformati in una stringa CSV e la restituisce
        return parser.parse(flatData);

    } catch (error) {
        //In caso di errore, lo rilancia come oggetto `Error` con messaggio specifico
        throw new Error(`Errore durante la generazione del CSV: ${error.message}`);
    }
}



module.exports = {
    getAllInertialData,
    getAllInertialDataBySession,
    getDataByChannel,
    deleteAllInertialData,
    deleteAllInertialDataBySession,
    saveInertialData,
    InertialasCSVexport
}
