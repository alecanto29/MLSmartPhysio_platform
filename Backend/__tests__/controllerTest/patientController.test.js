const request = require("supertest");
const express = require("express");
const patientController = require("../../src/controller/patientController");
const patientService = require("../../src/services/patientService");

jest.mock("../../src/services/patientService");

const app = express();
app.use(express.json());

// Middleware finto per simulare autenticazione e lingua
app.use((req, res, next) => {
    req.user = { id: "fakeUserId" };
    req.language = "en"; // 👈 Simulazione parametro lingua
    next();
});

// Rotte simulate
app.post("/patients", patientController.createNewPatient);
app.put("/patients/:id", patientController.updatePatientInfo);
app.delete("/patients/:id", patientController.deleteNewPatient);

describe("patientController", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("POST /patients crea un nuovo paziente", async () => {
        const patientData = { name: "Luigi Verdi" };
        const created = { id: "p1", ...patientData };

        patientService.createNewPatient.mockResolvedValue(created);

        const res = await request(app)
            .post("/patients")
            .send(patientData);

        expect(res.status).toBe(201);
        expect(res.body).toEqual(created);
        expect(patientService.createNewPatient).toHaveBeenCalledWith(patientData, "fakeUserId", "en");
    });

    test("PUT /patients/:id aggiorna le informazioni di un paziente", async () => {
        const patientId = "p1";
        const updateData = { name: "Luigi Bianchi" };
        const updated = { id: patientId, ...updateData };

        patientService.updatePatientInfo.mockResolvedValue(updated);

        const res = await request(app)
            .put(`/patients/${patientId}`)
            .send(updateData);

        expect(res.status).toBe(200);
        expect(res.body).toEqual(updated);
        expect(patientService.updatePatientInfo).toHaveBeenCalledWith(updateData, "fakeUserId", patientId, "en");
    });

    test("DELETE /patients/:id elimina un paziente", async () => {
        const patientId = "p1";

        patientService.deleteNewPatient.mockResolvedValue({ deletedCount: 1 });

        const res = await request(app).delete(`/patients/${patientId}`);

        expect(res.status).toBe(200);
        expect(res.body).toEqual({ message: "Paziente eliminato con successo" });
        expect(patientService.deleteNewPatient).toHaveBeenCalledWith(patientId, "fakeUserId");

    });

    test("DELETE /patients/:id ritorna 404 se il paziente non esiste", async () => {
        const patientId = "p1";

        patientService.deleteNewPatient.mockResolvedValue({ deletedCount: 0 });

        const res = await request(app).delete(`/patients/${patientId}`);

        expect(res.status).toBe(404);
        expect(res.body).toEqual({ error: "Paziente non trovato o già eliminato" });
    });
});
