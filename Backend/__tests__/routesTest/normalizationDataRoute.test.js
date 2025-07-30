const request = require("supertest");
const express = require("express");
const router = require("../../src/routes/Analysis_routes/normalizationDataRoutes");
const normalizationController = require("../../src/controller/Analysis_controller/normalizationDataController");

jest.mock("../../src/controller/Analysis_controller/normalizationDataController");

const app = express();
app.use(express.json());
app.use("/api/normalize", router);

describe("Normalization Routes", () => {
    const mockBody = {
        sessionId: "456",
        dataType: "bio"
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("POST /api/normalize/minmax chiama minmaxNormalization", async () => {
        normalizationController.minmaxNormalization.mockImplementation((req, res) => res.status(200).json({ route: "minmax" }));

        const res = await request(app).post("/api/normalize/minmax").send(mockBody);

        expect(res.status).toBe(200);
        expect(res.body).toEqual({ route: "minmax" });
        expect(normalizationController.minmaxNormalization).toHaveBeenCalled();
    });

    test("POST /api/normalize/standard chiama standardNormalization", async () => {
        normalizationController.standardNormalization.mockImplementation((req, res) => res.status(200).json({ route: "standard" }));

        const res = await request(app).post("/api/normalize/standard").send(mockBody);

        expect(res.status).toBe(200);
        expect(res.body).toEqual({ route: "standard" });
        expect(normalizationController.standardNormalization).toHaveBeenCalled();
    });
});
