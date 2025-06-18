const request = require("supertest");
const express = require("express");
const router = require("../../src/routes/inertialDataRoutes");
const service = require("../../src/services/inertialDataService");

jest.mock("../../src/services/inertialDataService");

const app = express();
app.use(express.json());
app.use("/inertial", router); // monta le rotte

describe("inertialDataRoutes", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("GET /inertial restituisce i dati", async () => {
        const mockData = [{ data: [1, 2, 3, 4, 5, 6, 7, 8, 9] }];
        service.getAllInertialData.mockResolvedValue(mockData);

        const res = await request(app).get("/inertial");

        expect(res.status).toBe(200);
        expect(res.body).toEqual(mockData);
    });

    test("GET /inertial/0 restituisce dati per canale", async () => {
        service.getDataByChannel.mockResolvedValue([100, 101]);

        const res = await request(app).get("/inertial/0");

        expect(res.status).toBe(200);
        expect(res.body).toEqual([100, 101]);
    });

    test("DELETE /inertial cancella tutti i dati", async () => {
        service.deleteAllInertialData.mockResolvedValue({ message: "ok" });

        const res = await request(app).delete("/inertial");

        expect(res.status).toBe(200);
        expect(res.body).toEqual({ message: "ok" });
    });

    test("GET /inertial/export/csv/:sessionID esporta CSV", async () => {
        const fakeSessionId = "1234567890abcdef12345678";

        service.InertialasCSVexport.mockResolvedValue("CSV_DATA");
        service.deleteAllInertialDataBySession.mockResolvedValue();

        const res = await request(app).get(`/inertial/export/csv/${fakeSessionId}`);

        expect(res.status).toBe(200);
        expect(res.text).toBe("CSV_DATA");
        expect(res.headers["content-type"]).toContain("text/csv");
        expect(res.headers["content-disposition"]).toContain("inertial_data.csv");
    });
});
