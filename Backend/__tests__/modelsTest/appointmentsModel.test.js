const mongoose = require("mongoose");
const Appointments = require("../../src/models/Appointment");

describe("Appointments Model", () => {

    beforeAll(async () => {
        await mongoose.connect("mongodb://localhost:27017/testdb", {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
    });

    afterAll(async () => {
        await mongoose.connection.db.dropDatabase(); // pulizia
        await mongoose.disconnect();
    });

    test("crea un appuntamento valido", async () => {
        const validAppointment = new Appointments({
            date: new Date("2025-06-20"),
            time: "15:30",
            doctor: new mongoose.Types.ObjectId(),
            patient: new mongoose.Types.ObjectId(),
            notes: "Visita annuale"
        });

        const saved = await validAppointment.save();

        expect(saved._id).toBeDefined();
        expect(saved.date.toISOString()).toBe("2025-06-20T00:00:00.000Z");
        expect(saved.time).toBe("15:30");
        expect(saved.notes).toBe("Visita annuale");
        expect(saved.createdAt).toBeDefined();
        expect(saved.updatedAt).toBeDefined();
    });

    test("usa note vuote di default se non fornite", async () => {
        const appointment = new Appointments({
            date: new Date(),
            time: "10:00",
            doctor: new mongoose.Types.ObjectId(),
            patient: new mongoose.Types.ObjectId()
        });

        const saved = await appointment.save();

        expect(saved.notes).toBe("");
    });

    test("fallisce se manca il campo obbligatorio 'date'", async () => {
        const invalid = new Appointments({
            time: "12:00",
            doctor: new mongoose.Types.ObjectId(),
            patient: new mongoose.Types.ObjectId()
        });

        let err;
        try {
            await invalid.validate();
        } catch (e) {
            err = e;
        }

        expect(err.errors.date).toBeDefined();
    });

    test("fallisce se manca il campo obbligatorio 'time'", async () => {
        const invalid = new Appointments({
            date: new Date(),
            doctor: new mongoose.Types.ObjectId(),
            patient: new mongoose.Types.ObjectId()
        });

        let err;
        try {
            await invalid.validate();
        } catch (e) {
            err = e;
        }

        expect(err.errors.time).toBeDefined();
    });

    test("fallisce se manca 'doctor' o 'patient'", async () => {
        const missingDoctor = new Appointments({
            date: new Date(),
            time: "09:00",
            patient: new mongoose.Types.ObjectId()
        });

        const missingPatient = new Appointments({
            date: new Date(),
            time: "09:00",
            doctor: new mongoose.Types.ObjectId()
        });

        let err1, err2;

        try {
            await missingDoctor.validate();
        } catch (e) {
            err1 = e;
        }

        try {
            await missingPatient.validate();
        } catch (e) {
            err2 = e;
        }

        expect(err1.errors.doctor).toBeDefined();
        expect(err2.errors.patient).toBeDefined();
    });
});
