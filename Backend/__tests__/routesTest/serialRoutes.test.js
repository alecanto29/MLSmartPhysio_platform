const request = require("supertest");
const express = require("express");
const router = require("../../src/routes/serialRoutes");
const controller = require("../../src/controller/serialController");

jest.mock("../../src/controller/serialController");

const app = express();
app.use(express.json());
app.use("/serial", router);

describe("serialRoutes", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("POST /serial/start chiama startScanning", async () => {
        controller.startScanning.mockImplementation((req, res) => {
            res.status(200).json({ message: "Start OK" });
        });

        const res = await request(app).post("/serial/start");

        expect(res.status).toBe(200);
        expect(res.body).toEqual({ message: "Start OK" });
        expect(controller.startScanning).toHaveBeenCalled();
    });

    test("POST /serial/stop chiama stopScanning", async () => {
        controller.stopScanning.mockImplementation((req, res) => {
            res.status(200).json({ message: "Stop OK" });
        });

        const res = await request(app).post("/serial/stop");

        expect(res.status).toBe(200);
        expect(res.body).toEqual({ message: "Stop OK" });
        expect(controller.stopScanning).toHaveBeenCalled();
    });

    test("POST /serial/send chiama sendMessage", async () => {
        controller.sendMessage.mockImplementation((req, res) => {
            res.status(200).json({ message: "Comando ricevuto" });
        });

        const res = await request(app)
            .post("/serial/send")
            .send({ data: ["Start\\r"] });

        expect(res.status).toBe(200);
        expect(res.body).toEqual({ message: "Comando ricevuto" });
        expect(controller.sendMessage).toHaveBeenCalled();
    });

    test("GET /serial/status chiama getStatus", async () => {
        controller.getStatus.mockImplementation((req, res) => {
            res.status(200).json({ connected: true });
        });

        const res = await request(app).get("/serial/status");

        expect(res.status).toBe(200);
        expect(res.body).toEqual({ connected: true });
        expect(controller.getStatus).toHaveBeenCalled();
    });
});
