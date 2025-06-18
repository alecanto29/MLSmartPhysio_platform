const request = require("supertest");
const express = require("express");
const doctorController = require("../../src/controller/doctorController");
const doctorService = require("../../src/services/DoctorServices");

jest.mock("../../src/services/DoctorServices");

const app = express();
app.use(express.json());

// Middleware finto per simulare l'utente loggato (req.user.id)
app.use((req, res, next) => {
    req.user = { id: "fakeDoctorId" };
    next();
});

// Rotte simulate
app.get("/doctors", doctorController.getAllDoctors);
app.get("/doctors/:id", doctorController.getDoctorById);
app.get("/doctors/appointments/list", doctorController.getDoctorAppointments);
app.post("/doctors", doctorController.createNewDoctor);
app.delete("/doctors/:id", doctorController.deleteDoctorById);

describe("doctorController", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("GET /doctors restituisce tutti i medici", async () => {
        const mockDoctors = [{ name: "Dr. Mario" }];
        doctorService.getAllDoctors.mockResolvedValue(mockDoctors);

        const res = await request(app).get("/doctors");

        expect(res.status).toBe(200);
        expect(res.body).toEqual(mockDoctors);
        expect(doctorService.getAllDoctors).toHaveBeenCalled();
    });

    test("GET /doctors/:id restituisce il medico specificato", async () => {
        const mockDoctor = { id: "123", name: "Dr. Luigi" };
        doctorService.getDoctorById.mockResolvedValue(mockDoctor);

        const res = await request(app).get("/doctors/123");

        expect(res.status).toBe(200);
        expect(res.body).toEqual(mockDoctor);
        expect(doctorService.getDoctorById).toHaveBeenCalledWith("123");
    });

    test("GET /doctors/appointments/list restituisce gli appuntamenti del medico", async () => {
        const mockAppointments = [{ date: "2025-06-18", patient: "Mario Rossi" }];
        doctorService.getDoctorAppointments.mockResolvedValue(mockAppointments);

        const res = await request(app).get("/doctors/appointments/list");

        expect(res.status).toBe(200);
        expect(res.body).toEqual(mockAppointments);
        expect(doctorService.getDoctorAppointments).toHaveBeenCalledWith("fakeDoctorId");
    });

    test("POST /doctors crea un nuovo medico", async () => {
        const newDoctor = { name: "Dr. Peach", specialization: "Cardiology" };
        doctorService.createNewDoctor.mockResolvedValue(newDoctor);

        const res = await request(app).post("/doctors").send(newDoctor);

        expect(res.status).toBe(201);
        expect(res.body).toEqual(newDoctor);
        expect(doctorService.createNewDoctor).toHaveBeenCalledWith(newDoctor);
    });

    test("DELETE /doctors/:id elimina un medico", async () => {
        const mockResponse = { message: "Medico eliminato con successo" };
        doctorService.deleteDoctor.mockResolvedValue(mockResponse);

        const res = await request(app).delete("/doctors/456");

        expect(res.status).toBe(200);
        expect(res.body).toEqual(mockResponse);
        expect(doctorService.deleteDoctor).toHaveBeenCalledWith("456");
    });
});
