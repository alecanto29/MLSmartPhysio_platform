const request = require("supertest");
const express = require("express");
const router = require("../../src/routes/sEMGdataRoutes");
const controller = require("../../src/controller/sEMGdataController");

jest.mock("../../src/controller/sEMGdataController");

const app = express();
app.use(express.json());
app.use("/semg", router);

describe("sEMGdataRoutes", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("GET /semg chiama controller.getData", async () => {
        controller.getData.mockImplementation((req, res) => res.status(200).json([{ data: [1, 2, 3, 4, 5, 6, 7, 8] }]));

        const res = await request(app).get("/semg");

        expect(res.status).toBe(200);
        expect(res.body.length).toBe(1);
        expect(controller.getData).toHaveBeenCalled();
    });

    test("GET /semg/channel/0 chiama controller.getDataByChannel", async () => {
        controller.getDataByChannel.mockImplementation((req, res) => res.status(200).json([100, 101]));

        const res = await request(app).get("/semg/channel/0");

        expect(res.status).toBe(200);
        expect(res.body).toEqual([100, 101]);
        expect(controller.getDataByChannel).toHaveBeenCalled();
    });

    test("DELETE /semg cancella tutti i dati", async () => {
        controller.deleteAllsEMGdata.mockImplementation((req, res) => res.status(200).json({ message: "ok" }));

        const res = await request(app).delete("/semg");

        expect(res.status).toBe(200);
        expect(res.body).toEqual({ message: "ok" });
        expect(controller.deleteAllsEMGdata).toHaveBeenCalled();
    });

    test("GET /semg/export/csv/:sessionID esporta CSV", async () => {
        const fakeSessionId = "1234567890abcdef12345678";

        controller.sEMGexportAsCSV.mockImplementation((req, res) => {
            res.set({
                "Content-Type": "text/csv",
                "Content-Disposition": "attachment; filename=semg_data.csv"
            });
            res.status(200).send("CSV_DATA");
        });

        const res = await request(app).get(`/semg/export/csv/${fakeSessionId}`);

        expect(res.status).toBe(200);
        expect(res.text).toBe("CSV_DATA");
        expect(res.headers["content-type"]).toContain("text/csv");
        expect(res.headers["content-disposition"]).toContain("semg_data.csv");
        expect(controller.sEMGexportAsCSV).toHaveBeenCalled();
    });
});
