const request = require("supertest");
const express = require("express");
const patientController = require("../../src/controller/patientController");
const patientService = require("../../src/services/patientService");

jest.mock("../../src/services/patientService");

const app = express();
app.use(express.json());

// Middleware finto per simulare autenticazione
app.use((req, res, next) => {
    req.user = { id: "fakeUserId" };
    next();
});

// Rotte simulate
app.get("/patients", patientController.getAllPatients);
app.get("/patients/critical", patientController.getAllCriticPatients);
app.get("/patients/:id", patientController.getPatientById);
app.post("/patients", patientController.createNewPatient);
app.delete("/patients/:id", patientController.deleteNewPatient);
app.put("/patients/:id", patientController.updatePatientInfo);

describe("patientController", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("GET /patients restituisce tutti i pazienti", async () => {
        const mockPatients = [{ id: "p1", name: "Mario Rossi" }];
        patientService.getAllPatients.mockResolvedValue(mockPatients);

        const res = await request(app).get("/patients");

        expect(res.status).toBe(200);
        expect(res.body).toEqual(mockPatients);
        expect(patientService.getAllPatients).toHaveBeenCalledWith("fakeUserId");
    });

    test("GET /patients/:id restituisce un paziente esistente", async () => {
        const mockPatient = { id: "p1", name: "Mario Rossi" };
        patientService.getPatientById.mockResolvedValue(mockPatient);

        const res = await request(app).get("/patients/p1");

        expect(res.status).toBe(200);
        expect(res.body).toEqual(mockPatient);
        expect(patientService.getPatientById).toHaveBeenCalledWith("fakeUserId", "p1");
    });

    test("GET /patients/:id ritorna 404 se paziente non trovato", async () => {
        patientService.getPatientById.mockResolvedValue(null);

        const res = await request(app).get("/patients/unknown");

        expect(res.status).toBe(404);
        expect(res.body).toEqual({ error: "Paziente non trovato o non autorizzato" });
    });

    test("GET /patients/critical restituisce i pazienti critici", async () => {
        const critical = [{ id: "c1", critical: true }];
        patientService.getAllCriticPatients.mockResolvedValue(critical);

        const res = await request(app).get("/patients/critical");

        expect(res.status).toBe(200);
        expect(res.body).toEqual(critical);
        expect(patientService.getAllCriticPatients).toHaveBeenCalledWith("fakeUserId");
    });

    test("POST /patients crea un nuovo paziente", async () => {
        const patientData = { name: "Luigi Verdi" };
        const created = { id: "new", ...patientData };
        patientService.createNewPatient.mockResolvedValue(created);

        const res = await request(app).post("/patients").send(patientData);

        expect(res.status).toBe(201);
        expect(res.body).toEqual(created);
        expect(patientService.createNewPatient).toHaveBeenCalledWith(patientData, "fakeUserId");
    });

    test("DELETE /patients/:id elimina un paziente", async () => {
        const deleted = { id: "p1", deleted: true };
        patientService.deleteNewPatient.mockResolvedValue(deleted);

        const res = await request(app).delete("/patients/p1");

        expect(res.status).toBe(200);
        expect(res.body).toEqual(deleted);
        expect(patientService.deleteNewPatient).toHaveBeenCalledWith("p1", "fakeUserId");
    });

    test("DELETE /patients/:id ritorna 404 se paziente non trovato", async () => {
        patientService.deleteNewPatient.mockResolvedValue(null);

        const res = await request(app).delete("/patients/notfound");

        expect(res.status).toBe(404);
        expect(res.body).toEqual({ error: "Paziente non trovato o non autorizzato" });
    });

    test("PUT /patients/:id aggiorna le informazioni di un paziente", async () => {
        const updated = { id: "p1", name: "Luigi Bianchi" };
        patientService.updatePatientInfo.mockResolvedValue(updated);

        const res = await request(app).put("/patients/p1").send({ name: "Luigi Bianchi" });

        expect(res.status).toBe(200);
        expect(res.body).toEqual(updated);
        expect(patientService.updatePatientInfo).toHaveBeenCalledWith(
            { name: "Luigi Bianchi" },
            "fakeUserId",
            "p1"
        );
    });
});
