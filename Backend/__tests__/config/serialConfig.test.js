// serialConfig.test.js
jest.mock("serialport");
jest.mock("@serialport/parser-readline");

const { SerialPort } = require("serialport");
const { ReadlineParser } = require("@serialport/parser-readline");
const serialConfig = require("../../src/config/serialConfig");

// Finto SerialPort mock
const mockSerialOpen = jest.fn((cb) => cb(null));
const mockSerialWrite = jest.fn((data, cb) => cb(null));
const mockSerialClose = jest.fn((cb) => cb(null));
const mockOn = jest.fn();
const mockPipe = jest.fn(() => ({
    on: mockOn
}));

SerialPort.mockImplementation(() => ({
    open: mockSerialOpen,
    write: mockSerialWrite,
    close: mockSerialClose,
    on: mockOn,
    isOpen: true,
    path: "/dev/ttyUSB_MOCK",
    pipe: mockPipe
}));

ReadlineParser.mockImplementation(() => ({}));

// Mock per SerialPort.list()
SerialPort.list = jest.fn(() => Promise.resolve([
    { path: "/dev/ttyUSB_MOCK" }
]));

describe("serialConfig", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        serialConfig.resetFoundPorts(); // resetta globalFoundPorts e serialPorts
    });

    test("testCom should return null if no board responds", async () => {
        const result = await serialConfig.testCom();
        expect(result).toBeNull();
    });

    test(
        "testComWithRetry should attempt retries and eventually return null",
        async () => {
            const result = await serialConfig.testComWithRetry(2, 10); // 2 retry, 10ms delay
            expect(result).toBeNull();
        },
        10000 // timeout in ms
    );

    test("resetFoundPorts should clear foundPorts and serialPorts", () => {
        serialConfig.getSerialPorts()["sEMG_MLSmartPhysio"] = "dummy";
        serialConfig.resetFoundPorts();
        expect(serialConfig.getSerialPorts()).toEqual({});
    });
});
