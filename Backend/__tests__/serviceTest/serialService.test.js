const service = require("../../src/services/serialService");
const serialConfig = require("../../src/config/serialConfig");
const sEMGService = require("../../src/services/sEMGdataService");
const InertialService = require("../../src/services/inertialDataService");

jest.mock("../../src/config/serialConfig", () => ({
    testComWithRetry: jest.fn(),
    resetFoundPorts: jest.fn(),
    getSerialPorts: jest.fn(),
    stopRetries: jest.fn(),
    resetRetryFlag: jest.fn()
}));

jest.mock("../../src/services/sEMGdataService", () => ({
    savesEMGdata: jest.fn()
}));

jest.mock("../../src/services/inertialDataService", () => ({
    saveInertialData: jest.fn()
}));

describe("serialService (funzioni esistenti)", () => {

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe("getConnectionStatus", () => {
        test("ritorna false di default", () => {
            expect(service.getConnectionStatus()).toBe(false);
        });
    });

    describe("sendSequentially", () => {
        test("invia ogni carattere su entrambe le porte", async () => {
            jest.useFakeTimers(); // attiva fake timers

            const mockWrite1 = jest.fn((char, cb) => cb && cb());
            const mockWrite2 = jest.fn((char, cb) => cb && cb());

            const port1 = { isOpen: true, write: mockWrite1 };
            const port2 = { isOpen: true, write: mockWrite2 };

            service.__mockSerialPorts(port1, port2);

            service.sendSequentially("XYZ", 10);

            jest.advanceTimersByTime(30); // 3 caratteri × 10ms = 30ms
            await Promise.resolve();      // lascia eseguire le callback in coda
            await Promise.resolve();

            expect(mockWrite1).toHaveBeenCalledTimes(3);
            expect(mockWrite2).toHaveBeenCalledTimes(3);

            jest.useRealTimers(); // ripristina i timer veri
        });

        test("non invia se nessuna porta è inizializzata", () => {
            console.error = jest.fn();
            service.__mockSerialPorts(null, null);
            service.sendSequentially("ABC");
            expect(console.error).toHaveBeenCalledWith("Nessuna porta seriale inizializzata per l'invio.");
        });
    });

    describe("delay", () => {
        test("attende almeno il tempo specificato", async () => {
            const start = Date.now();
            await service.delay(150); // valore più sicuro
            const elapsed = Date.now() - start;
            expect(elapsed).toBeGreaterThanOrEqual(140);
        }, 3000); // timeout esplicito aumentato
    });

    describe("startReading", () => {
        test("non legge se nessuna porta è attiva", () => {
            console.warn = jest.fn();
            service.__mockSerialPorts(null, null);
            service.startReading("SESSION1");
            expect(console.warn).toHaveBeenCalledWith("Nessuna porta seriale attiva per iniziare la lettura.");
        });

        test("aggiunge listener alle porte valide", () => {
            const mockPort = {
                removeAllListeners: jest.fn(),
                on: jest.fn()
            };
            service.__mockSerialPorts(mockPort, mockPort);
            service.startReading("SESSION1");
            expect(mockPort.on).toHaveBeenCalledWith("data", expect.any(Function));
        });
    });

    describe("openConnection", () => {
        test("non fa nulla se isConnected è già true", async () => {
            service.__setConnected(true);
            await service.openConnection();
            expect(service.getConnectionStatus()).toBe(true);
        });

        test("completa apertura se entrambe le board sono trovate", async () => {
            serialConfig.testComWithRetry.mockResolvedValue({
                sEMG_MLSmartPhysio: true,
                IMU_MLSmartPhysio: true
            });
            const mockPort = {
                path: "COM3",
                isOpen: true,
                write: jest.fn(),
                removeAllListeners: jest.fn(),
                on: jest.fn()
            };
            serialConfig.getSerialPorts.mockReturnValue({
                sEMG_MLSmartPhysio: mockPort,
                IMU_MLSmartPhysio: mockPort
            });

            service.__setConnected(false);
            await service.openConnection();

            expect(serialConfig.resetRetryFlag).toHaveBeenCalled();
            expect(serialConfig.resetFoundPorts).toHaveBeenCalled();
            expect(serialConfig.testComWithRetry).toHaveBeenCalled();
            expect(service.getConnectionStatus()).toBe(true);
        });

    });

    describe("closeConnection", () => {
        test("chiude le porte se sono aperte", async () => {
            const closeMock = jest.fn((cb) => cb());

            const mockPort = {
                isOpen: true,
                close: closeMock
            };

            service.__mockSerialPorts(mockPort, mockPort);
            service.__setConnected(true);

            const delaySpy = jest.spyOn(service, "delay").mockResolvedValue();

            await service.closeConnection();

            expect(serialConfig.stopRetries).toHaveBeenCalled();
            expect(closeMock).toHaveBeenCalledTimes(2);
            expect(service.getConnectionStatus()).toBe(false);

            delaySpy.mockRestore();
        }, 5000); // timeout aumentato

        test("non fa nulla se non connesso", async () => {
            console.log = jest.fn();
            service.__setConnected(false);
            await service.closeConnection();
            expect(console.log).toHaveBeenCalledWith("Nessuna connessione attiva da chiudere.");
        });
    });

    describe("__test_parseIntegerSequence", () => {
        test("restituisce array di 8 interi", () => {
            const result = service.__test_parseIntegerSequence("1 2 3 4 5 6 7 8", 8);
            expect(result).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
        });
    });

    describe("__test_parseFloatSequence", () => {
        test("restituisce array di 9 float", () => {
            const result = service.__test_parseFloatSequence("1.1,2.2,3.3,4.4,5.5,6.6,7.7,8.8,9.9", 9);
            expect(result).toEqual([1.1, 2.2, 3.3, 4.4, 5.5, 6.6, 7.7, 8.8, 9.9]);
        });
    });

});
