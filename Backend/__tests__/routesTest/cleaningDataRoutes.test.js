const request = require("supertest");
const express = require("express");
const router = require("../../src/routes/Analysis_routes/cleaningDataRoutes");
const cleaningController = require("../../src/controller/Analysis_controller/cleaningDataController");

jest.mock("../../src/controller/Analysis_controller/cleaningDataController");

const app = express();
app.use(express.json());
app.use("/api/clean", router);

describe("Cleaning Routes", () => {
    const fakeBody = {
        sessionId: "123",
        isNaN: true,
        isOutliers: false,
        outliers_adv: false,
        dataType: "bio"
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("POST /api/clean/mean chiama cleanWithMean", async () => {
        cleaningController.cleanWithMean.mockImplementation((req, res) => res.status(200).json({ route: "mean" }));

        const res = await request(app).post("/api/clean/mean").send(fakeBody);

        expect(res.status).toBe(200);
        expect(res.body).toEqual({ route: "mean" });
        expect(cleaningController.cleanWithMean).toHaveBeenCalled();
    });

    test("POST /api/clean/median chiama cleanWithMedian", async () => {
        cleaningController.cleanWithMedian.mockImplementation((req, res) => res.status(200).json({ route: "median" }));

        const res = await request(app).post("/api/clean/median").send(fakeBody);

        expect(res.status).toBe(200);
        expect(res.body).toEqual({ route: "median" });
        expect(cleaningController.cleanWithMedian).toHaveBeenCalled();
    });

    test("POST /api/clean/ffill chiama cleanWithForwardFill", async () => {
        cleaningController.cleanWithForwardFill.mockImplementation((req, res) => res.status(200).json({ route: "ffill" }));

        const res = await request(app).post("/api/clean/ffill").send(fakeBody);

        expect(res.status).toBe(200);
        expect(res.body).toEqual({ route: "ffill" });
        expect(cleaningController.cleanWithForwardFill).toHaveBeenCalled();
    });

    test("POST /api/clean/bfill chiama cleanWithBackwardFill", async () => {
        cleaningController.cleanWithBackwardFill.mockImplementation((req, res) => res.status(200).json({ route: "bfill" }));

        const res = await request(app).post("/api/clean/bfill").send(fakeBody);

        expect(res.status).toBe(200);
        expect(res.body).toEqual({ route: "bfill" });
        expect(cleaningController.cleanWithBackwardFill).toHaveBeenCalled();
    });
});
