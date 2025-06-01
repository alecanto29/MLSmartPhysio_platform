require("dotenv").config();

const express = require("express");
const dbConnection = require("../src/config/db");
const http = require("http");
const { Server } = require("socket.io");
const serialService = require("./services/serialService");
const cors = require("cors");

// Connessione al DB
dbConnection.connectDB();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});


//FUNZIONALITA' WEBSOCKET


io.on("connection", (socket) => {
    console.log("Client connected");

    socket.on("data", (data) => {
        console.log("Dati ricevuti dal client:", data);
    });

    socket.on("disconnect", ()=> {
        console.log("Client disconnected", socket.id);
    })
});


serialService.initializeSocket(io);

//FUNZIONALITA' HTTP

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Import delle rotte
const sEMGdataRoutes = require("../src/routes/sEMGdataRoutes");
const inertialDataRoutes = require("../src/routes/inertialDataRoutes");
const serialRoutes = require("../src/routes/serialRoutes")
const loginRoutes = require ("../src/routes/loginRoutes");

app.use("/smartPhysio/semg", sEMGdataRoutes);
app.use("/smartPhysio/inertial", inertialDataRoutes);
app.use("/smartPhysio", serialRoutes);
app.use("/smartPhysio/auth", loginRoutes);

// Porta server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server in esecuzione sulla porta: ${PORT}`);
});


module.exports = { io };
