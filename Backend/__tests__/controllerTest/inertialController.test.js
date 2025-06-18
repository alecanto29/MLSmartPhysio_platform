const request = require("supertest");
const express = require("express");
const controller = require("../../src/controller/inertialDataController");
const service = require("../../src/services/inertialDataService");

// Mock del service usato nel controller
jest.mock("../../src/services/inertialDataService");

const app = express();
app.use(express.json());

// Colleghiamo le route manualmente per testare
app.get("/inertial", controller.getData);
app.get("/inertial/:id", controller.getDataByChannel);
app.delete("/inertial", controller.deleteAllInertialData);
app.get("/inertial/export/csv", controller.InertialExportAsCSV);

describe("inertialDataController", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("GET /inertial - restituisce tutti i dati", async () => {
        service.getAllInertialData.mockResolvedValue([{ data: [1,2,3,4,5,6,7,8] }]);

        const res = await request(app).get("/inertial");

        expect(res.status).toBe(200);
        expect(res.body).toEqual([{ data: [1,2,3,4,5,6,7,8] }]);
    });

    test("GET /inertial/:id - restituisce dati per canale", async () => {
        service.getDataByChannel.mockResolvedValue([100, 101]);

        const res = await request(app).get("/inertial/1");

        expect(res.status).toBe(200);
        expect(res.body).toEqual([100, 101]);
    });

    test("DELETE /inertial - cancella tutti i dati", async () => {
        service.deleteAllInertialData.mockResolvedValue({ message: "ok" });

        const res = await request(app).delete("/inertial");

        expect(res.status).toBe(200);
        expect(res.body).toEqual({ message: "ok" });
    });

    test("GET /inertial/export/csv - esporta solo il CSV", async () => {
        service.InertialasCSVexport.mockResolvedValue("csv_data");

        const res = await request(app).get("/inertial/export/csv");

        expect(res.status).toBe(200);
        expect(res.text).toBe("csv_data");
        expect(res.headers["content-type"]).toContain("text/csv");
        expect(res.headers["content-disposition"]).toContain("inertial_data.csv");

        expect(service.InertialasCSVexport).toHaveBeenCalled(); // ✅ Solo export
    });

});
