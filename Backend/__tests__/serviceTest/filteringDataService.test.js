const { spawn } = require("child_process");
const filteringService = require("../../src/services/Analysis_services/filteringDataServices");

jest.mock("child_process");

describe("FilteringDataServices", () => {
    const fakeCSV = "/fake/path.csv";
    const fakeCutoff = "50";
    const fakeOrder = "2";
    const fakeOutput = JSON.stringify({ filtered: true });

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

    test("lowPassFilter risolve con output corretto", async () => {
        const promise = filteringService.lowPassFilter(fakeCSV, fakeCutoff, fakeOrder);
        simulatePythonSuccess();

        await expect(promise).resolves.toEqual({ filtered: true });
        expect(spawn).toHaveBeenCalledWith(
            expect.stringMatching(/python/),
            expect.arrayContaining(["low", fakeCutoff, fakeOrder])
        );
    });

    test("highPassFilter risolve con output corretto", async () => {
        const promise = filteringService.highPassFilter(fakeCSV, fakeCutoff, fakeOrder);
        simulatePythonSuccess();

        await expect(promise).resolves.toEqual({ filtered: true });
    });

    test("notchFilter risolve con output corretto", async () => {
        const promise = filteringService.notchFilter(fakeCSV, fakeCutoff, fakeOrder);
        simulatePythonSuccess();

        await expect(promise).resolves.toEqual({ filtered: true });
    });

    test("gestisce errore Python (exit code !== 0)", async () => {
        const promise = filteringService.lowPassFilter(fakeCSV, fakeCutoff, fakeOrder);
        simulatePythonFailure("Errore di filtro");

        await expect(promise).rejects.toThrow("Errore Python: Errore di filtro");
    });

    test("gestisce output non JSON", async () => {
        const badOutput = "non-json-output";
        const promise = filteringService.lowPassFilter(fakeCSV, fakeCutoff, fakeOrder);

        // Aspetta che stdout.on venga registrato
        await new Promise(process.nextTick); // forza la risoluzione del microtask

        const stdoutHandler = stdoutMock.on.mock.calls.find(([event]) => event === "data")?.[1];

        // Se non trovato, fallisci il test con messaggio esplicito
        if (!stdoutHandler) {
            throw new Error("stdout 'data' handler non registrato");
        }

        stdoutHandler(Buffer.from(badOutput));
        closeCallback(0);

        await expect(promise).rejects.toThrow(/Output non valido/);
    });
});
