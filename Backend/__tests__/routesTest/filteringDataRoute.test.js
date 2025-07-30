const request = require("supertest");
const express = require("express");
const router = require("../../src/routes/Analysis_routes/filteringDataRoutes");
const filteringController = require("../../src/controller/Analysis_controller/filteringDataController");

jest.mock("../../src/controller/Analysis_controller/filteringDataController");

const app = express();
app.use(express.json());
app.use("/api/filter", router);

describe("Filtering Routes", () => {
    const mockBody = {
        sessionId: "123",
        cutoff: 50,
        order: 2,
        dataType: "bio"
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("POST /api/filter/low chiama lowPassFilter", async () => {
        filteringController.lowPassFilter.mockImplementation((req, res) => res.status(200).json({ route: "low" }));

        const res = await request(app).post("/api/filter/low").send(mockBody);

        expect(res.status).toBe(200);
        expect(res.body).toEqual({ route: "low" });
        expect(filteringController.lowPassFilter).toHaveBeenCalled();
    });

    test("POST /api/filter/high chiama highPassFilter", async () => {
        filteringController.highPassFilter.mockImplementation((req, res) => res.status(200).json({ route: "high" }));

        const res = await request(app).post("/api/filter/high").send(mockBody);

        expect(res.status).toBe(200);
        expect(res.body).toEqual({ route: "high" });
        expect(filteringController.highPassFilter).toHaveBeenCalled();
    });

    test("POST /api/filter/notch chiama notchFilter", async () => {
        filteringController.notchFilter.mockImplementation((req, res) => res.status(200).json({ route: "notch" }));

        const res = await request(app).post("/api/filter/notch").send(mockBody);

        expect(res.status).toBe(200);
        expect(res.body).toEqual({ route: "notch" });
        expect(filteringController.notchFilter).toHaveBeenCalled();
    });
});
