const request = require("supertest");
const express = require("express");
const app = express();
const router = require("../../src/routes/doctorRoutes");

// Mock del middleware auth
jest.mock("../../src/middleware/auth", () => (req, res, next) => {
    req.user = { id: "mockDoctorId" };
    next();
});

// Mock del controller
const controller = require("../../src/controller/DoctorController");
jest.mock("../../src/controller/DoctorController");

// Configura app
app.use(express.json());
app.use("/doctors", router);

describe("Doctor Router", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("GET /doctors - getAllDoctors", async () => {
        controller.getAllDoctors.mockImplementation((req, res) => {
            res.status(200).json({ message: "All doctors" });
        });

        const res = await request(app).get("/doctors");

        expect(res.status).toBe(200);
        expect(res.body.message).toBe("All doctors");
        expect(controller.getAllDoctors).toHaveBeenCalled();
    });

    test("GET /doctors/appointments - getDoctorAppointments", async () => {
        controller.getDoctorAppointments.mockImplementation((req, res) => {
            res.status(200).json({ message: "Doctor appointments" });
        });

        const res = await request(app).get("/doctors/appointments");

        expect(res.status).toBe(200);
        expect(res.body.message).toBe("Doctor appointments");
        expect(controller.getDoctorAppointments).toHaveBeenCalled();
    });

    test("GET /doctors/:id - getDoctorById", async () => {
        controller.getDoctorById.mockImplementation((req, res) => {
            res.status(200).json({ message: `Doctor ${req.params.id}` });
        });

        const res = await request(app).get("/doctors/abc123");

        expect(res.status).toBe(200);
        expect(res.body.message).toBe("Doctor abc123");
        expect(controller.getDoctorById).toHaveBeenCalled();
    });

    test("POST /doctors - createNewDoctor", async () => {
        controller.createNewDoctor.mockImplementation((req, res) => {
            res.status(201).json({ message: "Doctor created" });
        });

        const res = await request(app)
            .post("/doctors")
            .send({
                name: "Maria",
                surname: "Verdi",
                birthDate: "1985-01-01",
                fiscalCode: "VRDMRA85A01F205X",
                email: "maria.verdi@example.com",
                passwordHash: "hashed",
                licenseNumber: "LIC123123"
            });

        expect(res.status).toBe(201);
        expect(res.body.message).toBe("Doctor created");
        expect(controller.createNewDoctor).toHaveBeenCalled();
    });

    test("DELETE /doctors/:id - deleteDoctorById", async () => {
        controller.deleteDoctorById.mockImplementation((req, res) => {
            res.status(200).json({ message: `Doctor ${req.params.id} deleted` });
        });

        const res = await request(app).delete("/doctors/abc123");

        expect(res.status).toBe(200);
        expect(res.body.message).toBe("Doctor abc123 deleted");
        expect(controller.deleteDoctorById).toHaveBeenCalled();
    });
});
