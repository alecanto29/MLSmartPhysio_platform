const request = require("supertest");
const express = require("express");
const fs = require("fs");
const path = require("path");

jest.mock("fs");
jest.mock("../../src/services/Analysis_services/filteringDataServices");

const filteringService = require("../../src/services/Analysis_services/filteringDataServices");
const filteringController = require("../../src/controller/Analysis_controller/filteringDataController");

const app = express();
app.use(express.json());

// Rotte simulate
app.post("/filter/low", filteringController.lowPassFilter);
app.post("/filter/high", filteringController.highPassFilter);
app.post("/filter/notch", filteringController.notchFilter);

describe("FilteringController", () => {
    const baseBody = {
        sessionId: "123",
        cutoff: 50,
        order: 2,
        dataType: "bio"
    };

    beforeEach(() => {
        jest.clearAllMocks();
        fs.existsSync.mockReturnValue(true); // Simula file CSV presente
    });

    test("lowPassFilter restituisce il risultato corretto", async () => {
        filteringService.lowPassFilter.mockResolvedValue({ filtered: true });

        const res = await request(app).post("/filter/low").send(baseBody);

        expect(res.status).toBe(200);
        expect(res.body).toEqual({ filtered: true });
        expect(filteringService.lowPassFilter).toHaveBeenCalledWith(expect.any(String), 50, 2);
    });

    test("highPassFilter restituisce il risultato corretto", async () => {
        filteringService.highPassFilter.mockResolvedValue({ filtered: true });

        const res = await request(app).post("/filter/high").send(baseBody);

        expect(res.status).toBe(200);
        expect(res.body).toEqual({ filtered: true });
        expect(filteringService.highPassFilter).toHaveBeenCalledWith(expect.any(String), 50, 2);
    });

    test("notchFilter restituisce il risultato corretto", async () => {
        filteringService.notchFilter.mockResolvedValue({ filtered: true });

        const res = await request(app).post("/filter/notch").send(baseBody);

        expect(res.status).toBe(200);
        expect(res.body).toEqual({ filtered: true });
        expect(filteringService.notchFilter).toHaveBeenCalledWith(expect.any(String), 50, 2);
    });

    test("ritorna errore 500 se file non esiste", async () => {
        fs.existsSync.mockReturnValue(false);

        const res = await request(app).post("/filter/low").send(baseBody);

        expect(res.status).toBe(500);
        expect(res.body.error).toMatch(/Il file CSV non esiste/);
    });

    test("gestisce eccezione del service", async () => {
        filteringService.lowPassFilter.mockRejectedValue(new Error("Errore filtro"));

        const res = await request(app).post("/filter/low").send(baseBody);

        expect(res.status).toBe(500);
        expect(res.body).toEqual({ error: "Errore filtro" });
    });
});
