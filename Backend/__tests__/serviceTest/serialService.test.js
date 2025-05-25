const service = require("../../src/services/serialService");

describe("serialService (funzioni semplici)", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("getConnectionStatus restituisce true/false correttamente", () => {
        service.__setConnected(true);
        expect(service.getConnectionStatus()).toBe(true);

        service.__setConnected(false);
        expect(service.getConnectionStatus()).toBe(false);
    });

    test("sendSequentially ignora se nessuna porta è attiva", () => {
        console.error = jest.fn();
        service.__mockSerialPorts(null, null);

        service.sendSequentially("ABC");
        expect(console.error).toHaveBeenCalledWith("Nessuna porta seriale inizializzata per l'invio.");
    });

    test("parseIntegerSequence estrae numeri interi validi", () => {
        const result = service.__test_parseIntegerSequence("1 2 3 x 4 5", 5);
        expect(result).toEqual([1, 2, 3, 4, 5]);
    });

    test("parseFloatSequence estrae float anche da sequenze incollate", () => {
        const result = service.__test_parseFloatSequence("85.085.0 -1.5 abc 3.33", 4);
        expect(result).toEqual([85.08, 5, -1.5, 3.3]);
    });
});
