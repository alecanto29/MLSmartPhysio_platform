require("dotenv").config();
const path = require("path");
const fs = require("fs");

// === Directory Parquet temporanea sotto Backend/tmp/data_work ===
const rootDir = path.resolve(__dirname, "..");            // -> Backend
process.env.SMARTPHYSIO_WORKDIR = path.join(rootDir, "tmp", "data_work");
const workdir = process.env.SMARTPHYSIO_WORKDIR;

console.log("[BOOT] SMARTPHYSIO_WORKDIR =", workdir);

// Crea la cartella se non esiste
try {
    fs.mkdirSync(workdir, { recursive: true });
    console.log("[BOOT] ensured", workdir);
} catch (e) {
    console.error("[BOOT] mkdir failed:", e.message);
}

// Pulisci la cartella all'avvio
try {
    for (const f of fs.readdirSync(workdir)) {
        fs.rmSync(path.join(workdir, f), { force: true, recursive: true });
    }
    console.log("[BOOT] data_work ripulita");
} catch (e) {
    console.warn("[BOOT] cleanup data_work fallito:", e.message);
}

const express = require("express");
const dbConnection = require("../src/config/db");
const http = require("http");
const { Server } = require("socket.io");
const serialService = require("./services/serialService");
const cors = require("cors");
const { i18nextMiddleware } = require('../i18n.config');

// Connessione al DB
dbConnection.connectDB();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});

// FUNZIONALITÀ WEBSOCKET
io.on("connection", (socket) => {
    console.log("Client connected");

    socket.on("data", (data) => {
        console.log("Dati ricevuti dal client:", data);
    });

    socket.on("disconnect", () => {
        console.log("Client disconnected", socket.id);
    });
});

serialService.initializeSocket(io);

// FUNZIONALITÀ HTTP
app.use(cors()); // deve essere PRIMA
app.use(i18nextMiddleware); // deve essere DOPO cors
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Import delle rotte
const sEMGdataRoutes = require("../src/routes/sEMGdataRoutes");
const inertialDataRoutes = require("../src/routes/inertialDataRoutes");
const serialRoutes = require("../src/routes/serialRoutes");
const loginRoutes = require("../src/routes/loginRoutes");
const patientRoutes = require("../src/routes/patienceRoutes");
const doctorRoutes = require("../src/routes/doctorRoutes");
const appointmentsRoutes = require("../src/routes/appointmentsRoutes");
const sessionsRoutes = require("../src/routes/sessionRoutes");
const cleaningRoutes = require("../src/routes/Analysis_routes/cleaningDataRoutes");
const normalizeRoutes = require("../src/routes/Analysis_routes/normalizationDataRoutes");
const filterRoutes = require("../src/routes/Analysis_routes/filteringDataRoutes");
const spectrumRoutes = require("../src/routes/Analysis_routes/spectrumAnalysisRoutes");

app.use("/smartPhysio/semg", sEMGdataRoutes);
app.use("/smartPhysio/inertial", inertialDataRoutes);
app.use("/smartPhysio", serialRoutes);
app.use("/smartPhysio/auth", loginRoutes);
app.use("/smartPhysio/patient", patientRoutes);
app.use("/smartPhysio/doctor", doctorRoutes);
app.use("/smartPhysio/appointments", appointmentsRoutes);
app.use("/smartPhysio/sessions", sessionsRoutes);
app.use("/smartPhysio/clean", cleaningRoutes);
app.use("/smartPhysio/normalize", normalizeRoutes);
app.use("/smartPhysio/filter", filterRoutes);
app.use("/smartPhysio/spectrum", spectrumRoutes);

// Porta server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server in esecuzione sulla porta: ${PORT}`);
});

module.exports = { io };
