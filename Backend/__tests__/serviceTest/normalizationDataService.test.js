const { spawn } = require("child_process");
const normalizationService = require("../../src/services/Analysis_services/normalizationDataServices");

jest.mock("child_process");

describe("NormalizationDataServices", () => {
    const fakeCSV = "/fake/path.csv";
    const fakeOutput = JSON.stringify({ normalized: true });

    let stdoutMock, stderrMock, closeCallback;

    beforeEach(() => {
        stdoutMock = { on: jest.fn() };
        stderrMock = { on: jest.fn() };
        closeCallback = null;

        spawn.mockReturnValue({
            stdout: stdoutMock,
            stderr: stderrMock,
            on: (event, cb) => {
                if (event === "close") closeCallback = cb;
            }
        });

        jest.clearAllMocks();
    });

    function simulatePythonSuccess() {
        const stdoutHandler = stdoutMock.on.mock.calls.find(([event]) => event === "data")[1];
        stdoutHandler(Buffer.from(fakeOutput));
        closeCallback(0);
    }

    function simulatePythonFailure(errMsg) {
        const stderrHandler = stderrMock.on.mock.calls.find(([event]) => event === "data")[1];
        stderrHandler(Buffer.from(errMsg));
        closeCallback(1);
    }

    test("minmaxNormalization restituisce il risultato corretto", async () => {
        const promise = normalizationService.minmaxNormalization(fakeCSV);
        simulatePythonSuccess();

        await expect(promise).resolves.toEqual({ normalized: true });
        expect(spawn).toHaveBeenCalledWith(
            expect.stringMatching(/python/),
            expect.arrayContaining(["minmax"])
        );
    });

    test("standardNormalization restituisce il risultato corretto", async () => {
        const promise = normalizationService.standardNormalization(fakeCSV);
        simulatePythonSuccess();

        await expect(promise).resolves.toEqual({ normalized: true });
        expect(spawn).toHaveBeenCalledWith(
            expect.any(String),
            expect.arrayContaining(["standard"])
        );
    });

    test("gestisce errore Python (exit code !== 0)", async () => {
        const promise = normalizationService.minmaxNormalization(fakeCSV);
        simulatePythonFailure("Errore normalizzazione");

        await expect(promise).rejects.toThrow("Errore Python: Errore normalizzazione");
    });

    test("gestisce output non JSON", async () => {
        const badOutput = "not-json";

        const promise = normalizationService.standardNormalization(fakeCSV);

        await new Promise(process.nextTick);

        const stdoutHandler = stdoutMock.on.mock.calls.find(([event]) => event === "data")?.[1];
        if (!stdoutHandler) throw new Error("stdout handler non registrato");

        stdoutHandler(Buffer.from(badOutput));
        closeCallback(0);

        await expect(promise).rejects.toThrow(/Output non valido/);
    });

});
