const mongoose = require("mongoose");
const Sessions = require("../../src/models/Session");
const Doctors = require("../../src/models/Doctor");
const Patients = require("../../src/models/Patient");

describe("Sessions Model", () => {
    let doctorId;
    let patientId;

    beforeAll(async () => {
        await mongoose.connect("mongodb://localhost:27017/testdb_sessions", {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        // Crea un dottore e un paziente di test
        const doctor = new Doctors({
            name: "Marco",
            surname: "Bianchi",
            birthDate: new Date("1980-01-01"),
            fiscalCode: "BNCMRC80A01F205X",
            email: "marco.bianchi@example.com",
            passwordHash: "hash123",
            licenseNumber: "DOC123456"
        });
        doctorId = (await doctor.save())._id;

        const patient = new Patients({
            name: "Luca",
            surname: "Rossi",
            birthDate: new Date("2000-05-20"),
            fiscalCode: "RSSLCU00E20F205X",
            email: "luca.rossi@example.com",
            passwordHash: "hash456",
            gender: "Male", // richiesto
            healthCardNumber: "123456789012" // richiesto
        });
        patientId = (await patient.save())._id;
    });

    afterEach(async () => {
        await Sessions.deleteMany({});
    });

    afterAll(async () => {
        await Doctors.deleteMany({});
        await Patients.deleteMany({});
        await mongoose.connection.db.dropDatabase();
        await mongoose.disconnect();
    });

    test("salva una sessione valida", async () => {
        const session = new Sessions({
            date: new Date("2025-06-18"),
            time: "14:30",
            notes: "Controllo periodico",
            patient: patientId,
            doctor: doctorId
        });

        const saved = await session.save();

        expect(saved._id).toBeDefined();
        expect(saved.notes).toBe("Controllo periodico");
        expect(saved.patient.toString()).toBe(patientId.toString());
        expect(saved.doctor.toString()).toBe(doctorId.toString());
        expect(saved.createdAt).toBeInstanceOf(Date);
        expect(saved.updatedAt).toBeInstanceOf(Date);
    });

    test("genera errore se manca il campo 'date'", async () => {
        const invalidSession = new Sessions({
            time: "10:00",
            patient: patientId,
            doctor: doctorId
        });

        let error;
        try {
            await invalidSession.validate();
        } catch (err) {
            error = err;
        }

        expect(error.errors.date).toBeDefined();
    });

    test("genera errore se manca il campo 'patient'", async () => {
        const invalidSession = new Sessions({
            date: new Date(),
            time: "09:00",
            doctor: doctorId
        });

        let error;
        try {
            await invalidSession.validate();
        } catch (err) {
            error = err;
        }

        expect(error.errors.patient).toBeDefined();
    });

    test("genera errore se manca il campo 'doctor'", async () => {
        const invalidSession = new Sessions({
            date: new Date(),
            time: "11:00",
            patient: patientId
        });

        let error;
        try {
            await invalidSession.validate();
        } catch (err) {
            error = err;
        }

        expect(error.errors.doctor).toBeDefined();
    });

    test("notes viene impostato a stringa vuota se non fornito", async () => {
        const session = new Sessions({
            date: new Date(),
            time: "15:00",
            patient: patientId,
            doctor: doctorId
        });

        const saved = await session.save();
        expect(saved.notes).toBe("");
    });
});
