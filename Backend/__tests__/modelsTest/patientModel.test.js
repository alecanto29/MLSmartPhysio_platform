const mongoose = require("mongoose");
const Patients = require("../../src/models/Patient"); // aggiorna il path se necessario

describe("Patients Model", () => {
    beforeAll(async () => {
        await mongoose.connect("mongodb://localhost:27017/testdb", {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
    });

    afterEach(async () => {
        await Patients.deleteMany({});
    });

    afterAll(async () => {
        await mongoose.connection.db.dropDatabase();
        await mongoose.disconnect();
    });

    test("crea un paziente valido", async () => {
        const patient = new Patients({
            name: "Laura",
            surname: "Verdi",
            birthDate: new Date("1995-06-12"),
            fiscalCode: "VRDLRA95H52F205D",
            healthCardNumber: "123456789012",
            gender: "Female"
        });

        const saved = await patient.save();

        expect(saved._id).toBeDefined();
        expect(saved.name).toBe("Laura");
        expect(saved.gender).toBe("Female");
        expect(saved.isCritical).toBe(false); // default
        expect(saved.medicalHistory).toBe(""); // default
        expect(Array.isArray(saved.appointments)).toBe(true);
        expect(Array.isArray(saved.sessions)).toBe(true);
    });

    test("genera errore se manca un campo obbligatorio", async () => {
        const incomplete = new Patients({
            name: "Gianni"
            // manca surname, birthDate, fiscalCode, healthCardNumber, gender
        });

        let error;
        try {
            await incomplete.validate();
        } catch (err) {
            error = err;
        }

        expect(error.errors.surname).toBeDefined();
        expect(error.errors.birthDate).toBeDefined();
        expect(error.errors.fiscalCode).toBeDefined();
        expect(error.errors.healthCardNumber).toBeDefined();
        expect(error.errors.gender).toBeDefined();
    });

    test("genera errore se il gender non è valido", async () => {
        const patient = new Patients({
            name: "Franco",
            surname: "Blu",
            birthDate: new Date("1990-02-01"),
            fiscalCode: "BLUFRN90B01F205T",
            healthCardNumber: "987654321098",
            gender: "Other"
        });

        let error;
        try {
            await patient.validate();
        } catch (err) {
            error = err;
        }

        expect(error.errors.gender).toBeDefined();
    });
});
