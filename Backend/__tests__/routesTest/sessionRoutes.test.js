const request = require("supertest");
const express = require("express");
const sessionRouter = require("../../src/routes/sessionRoutes");
const sessionController = require("../../src/controller/sessionController");

// Mock auth middleware
jest.mock("../../src/middleware/auth", () => (req, res, next) => next());
// Mock controller
jest.mock("../../src/controller/sessionController");

const app = express();
app.use(express.json());
app.use("/sessions", sessionRouter);

describe("Session Routes", () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    test("GET /sessions - get all sessions for doctor", async () => {
        const mockSessions = [{ _id: "1", note: "Controllo" }];
        sessionController.getSession.mockImplementation((req, res) => {
            res.status(200).json(mockSessions);
        });

        const res = await request(app).get("/sessions");
        expect(res.status).toBe(200);
        expect(res.body).toEqual(mockSessions);
        expect(sessionController.getSession).toHaveBeenCalled();
    });

    test("GET /sessions/:id - get session by ID", async () => {
        const session = { _id: "1", note: "Singola sessione" };
        sessionController.getSessionByID.mockImplementation((req, res) => {
            res.status(200).json(session);
        });

        const res = await request(app).get("/sessions/1");
        expect(res.status).toBe(200);
        expect(res.body._id).toBe("1");
        expect(sessionController.getSessionByID).toHaveBeenCalled();
    });

    test("GET /sessions/patient/:id - get all sessions for a patient", async () => {
        const patientSessions = [{ _id: "1", patient: "abc123" }];
        sessionController.getPatientSessionById.mockImplementation((req, res) => {
            res.status(200).json(patientSessions);
        });

        const res = await request(app).get("/sessions/patient/abc123");
        expect(res.status).toBe(200);
        expect(res.body[0].patient).toBe("abc123");
        expect(sessionController.getPatientSessionById).toHaveBeenCalled();
    });

    test("POST /sessions - create new session", async () => {
        const sessionData = {
            date: "2025-06-18",
            time: "10:30",
            notes: "Visita di controllo",
            patient: "pat123",
            doctor: "doc456"
        };

        sessionController.createSession.mockImplementation((req, res) => {
            res.status(201).json({ message: "Session created" });
        });

        const res = await request(app).post("/sessions").send(sessionData);
        expect(res.status).toBe(201);
        expect(res.body.message).toBe("Session created");
        expect(sessionController.createSession).toHaveBeenCalled();
    });

    test("DELETE /sessions/:sessionId - delete session", async () => {
        sessionController.deleteSessionById.mockImplementation((req, res) => {
            res.status(204).send();
        });

        const res = await request(app).delete("/sessions/1");
        expect(res.status).toBe(204);
        expect(sessionController.deleteSessionById).toHaveBeenCalled();
    });

    test("PUT /sessions/:sessionId - update session", async () => {
        sessionController.updateSession.mockImplementation((req, res) => {
            res.status(200).json({ message: "Session updated" });
        });

        const res = await request(app).put("/sessions/1").send({ notes: "Aggiornato" });
        expect(res.status).toBe(200);
        expect(res.body.message).toBe("Session updated");
        expect(sessionController.updateSession).toHaveBeenCalled();
    });
});
