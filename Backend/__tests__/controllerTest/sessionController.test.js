const request = require("supertest");
const express = require("express");
const sessionController = require("../../src/controller/sessionController");
const sessionService = require("../../src/services/sessionService");

jest.mock("../../src/services/sessionService");

const app = express();
app.use(express.json());

// Middleware per simulare autenticazione
app.use((req, res, next) => {
    req.user = { id: "fakeUserId" };
    next();
});

// Rotte simulate
app.get("/sessions", sessionController.getSession);
app.get("/sessions/:id", sessionController.getSessionByID);
app.get("/patients/:id/sessions", sessionController.getPatientSessionById);
app.post("/sessions", sessionController.createSession);
app.delete("/sessions/:sessionId", sessionController.deleteSessionById);
app.put("/sessions/:sessionId", sessionController.updateSession);

describe("sessionController", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("GET /sessions restituisce tutte le sessioni dell'utente", async () => {
        const mockSessions = [{ id: "s1" }, { id: "s2" }];
        sessionService.getSession.mockResolvedValue(mockSessions);

        const res = await request(app).get("/sessions");

        expect(res.status).toBe(200);
        expect(res.body).toEqual(mockSessions);
        expect(sessionService.getSession).toHaveBeenCalledWith("fakeUserId");
    });

    test("GET /sessions/:id restituisce la sessione per ID", async () => {
        const mockSession = { id: "s1", note: "test" };
        sessionService.getSessionByID.mockResolvedValue(mockSession);

        const res = await request(app).get("/sessions/s1");

        expect(res.status).toBe(200);
        expect(res.body).toEqual(mockSession);
        expect(sessionService.getSessionByID).toHaveBeenCalledWith("s1", "fakeUserId");
    });

    test("GET /sessions/:id ritorna 404 se non trovata", async () => {
        sessionService.getSessionByID.mockResolvedValue(null);

        const res = await request(app).get("/sessions/s999");

        expect(res.status).toBe(404);
        expect(res.body).toEqual({ error: "Sessione non trovata" });
    });

    test("GET /patients/:id/sessions restituisce le sessioni del paziente", async () => {
        const patientSessions = [{ sessionId: "s1" }];
        sessionService.getPatientSessionById.mockResolvedValue(patientSessions);

        const res = await request(app).get("/patients/123/sessions");

        expect(res.status).toBe(200);
        expect(res.body).toEqual(patientSessions);
        expect(sessionService.getPatientSessionById).toHaveBeenCalledWith("123", "fakeUserId");
    });

    test("POST /sessions crea una nuova sessione", async () => {
        const sessionData = { patientId: "p1", note: "inizio" };
        const createdSession = { id: "sNew", ...sessionData };
        sessionService.createSession.mockResolvedValue(createdSession);

        const res = await request(app).post("/sessions").send(sessionData);

        expect(res.status).toBe(201);
        expect(res.body).toEqual(createdSession);
        expect(sessionService.createSession).toHaveBeenCalledWith(sessionData, "fakeUserId");
    });

    test("DELETE /sessions/:sessionId elimina la sessione", async () => {
        sessionService.deleteSessionById.mockResolvedValue({ deletedCount: 1 });

        const res = await request(app).delete("/sessions/s1");

        expect(res.status).toBe(200);
        expect(res.body).toEqual({ message: "Sessione eliminata con successo" });
        expect(sessionService.deleteSessionById).toHaveBeenCalledWith("s1", "fakeUserId");
    });

    test("DELETE /sessions/:sessionId ritorna 404 se sessione non trovata", async () => {
        sessionService.deleteSessionById.mockResolvedValue({ deletedCount: 0 });

        const res = await request(app).delete("/sessions/notfound");

        expect(res.status).toBe(404);
        expect(res.body).toEqual({ error: "Sessione non trovata o già eliminata" });
    });

    test("PUT /sessions/:sessionId aggiorna la sessione", async () => {
        const update = { note: "aggiornata" };
        const updatedSession = { id: "s1", note: "aggiornata" };
        sessionService.updateSession.mockResolvedValue(updatedSession);

        const res = await request(app).put("/sessions/s1").send(update);

        expect(res.status).toBe(200);
        expect(res.body).toEqual(updatedSession);
        expect(sessionService.updateSession).toHaveBeenCalledWith(update, "fakeUserId", "s1");
    });
});
