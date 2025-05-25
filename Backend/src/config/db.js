const mongoose = require('mongoose');

//await mongoose.connect('mongodb://localhost:27017/smartPhysio');

async function connectDB() {
    try {
        await mongoose.connect('mongodb+srv://alecanto:sEMGdata@mlsmartphysio.avgux0m.mongodb.net/MLSmartPhysio?retryWrites=true&w=majority&appName=MLSmartPhysio');

        console.log('Connessione a MongoDB riuscita.');
    } catch (error) {
        console.error(`Errore connessione a MongoDB: ${error.message}`);
    }
}

module.exports = { connectDB };
