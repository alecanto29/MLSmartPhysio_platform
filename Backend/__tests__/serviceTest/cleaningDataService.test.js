const { spawn } = require("child_process");
const path = require("path");
const cleaningService = require("../../src/services/Analysis_services/cleaningDataServices");

jest.mock("child_process");

describe("CleaningDataServices", () => {
    const fakeCSV = "/path/to/fake.csv";
    const fakeDataType = "bio";
    const fakeOutput = JSON.stringify({ cleaned: true });

    let stdoutMock, stderrMock, closeCallback;

    beforeEach(() => {
        stdoutMock = { on: jest.fn() };
        stderrMock = { on: jest.fn() };
        closeCallback = null;

        spawn.mockReturnValue({
            stdout: stdoutMock,
            stderr: stderrMock,
            on: (event, callback) => {
                if (event === "close") closeCallback = callback;
            }
        });
    });

    function simulatePythonSuccess() {
        const stdoutHandler = stdoutMock.on.mock.calls.find(call => call[0] === "data")[1];
        stdoutHandler(Buffer.from(fakeOutput));
        closeCallback(0); // Exit code 0 = success
    }

    function simulatePythonFailure(stderrMsg) {
        const stderrHandler = stderrMock.on.mock.calls.find(call => call[0] === "data")[1];
        stderrHandler(Buffer.from(stderrMsg));
        closeCallback(1); // Exit code 1 = failure
    }

    test("cleanWithMean risolve con output corretto", async () => {
        const promise = cleaningService.cleanWithMean(fakeCSV, true, false, false, fakeDataType);
        simulatePythonSuccess();

        await expect(promise).resolves.toEqual({ cleaned: true });
        expect(spawn).toHaveBeenCalledWith(
            expect.stringMatching(/python/),
            expect.arrayContaining(["mean", "true", "false", "false", fakeDataType])
        );
    });

    test("cleanWithMedian risolve con output corretto", async () => {
        const promise = cleaningService.cleanWithMedian(fakeCSV, false, true, false, fakeDataType);
        simulatePythonSuccess();

        await expect(promise).resolves.toEqual({ cleaned: true });
        expect(spawn).toHaveBeenCalledWith(
            expect.any(String),
            expect.arrayContaining(["median"])
        );
    });

    test("cleanWithForwardFill gestisce correttamente output Python", async () => {
        const promise = cleaningService.cleanWithForwardFill(fakeCSV, false, false, true, fakeDataType);
        simulatePythonSuccess();

        await expect(promise).resolves.toEqual({ cleaned: true });
    });

    test("cleanWithBackwardFill gestisce correttamente output Python", async () => {
        const promise = cleaningService.cleanWithBackwardFill(fakeCSV, true, true, true, fakeDataType);
        simulatePythonSuccess();

        await expect(promise).resolves.toEqual({ cleaned: true });
    });

    test("lancia errore se lo script Python fallisce", async () => {
        const promise = cleaningService.cleanWithMean(fakeCSV, true, false, false, fakeDataType);
        simulatePythonFailure("Errore Python");

        await expect(promise).rejects.toThrow("Errore Python");
    });

    test("lancia errore se l'output non è JSON", async () => {
        const badOutput = "not a json";

        const promise = cleaningService.cleanWithMean(fakeCSV, true, false, false, fakeDataType);

        // Aspetta il microtask per assicurarti che stdout.on sia registrato
        await new Promise(process.nextTick);

        const stdoutHandler = stdoutMock.on.mock.calls.find(([event]) => event === "data")?.[1];
        if (!stdoutHandler) throw new Error("stdout handler non registrato");

        stdoutHandler(Buffer.from(badOutput));
        closeCallback(0); // Exit con successo

        await expect(promise).rejects.toThrow(/Output non valido/);
    });
});
