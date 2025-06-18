const request = require("supertest");
const express = require("express");
const app = express();
const router = require("../../src/routes/appointmentsRoutes");

// Middleware e Controller mock
jest.mock("../../src/middleware/auth", () => (req, res, next) => {
    req.user = { id: "mockUserId" }; // auth fittizia
    next();
});

const controller = require("../../src/controller/appointmentsController");
jest.mock("../../src/controller/appointmentsController");

// Setup app con JSON parsing e router
app.use(express.json());
app.use("/appointments", router);

describe("Appointments Router", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("GET /appointments - getAllAppointments", async () => {
        controller.getAllAppointments.mockImplementation((req, res) => {
            res.status(200).json({ message: "All appointments" });
        });

        const res = await request(app).get("/appointments");

        expect(res.status).toBe(200);
        expect(res.body.message).toBe("All appointments");
        expect(controller.getAllAppointments).toHaveBeenCalled();
    });

    test("GET /appointments/date - getAllAppointmentsDate", async () => {
        controller.getAllAppointmentsDate.mockImplementation((req, res) => {
            res.status(200).json({ message: "Appointments by date" });
        });

        const res = await request(app).get("/appointments/date");

        expect(res.status).toBe(200);
        expect(res.body.message).toBe("Appointments by date");
        expect(controller.getAllAppointmentsDate).toHaveBeenCalled();
    });

    test("GET /appointments/time - getAllAppointmentsTime", async () => {
        controller.getAllAppointmentsTime.mockImplementation((req, res) => {
            res.status(200).json({ message: "Appointments by time" });
        });

        const res = await request(app).get("/appointments/time");

        expect(res.status).toBe(200);
        expect(res.body.message).toBe("Appointments by time");
        expect(controller.getAllAppointmentsTime).toHaveBeenCalled();
    });

    test("POST /appointments/newAppointments - takeNewAppointment", async () => {
        controller.takeNewAppointment.mockImplementation((req, res) => {
            res.status(201).json({ message: "New appointment created" });
        });

        const res = await request(app)
            .post("/appointments/newAppointments")
            .send({ date: "2025-06-18", time: "10:00", patientId: "123", doctorId: "456" });

        expect(res.status).toBe(201);
        expect(res.body.message).toBe("New appointment created");
        expect(controller.takeNewAppointment).toHaveBeenCalled();
    });

    test("DELETE /appointments/:id - deleteAppointmentById", async () => {
        controller.deleteAppointmentById.mockImplementation((req, res) => {
            res.status(200).json({ message: `Appointment ${req.params.id} deleted` });
        });

        const res = await request(app).delete("/appointments/abc123");

        expect(res.status).toBe(200);
        expect(res.body.message).toBe("Appointment abc123 deleted");
        expect(controller.deleteAppointmentById).toHaveBeenCalled();
    });
});
