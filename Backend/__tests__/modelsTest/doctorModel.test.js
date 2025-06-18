const mongoose = require("mongoose");
const Doctors = require("../../src/models/Doctor");

describe("Doctors Model", () => {
    beforeAll(async () => {
        await mongoose.connect("mongodb://localhost:27017/testdb", {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
    });

    afterEach(async () => {
        await Doctors.deleteMany({});
    });

    afterAll(async () => {
        await mongoose.connection.db.dropDatabase();
        await mongoose.disconnect();
    });

    test("salva un dottore valido", async () => {
        const doctor = new Doctors({
            name: "Mario",
            surname: "Rossi",
            birthDate: new Date("1980-01-01"),
            fiscalCode: "RSSMRA80A01F205X",
            email: "mario.rossi@example.com",
            passwordHash: "hashed_password",
            licenseNumber: "LIC123456",
            specialization: "Cardiology",
            patientsInCare: [],
            appointments: []
        });

        const saved = await doctor.save();

        expect(saved._id).toBeDefined();
        expect(saved.name).toBe("Mario");
        expect(saved.specialization).toBe("Cardiology");
        expect(Array.isArray(saved.patientsInCare)).toBe(true);
        expect(Array.isArray(saved.appointments)).toBe(true);
    });

    test("genera errore se manca un campo richiesto", async () => {
        const incompleteDoctor = new Doctors({
            name: "Luigi"
            // manca surname, fiscalCode, email, passwordHash, licenseNumber
        });

        let error;
        try {
            await incompleteDoctor.validate();
        } catch (err) {
            error = err;
        }

        expect(error.errors.surname).toBeDefined();
        expect(error.errors.fiscalCode).toBeDefined();
        expect(error.errors.email).toBeDefined();
        expect(error.errors.passwordHash).toBeDefined();
        expect(error.errors.licenseNumber).toBeDefined();
    });

    test("non permette duplicati su email, fiscalCode, licenseNumber", async () => {
        const baseData = {
            name: "Anna",
            surname: "Bianchi",
            birthDate: new Date("1985-05-15"),
            fiscalCode: "BNCHNA85E55F205X",
            email: "anna.bianchi@example.com",
            passwordHash: "hash",
            licenseNumber: "LIC999999"
        };

        await new Doctors(baseData).save();

        const duplicate = new Doctors(baseData);

        await expect(duplicate.save()).rejects.toThrow(/duplicate key error/);
    });
});
