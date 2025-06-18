const controller = require("../../src/controller/serialController");
const service = require("../../src/services/serialService");

jest.mock("../../src/services/serialService");

describe("serialController", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("startScanning chiama openConnection", async () => {
        service.openConnection.mockResolvedValue();
        await controller.startScanning();
        expect(service.openConnection).toHaveBeenCalled();
    });

    test("stopScanning chiama closeConnection", async () => {
        service.closeConnection.mockResolvedValue();
        await controller.stopScanning();
        expect(service.closeConnection).toHaveBeenCalled();
    });

    test("getStatus restituisce stato corretto", () => {
        const req = {};
        const res = { json: jest.fn() };
        service.getConnectionStatus.mockReturnValue(true);

        controller.getStatus(req, res);

        expect(service.getConnectionStatus).toHaveBeenCalled();
        expect(res.json).toHaveBeenCalledWith({ connected: true });
    });

    test("sendMessage con comando normale", async () => {
        const req = {
            body: {
                data: ["Stop\\r"],
                sessionId: "fakeSessionId"
            }
        };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        service.sendSequentially.mockResolvedValue();

        await controller.sendMessage(req, res);

        expect(service.sendSequentially).toHaveBeenCalledWith("Stop\r");
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ message: "Comando inviato con successo" });
    });

    test("sendMessage con comando Start chiama startReading", async () => {
        const req = {
            body: {
                data: ["Start\\r"],
                sessionId: "fakeSessionId"
            }
        };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        service.sendSequentially.mockResolvedValue();

        await controller.sendMessage(req, res);

        expect(service.sendSequentially).toHaveBeenCalledWith("Start\r");
        expect(service.startReading).toHaveBeenCalledWith("fakeSessionId");
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ message: "Comando inviato con successo" });
    });

    test("sendMessage gestisce errori", async () => {
        const req = {
            body: {
                data: ["Start\\r"],
                sessionId: "fakeSessionId"
            }
        };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        service.sendSequentially.mockRejectedValue(new Error("Errore test"));

        await controller.sendMessage(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: "Errore nell'invio dei dati." });
    });
});
