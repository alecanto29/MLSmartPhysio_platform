const request = require("supertest");
const express = require("express");
const appointmentsController = require("../../src/controller/appointmentsController");
const appointmentsService = require("../../src/services/AppointmentsService");

jest.mock("../../src/services/AppointmentsService");

const app = express();
app.use(express.json());

// Middleware finto per simulare autenticazione con user ID
app.use((req, res, next) => {
    req.user = { id: "fakeUserId" };
    next();
});

// Rotte simulate
app.get("/appointments", appointmentsController.getAllAppointments);
app.get("/appointments/dates", appointmentsController.getAllAppointmentsDate);
app.get("/appointments/times", appointmentsController.getAllAppointmentsTime);
app.post("/appointments", appointmentsController.takeNewAppointment);
app.delete("/appointments/old", appointmentsController.deleteOldAppointments);
app.delete("/appointments/:id", appointmentsController.deleteAppointmentById);

describe("AppointmentsController", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("GET /appointments restituisce tutti gli appuntamenti (dopo eliminazione vecchi)", async () => {
        appointmentsService.deleteOldAppointments.mockResolvedValue();
        appointmentsService.getAllAppointments.mockResolvedValue([{ id: 1 }]);

        const res = await request(app).get("/appointments");

        expect(res.status).toBe(200);
        expect(res.body).toEqual([{ id: 1 }]);
        expect(appointmentsService.deleteOldAppointments).toHaveBeenCalled();
        expect(appointmentsService.getAllAppointments).toHaveBeenCalledWith("fakeUserId");
    });

    test("GET /appointments/dates restituisce tutte le date", async () => {
        appointmentsService.getAllAppointmentsDate.mockResolvedValue(["2025-06-18"]);

        const res = await request(app).get("/appointments/dates");

        expect(res.status).toBe(200);
        expect(res.body).toEqual(["2025-06-18"]);
        expect(appointmentsService.getAllAppointmentsDate).toHaveBeenCalledWith("fakeUserId");
    });

    test("GET /appointments/times restituisce tutti gli orari", async () => {
        appointmentsService.getAllAppointmentsTime.mockResolvedValue(["14:00"]);

        const res = await request(app).get("/appointments/times");

        expect(res.status).toBe(200);
        expect(res.body).toEqual(["14:00"]);
        expect(appointmentsService.getAllAppointmentsTime).toHaveBeenCalledWith("fakeUserId");
    });

    test("POST /appointments crea un nuovo appuntamento", async () => {
        const newAppointment = { date: "2025-06-18", time: "14:00" };
        appointmentsService.takeNewAppointment.mockResolvedValue(newAppointment);

        const res = await request(app)
            .post("/appointments")
            .send(newAppointment);

        expect(res.status).toBe(200);
        expect(res.body).toEqual(newAppointment);
        expect(appointmentsService.takeNewAppointment).toHaveBeenCalledWith(newAppointment, "fakeUserId");
    });

    test("DELETE /appointments/old cancella appuntamenti vecchi", async () => {
        appointmentsService.deleteOldAppointments.mockResolvedValue();

        const res = await request(app).delete("/appointments/old");

        expect(res.status).toBe(200);
        expect(res.body).toEqual({ message: "Appuntamenti vecchi cancellati con successo." });
        expect(appointmentsService.deleteOldAppointments).toHaveBeenCalled();
    });

    test("DELETE /appointments/:id elimina appuntamento per ID", async () => {
        appointmentsService.deleteAppointmentById.mockResolvedValue({ deletedCount: 1 });

        const res = await request(app).delete("/appointments/123");

        expect(res.status).toBe(200);
        expect(res.body).toEqual({ message: "Appuntamento eliminato con successo" });
        expect(appointmentsService.deleteAppointmentById).toHaveBeenCalledWith("fakeUserId", "123");
    });

    test("DELETE /appointments/:id ritorna 404 se nessun appuntamento trovato", async () => {
        appointmentsService.deleteAppointmentById.mockResolvedValue({ deletedCount: 0 });

        const res = await request(app).delete("/appointments/456");

        expect(res.status).toBe(404);
        expect(res.body).toEqual({ error: "Appuntamento non trovata o già eliminata" });
    });
});
