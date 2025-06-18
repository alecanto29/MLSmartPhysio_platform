const mongoose = require("mongoose");
const sEMGModel = require("../../src/models/sEMGdataModel");

describe("sEMGdataModel", () => {
    const fakeSessionId = new mongoose.Types.ObjectId();

    test("accetta array di 8 numeri", () => {
        const doc = new sEMGModel({ sessionId: fakeSessionId, data: [1, 2, 3, 4, 5, 6, 7, 8] });
        const err = doc.validateSync();
        expect(err).toBeUndefined();
    });

    test("rifiuta array con meno di 8 numeri", () => {
        const doc = new sEMGModel({ sessionId: fakeSessionId, data: [1, 2, 3] });
        const err = doc.validateSync();
        expect(err.errors["data"]).toBeDefined();
        expect(err.errors["data"].message).toMatch(/8 valori numerici/);
    });

    test("rifiuta array con valori non numerici", () => {
        const doc = new sEMGModel({ sessionId: fakeSessionId, data: [1, 2, "x", 4, 5, 6, 7, 8] });
        const err = doc.validateSync();
        expect(err.errors["data"]).toBeDefined();
        expect(err.errors["data"].message).toMatch(/8 valori numerici/);
    });
});
