const request = require("supertest");
const express = require("express");
const fs = require("fs");
const path = require("path");

jest.mock("fs");
jest.mock("../../src/services/Analysis_services/normalizationDataServices");

const normalizationService = require("../../src/services/Analysis_services/normalizationDataServices");
const normalizationController = require("../../src/controller/Analysis_controller/normalizationDataController");

const app = express();
app.use(express.json());

// Rotte simulate
app.post("/normalize/minmax", normalizationController.minmaxNormalization);
app.post("/normalize/standard", normalizationController.standardNormalization);

describe("NormalizationController", () => {
    const requestBody = {
        sessionId: "456",
        dataType: "bio"
    };

    beforeEach(() => {
        jest.clearAllMocks();
        fs.existsSync.mockReturnValue(true); // Simula presenza file
    });

    test("minmaxNormalization restituisce il risultato corretto", async () => {
        normalizationService.minmaxNormalization.mockResolvedValue({ normalized: "minmax" });

        const res = await request(app).post("/normalize/minmax").send(requestBody);

        expect(res.status).toBe(200);
        expect(res.body).toEqual({ normalized: "minmax" });
        expect(normalizationService.minmaxNormalization).toHaveBeenCalledWith(expect.any(String));
    });

    test("standardNormalization restituisce il risultato corretto", async () => {
        normalizationService.standardNormalization.mockResolvedValue({ normalized: "standard" });

        const res = await request(app).post("/normalize/standard").send(requestBody);

        expect(res.status).toBe(200);
        expect(res.body).toEqual({ normalized: "standard" });
        expect(normalizationService.standardNormalization).toHaveBeenCalledWith(expect.any(String));
    });

    test("ritorna errore 500 se il file CSV non esiste", async () => {
        fs.existsSync.mockReturnValue(false);

        const res = await request(app).post("/normalize/minmax").send(requestBody);

        expect(res.status).toBe(500);
        expect(res.body.error).toMatch(/Il file CSV non esiste/);
    });

    test("gestisce eccezioni del service", async () => {
        normalizationService.minmaxNormalization.mockRejectedValue(new Error("Errore interno"));

        const res = await request(app).post("/normalize/minmax").send(requestBody);

        expect(res.status).toBe(500);
        expect(res.body).toEqual({ error: "Errore interno" });
    });
});
