const request = require("supertest");
const express = require("express");
const patientRouter = require("../../src/routes/patienceRoutes");
const patientController = require("../../src/controller/patientController");

// Mock auth middleware
jest.mock("../../src/middleware/auth", () => (req, res, next) => next());
// Mock controller
jest.mock("../../src/controller/patientController");

const app = express();
app.use(express.json());
app.use("/patients", patientRouter);

describe("Patient Routes", () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    test("GET /patients - getAllPatients", async () => {
        const mockData = [{ name: "Anna" }, { name: "Luca" }];
        patientController.getAllPatients.mockImplementation((req, res) => {
            res.status(200).json(mockData);
        });

        const res = await request(app).get("/patients");
        expect(res.status).toBe(200);
        expect(res.body.length).toBe(2);
        expect(patientController.getAllPatients).toHaveBeenCalled();
    });

    test("GET /patients/critical - getAllCriticPatients", async () => {
        const mockData = [{ name: "Marco", critical: true }];
        patientController.getAllCriticPatients.mockImplementation((req, res) => {
            res.status(200).json(mockData);
        });

        const res = await request(app).get("/patients/critical");
        expect(res.status).toBe(200);
        expect(res.body[0].critical).toBe(true);
        expect(patientController.getAllCriticPatients).toHaveBeenCalled();
    });

    test("GET /patients/:id - getPatientById", async () => {
        const mockPatient = { name: "Chiara", id: "123" };
        patientController.getPatientById.mockImplementation((req, res) => {
            res.status(200).json(mockPatient);
        });

        const res = await request(app).get("/patients/123");
        expect(res.status).toBe(200);
        expect(res.body.name).toBe("Chiara");
        expect(patientController.getPatientById).toHaveBeenCalled();
    });

    test("POST /patients - createNewPatient", async () => {
        const newPatient = {
            name: "Marta",
            surname: "Verdi",
            gender: "female",
            healthCardNumber: "VDRMRT90A01F205X"
        };

        patientController.createNewPatient.mockImplementation((req, res) => {
            res.status(201).json({ message: "Created" });
        });

        const res = await request(app).post("/patients").send(newPatient);
        expect(res.status).toBe(201);
        expect(res.body.message).toBe("Created");
        expect(patientController.createNewPatient).toHaveBeenCalled();
    });

    test("PUT /patients/:id - updatePatientInfo", async () => {
        patientController.updatePatientInfo.mockImplementation((req, res) => {
            res.status(200).json({ message: "Updated" });
        });

        const res = await request(app).put("/patients/456").send({ name: "Laura" });
        expect(res.status).toBe(200);
        expect(res.body.message).toBe("Updated");
        expect(patientController.updatePatientInfo).toHaveBeenCalled();
    });

    test("DELETE /patients/:id - deleteNewPatient", async () => {
        patientController.deleteNewPatient.mockImplementation((req, res) => {
            res.status(204).send();
        });

        const res = await request(app).delete("/patients/789");
        expect(res.status).toBe(204);
        expect(patientController.deleteNewPatient).toHaveBeenCalled();
    });
});
