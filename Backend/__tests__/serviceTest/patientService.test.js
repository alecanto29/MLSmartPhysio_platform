const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const patientService = require("../../src/services/PatientService");
const patientModel = require("../../src/models/Patient");
const doctorModel = require("../../src/models/Doctor");
const appointmentModel = require("../../src/models/Appointment");

let mongoServer;
let doctor;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    await doctorModel.syncIndexes();
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

beforeEach(async () => {
    await patientModel.deleteMany();
    await doctorModel.deleteMany();
    await appointmentModel.deleteMany();

    doctor = await doctorModel.create({
        name: "Dott",
        surname: "House",
        email: "house@example.com",
        fiscalCode: "HSCDRT90A01F205Y",
        passwordHash: "testhash",
        specialization: "Diagnostica",
        licenseNumber: "MED123456",
        birthDate: new Date("1970-01-01")
    });
});

describe("PatientService", () => {
    const basePatient = {
        name: "Mario",
        surname: "Rossi",
        fiscalCode: "RSSMRA80A01F205X",
        healthCardNumber: "1234567890123456",
        gender: "Male",
        birthDate: "1980-01-01",
        medicalHistory: "Ipertensione"
    };

    test("createNewPatient - crea un paziente associato al medico", async () => {
        const created = await patientService.createNewPatient(basePatient, doctor._id);
        expect(created.name).toBe("Mario");

        const found = await patientModel.findById(created._id);
        expect(found.primaryDoctor.toString()).toBe(doctor._id.toString());
    });

    test("createNewPatient - lancia errore se manca un campo", async () => {
        const incomplete = { ...basePatient };
        delete incomplete.gender;

        await expect(patientService.createNewPatient(incomplete, doctor._id))
            .rejects.toThrow("Tutti i campi sono obbligatori");
    });

    test("createNewPatient - lancia errore se data di nascita è nel futuro", async () => {
        const futurePatient = {
            ...basePatient,
            birthDate: "2099-01-01"
        };

        await expect(patientService.createNewPatient(futurePatient, doctor._id))
            .rejects.toThrow("La data di nascita non può essere nel futuro.");
    });

    test("getAllPatients - restituisce solo pazienti del medico", async () => {
        await patientService.createNewPatient(basePatient, doctor._id);
        const patients = await patientService.getAllPatients(doctor._id);
        expect(patients.length).toBe(1);
        expect(patients[0].name).toBe("Mario");
    });

    test("getPatientById - restituisce paziente se appartiene al medico", async () => {
        const created = await patientService.createNewPatient(basePatient, doctor._id);
        const found = await patientService.getPatientById(doctor._id, created._id);
        expect(found.surname).toBe("Rossi");
    });

    test("getAllCriticPatients - restituisce pazienti critici", async () => {
        const critical = { ...basePatient, isCritical: true };
        await patientService.createNewPatient(critical, doctor._id);

        const result = await patientService.getAllCriticPatients(doctor._id);
        expect(result.length).toBe(1);
        expect(result[0].isCritical).toBe(true);
    });

    test("updatePatientInfo - aggiorna i dati del paziente", async () => {
        const created = await patientService.createNewPatient(basePatient, doctor._id);
        const updateData = { ...basePatient, name: "Luigi", isCritical: true };

        const updated = await patientService.updatePatientInfo(updateData, doctor._id, created._id);
        expect(updated.name).toBe("Luigi");
        expect(updated.isCritical).toBe(true);
    });

    test("updatePatientInfo - lancia errore se data futura", async () => {
        const created = await patientService.createNewPatient(basePatient, doctor._id);
        const updateData = { ...basePatient, birthDate: "2100-01-01" };

        await expect(patientService.updatePatientInfo(updateData, doctor._id, created._id))
            .rejects.toThrow("La data di nascita non può essere nel futuro.");
    });

    test("deleteNewPatient - rimuove paziente e relativi appuntamenti", async () => {
        const patient = await patientService.createNewPatient(basePatient, doctor._id);

        await appointmentModel.create({
            patient: patient._id,
            doctor: doctor._id,
            date: new Date(),
            time: "09:00"  // o un valore valido conforme allo schema
        });

        await patientService.deleteNewPatient(patient._id, doctor._id);

        const remaining = await patientModel.find({});
        expect(remaining.length).toBe(0);

        const appointments = await appointmentModel.find({});
        expect(appointments.length).toBe(0);
    });
});
