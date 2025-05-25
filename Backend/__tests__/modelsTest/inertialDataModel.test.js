const mongoose = require("mongoose");
const InertialModel = require("../../src/models/inertialDataModel");

describe("inertialDataModel", () => {
    test("accetta array validi di 9 numeri", async () => {
        const doc = new InertialModel({ data: [1,2,3,4,5,6,7,8,9] });
        const err = doc.validateSync();
        expect(err).toBeUndefined();
    });

    test("rifiuta array con meno di 9 numeri", async () => {
        const doc = new InertialModel({ data: [1,2,3] });
        const err = doc.validateSync();
        expect(err.errors["data"]).toBeDefined();
    });

    test("rifiuta array con stringhe", async () => {
        const doc = new InertialModel({ data: [1,2,"x",4,5,6,7,8,9] });
        const err = doc.validateSync();
        expect(err.errors["data"]).toBeDefined();
    });
});
