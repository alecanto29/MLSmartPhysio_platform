const sEMGdata = require("../models/sEMGdataModel");
const { Parser } = require("json2csv");

//Metodo per ricavare tutti sEMG i dati inerziali dal db
async function getAllsEMGdata(){
    try{
        const data = await sEMGdata.find();
        return data;
    }catch(error){
        throw new Error(`Errore durante il recupero dei dati sEMG: ${error.message}`);
    }
}

const getAllsEMGdataBySession = async (sessionID) =>{
        const sessionData = await sEMGdata.find({sessionId: sessionID});
        return sessionData
}

//Metodo per ricavare tutti i dati sEMG di un canale specifico
async function getDataByChannel(channelNumber){

    //controllo che il numero del canale sia nei range corretti stabiliti
    if(channelNumber < 0 || channelNumber > 7) {
        throw new Error(`Il numero del canale deve essere compreso tra 0 e 7, canale fornito: ${channelNumber}`);
    }

    try {
        const allData = await sEMGdata.find();

        //array contenitore per i dati del singolo canale
        let chooseChannelData = [];

        for (let i = 0; i < allData.length; i++) {
            //verifico che la lunghezza del dati sia esattamente di 9 canali (stabilita)
            if(allData[i].data.length === 8){
                //push del valore relativo a quello specifico canale della i-esima sequenza nell'array
                chooseChannelData.push(allData[i].data[channelNumber]);
            }
        }

        return chooseChannelData;

    } catch(error){
        throw new Error(`Errore durante il recupero dei dati per il canale ${channelNumber}: ${error.message}`)
    }
}

//Metodo per cancellare tutti i dati sEMG dal db
async function deleteAllsEMGdata(){
    try {
        await sEMGdata.deleteMany({});
        return { message: "Dati cancellati correttamente" };
    } catch (error) {
        throw new Error(`Errore durante la cancellazione dei dati: ${error.message}`);
    }
}

const deleteAllsEMGdataBySession = async (sessionID) =>{
    return await sEMGdata.deleteMany({sessionId: sessionID});
}


//Metodo per salvare i dati sEMG sul db
async function savesEMGdata(dataArray, sessionID) {
    try {
        // Filtra solo le sequenze valide di 8 elementi
        const validData = dataArray.filter(entry =>
            Array.isArray(entry) &&
            entry.length === 8 &&
            entry.every(num => typeof num === 'number')
        );

        //se valid data ha lunghezza a 0, non c'è nessun dato da salvare
        if (validData.length === 0) {
            console.warn("Nessun dato valido da salvare.");
            return;
        }

        //Adattamento dei dati al formato previsto dal modello sEMGdataModel che dichiara una prop. data
        const formattedData = validData.map(entry => ({
            data: entry,
            sessionId: sessionID
        }));

        //salva tutti gli oggetti formattedData nel database MongoDB in una sola operazione (mongoose)
        await sEMGdata.insertMany(formattedData);

        //console.log(`${formattedData.length} dati salvati con successo su MongoDB.`);
    } catch (error) {
        console.error("Errore durante il salvataggio dei dati:", error);
    }
}


async function sEMGasCSVexport() {
    try {
        //Recupera tutti i dati sEMG dalla collezione MongoDB come oggetti JS "lean"
        const data = await sEMGdata.find().lean();

        //Per ogni documento, crea un oggetto con le chiavi ch1, ch2, ..., ch9
        const flatData = data.map(doc => {
            const obj = {};
            doc.data.forEach((val, idx) => {
                //Associa il valore relativo al canale di quella sequenza all'indice idx iterato nel ciclo
                obj[`ch${idx + 1}`] = val;
            });
            return obj; // Oggetto trasformato, pronto per la conversione in CSV
        });

        //Crea un parser CSV usando la libreria `json2csv`
        const parser = new Parser();

        //Converte i dati trasformati in una stringa CSV e la restituisce
        return parser.parse(flatData);

    } catch (error) {
        throw new Error(`Errore durante la generazione del CSV: ${error.message}`);
    }
}

module.exports = {getAllsEMGdata,
    getAllsEMGdataBySession,
    getDataByChannel,
    deleteAllsEMGdata,
    deleteAllsEMGdataBySession,
    savesEMGdata,
    sEMGasCSVexport};