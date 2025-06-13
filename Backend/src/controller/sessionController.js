const sessionService = require("../services/sessionService");

const getSession = async (req, res) => {
    try {
        const sessionData = await sessionService.getSession(req.user.id);
        res.status(200).json(sessionData);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getSessionByID = async (req, res) => {
    try {
        const sessionData = await sessionService.getSessionByID(req.params.id, req.user.id);
        if (!sessionData) {
            return res.status(404).json({ error: "Sessione non trovata" });
        }
        res.status(200).json(sessionData);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getPatientSessionById = async (req, res) => {
    try{
        const patientSessions = await sessionService.getPatientSessionById(req.params.id, req.user.id);
        res.status(200).json(patientSessions);
    }catch(error){
        res.status(500).json({error: error.message});
    }
}


const createSession = async (req, res) => {
    try {
        const newSession = await sessionService.createSession(req.body, req.user.id);
        res.status(201).json(newSession);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const deleteSessionById = async (req, res) => {
    try {

        const result = await sessionService.deleteSessionById(req.params.sessionId, req.user.id);
        if (result.deletedCount === 0) {
            return res.status(404).json({ error: "Sessione non trovata o già eliminata" });
        }
        res.status(200).json({ message: "Sessione eliminata con successo" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const updateSession = async (req, res) => {
    try {
        const sessionToUpdate = await sessionService.updateSession(req.body, req.user.id, req.params.sessionId);
        res.status(200).json(sessionToUpdate);
    } catch (error) {
        console.error("Errore nel controller updateSession:", error);
        res.status(500).json({ error: error.message });
    }
};


module.exports = {
    getSession,
    getSessionByID,
    createSession,
    deleteSessionById,
    getPatientSessionById,
    updateSession
};
