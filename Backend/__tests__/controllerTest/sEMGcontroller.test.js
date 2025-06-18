const request = require("supertest");
const express = require("express");
const controller = require("../../src/controller/sEMGdataController");
const service = require("../../src/services/sEMGdataService");

jest.mock("../../src/services/sEMGdataService");

const app = express();
app.use(express.json());

// Route simulate per testare direttamente i metodi del controller
app.get("/semg", controller.getData);
app.get("/semg/:id", controller.getDataByChannel);
app.delete("/semg", controller.deleteAllsEMGdata);
app.get("/semg/export/csv", controller.sEMGexportAsCSV);

describe("sEMGdataController", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("GET /semg restituisce i dati", async () => {
        const mockData = [{ data: [1,2,3,4,5,6,7,8] }];
        service.getAllsEMGdata.mockResolvedValue(mockData);

        const res = await request(app).get("/semg");

        expect(res.status).toBe(200);
        expect(res.body).toEqual(mockData);
    });

    test("GET /semg/:id restituisce i dati per canale", async () => {
        service.getDataByChannel.mockResolvedValue([100, 200]);

        const res = await request(app).get("/semg/1");

        expect(res.status).toBe(200);
        expect(res.body).toEqual([100, 200]);
    });

    test("DELETE /semg cancella tutti i dati", async () => {
        service.deleteAllsEMGdata.mockResolvedValue({ message: "Dati cancellati correttamente" });

        const res = await request(app).delete("/semg");

        expect(res.status).toBe(200);
        expect(res.body).toEqual({ message: "Dati cancellati correttamente" });
        expect(service.deleteAllsEMGdata).toHaveBeenCalled(); // ✅ chiamata verificata
    });

    test("GET /semg/export/csv restituisce il CSV", async () => {
        service.sEMGasCSVexport.mockResolvedValue("CSV_CONTENT");

        const res = await request(app).get("/semg/export/csv");

        expect(res.status).toBe(200);
        expect(res.text).toBe("CSV_CONTENT");
        expect(res.headers["content-type"]).toContain("text/csv");
        expect(res.headers["content-disposition"]).toContain("semg_data.csv");
        expect(service.sEMGasCSVexport).toHaveBeenCalled();  // ✅ solo export
    });
});
