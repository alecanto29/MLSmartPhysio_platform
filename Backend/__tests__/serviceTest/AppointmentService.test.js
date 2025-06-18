const mongoose = require("mongoose");
const Appointments = require("../../src/models/Appointment");
const Patients = require("../../src/models/Patient");
const Doctors = require("../../src/models/Doctor");

const {
    getAllAppointments,
    getAllAppointmentsDate,
    getAllAppointmentsTime,
    takeNewAppointment,
    deleteAppointmentById
} = require("../../src/services/AppointmentsService");

describe("Appointments Service", () => {
    let doctor, patient;

    beforeAll(async () => {
        await mongoose.connect("mongodb://localhost:27017/testdb", {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
    });

    beforeEach(async () => {
        await Appointments.deleteMany({});
        await Doctors.deleteMany({});
        await Patients.deleteMany({});

        doctor = new Doctors({
            name: "Mario",
            surname: "Rossi",
            birthDate: new Date("1970-01-01"),
            fiscalCode: "RSSMRA70A01F205X",
            email: "doc@example.com",
            passwordHash: "hash123",
            licenseNumber: "LIC123456",
            specialization: "Cardiology"
        });
        await doctor.save();

        patient = new Patients({
            name: "Luigi",
            surname: "Verdi",
            birthDate: new Date("1980-01-01"),
            fiscalCode: "VRDLGU80A01F205X",
            email: "patient@example.com",
            healthCardNumber: "HCN123456",
            gender: "Male"
        });
        await patient.save();
    });

    afterAll(async () => {
        await mongoose.connection.dropDatabase();
        await mongoose.disconnect();
    });

    test("takeNewAppointment - crea nuovo appuntamento", async () => {
        const appointmentData = {
            date: "2099-12-31",
            time: "14:00",
            notes: "Visita di controllo",
            specificPatient: patient._id
        };

        const result = await takeNewAppointment(appointmentData, doctor._id);
        expect(result).toBeDefined();
        expect(result.notes).toBe("Visita di controllo");
    });

    test("getAllAppointments - restituisce gli appuntamenti del medico", async () => {
        await takeNewAppointment({
            date: "2099-12-31",
            time: "15:00",
            notes: "Controllo pressione",
            specificPatient: patient._id
        }, doctor._id);

        const results = await getAllAppointments(doctor._id);
        expect(results.length).toBe(1);
        expect(results[0].notes).toBe("Controllo pressione");
    });

    test("getAllAppointmentsDate - restituisce le date", async () => {
        await takeNewAppointment({
            date: "2099-12-31",
            time: "15:00",
            notes: "Controllo pressione",
            specificPatient: patient._id
        }, doctor._id);

        const dates = await getAllAppointmentsDate(doctor._id);
        expect(dates.length).toBe(1);
        expect(dates[0].toISOString().split("T")[0]).toBe("2099-12-31");
    });

    test("getAllAppointmentsTime - restituisce gli orari", async () => {
        await takeNewAppointment({
            date: "2099-12-31",
            time: "16:00",
            notes: "Controllo peso",
            specificPatient: patient._id
        }, doctor._id);

        const times = await getAllAppointmentsTime(doctor._id);
        expect(times.length).toBe(1);
        expect(times[0]).toBe("16:00");
    });

    test("deleteAppointmentById - elimina l'appuntamento", async () => {
        await Appointments.deleteMany({});

        const newApp = await takeNewAppointment({
            date: "2099-12-31",
            time: "15:00",
            notes: "Controllo",
            specificPatient: patient._id
        }, doctor._id);

        const result = await deleteAppointmentById(doctor._id, newApp._id);

        expect(result.success).toBe(true);

        const remaining = await Appointments.find({});
        expect(remaining.length).toBe(0); // Assicurati che sia l'unico creato nel test
    });
});
