const request = require("supertest");
const express = require("express");
const fs = require("fs");
const path = require("path");

jest.mock("fs");
jest.mock("../../src/services/Analysis_services/cleaningDataServices");

const cleaningService = require("../../src/services/Analysis_services/cleaningDataServices");
const cleaningController = require("../../src/controller/Analysis_controller/cleaningDataController");

const app = express();
app.use(express.json());

// Rotte simulate
app.post("/clean/mean", cleaningController.cleanWithMean);
app.post("/clean/median", cleaningController.cleanWithMedian);
app.post("/clean/ffill", cleaningController.cleanWithForwardFill);
app.post("/clean/bfill", cleaningController.cleanWithBackwardFill);

describe("CleaningController", () => {
    const fakeCsvPath = path.join(__dirname, "dummy.csv");

    beforeEach(() => {
        jest.clearAllMocks();
        fs.existsSync.mockReturnValue(true); // Simula che il file CSV esiste
    });

    const body = {
        sessionId: "123",
        isNaN: true,
        isOutliers: false,
        outliers_adv: false,
        dataType: "bio"
    };

    test("cleanWithMean restituisce risultato corretto", async () => {
        cleaningService.cleanWithMean.mockResolvedValue({ cleaned: true });

        const res = await request(app).post("/clean/mean").send(body);

        expect(res.status).toBe(200);
        expect(res.body).toEqual({ cleaned: true });
        expect(cleaningService.cleanWithMean).toHaveBeenCalled();
    });

    test("cleanWithMedian restituisce risultato corretto", async () => {
        cleaningService.cleanWithMedian.mockResolvedValue({ cleaned: true });

        const res = await request(app).post("/clean/median").send(body);

        expect(res.status).toBe(200);
        expect(res.body).toEqual({ cleaned: true });
        expect(cleaningService.cleanWithMedian).toHaveBeenCalled();
    });

    test("cleanWithForwardFill restituisce risultato corretto", async () => {
        cleaningService.cleanWithForwardFill.mockResolvedValue({ cleaned: true });

        const res = await request(app).post("/clean/ffill").send(body);

        expect(res.status).toBe(200);
        expect(res.body).toEqual({ cleaned: true });
        expect(cleaningService.cleanWithForwardFill).toHaveBeenCalled();
    });

    test("cleanWithBackwardFill restituisce risultato corretto", async () => {
        cleaningService.cleanWithBackwardFill.mockResolvedValue({ cleaned: true });

        const res = await request(app).post("/clean/bfill").send(body);

        expect(res.status).toBe(200);
        expect(res.body).toEqual({ cleaned: true });
        expect(cleaningService.cleanWithBackwardFill).toHaveBeenCalled();
    });

    test("Ritorna errore se il file non esiste", async () => {
        fs.existsSync.mockReturnValue(false);

        const res = await request(app).post("/clean/mean").send(body);

        expect(res.status).toBe(500);
        expect(res.body.error).toMatch(/Il file CSV non esiste/);
    });

    test("Gestisce eccezione del service", async () => {
        fs.existsSync.mockReturnValue(true);
        cleaningService.cleanWithMean.mockRejectedValue(new Error("Errore interno"));

        const res = await request(app).post("/clean/mean").send(body);

        expect(res.status).toBe(500);
        expect(res.body).toEqual({ error: "Errore interno" });
    });
});
