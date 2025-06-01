const mongoose = require('mongoose');

async function connectDB() {
    try {
        await mongoose.connect('mongodb://localhost:27017/MLSmartPhysio_platform');

        console.log('Connessione a MongoDB riuscita.');
    } catch (error) {
        console.error(`Errore connessione a MongoDB: ${error.message}`);
    }
}

module.exports = { connectDB };
