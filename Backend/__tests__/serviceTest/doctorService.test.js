const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const Doctor = require("../../src/models/Doctor");
const doctorService = require("../../src/services/DoctorServices");

let mongoServer;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

afterEach(async () => {
    await Doctor.deleteMany();
});

describe("Doctor Service", () => {
    const baseData = {
        name: "Anna",
        surname: "Bianchi",
        email: "anna.bianchi@example.com",
        fiscalCode: "BNCHNA85E55F205X",
        licenseNumber: "LIC999999",
        birthDate: new Date("1985-05-15"),
        passwordHash: "hash",
    };

    test("createNewDoctor - crea un nuovo medico", async () => {
        const result = await doctorService.createNewDoctor(baseData);
        expect(result.name).toBe("Anna");
        expect(result.email).toBe(baseData.email);
    });

    test("getAllDoctors - restituisce tutti i medici", async () => {
        await doctorService.createNewDoctor(baseData);
        const result = await doctorService.getAllDoctors();
        expect(result.length).toBe(1);
    });

    test("getDoctorById - restituisce un medico specifico", async () => {
        const created = await doctorService.createNewDoctor(baseData);
        const result = await doctorService.getDoctorById(created._id);
        expect(result.email).toBe(baseData.email);
    });

    test("getDoctorById - lancia errore se medico non trovato", async () => {
        const id = new mongoose.Types.ObjectId();
        await expect(doctorService.getDoctorById(id))
            .rejects.toThrow(`Errore durante il recupero del medico con id ${id}`);
    });


    test("getDoctorByEmail - restituisce il medico dato l'email", async () => {
        await doctorService.createNewDoctor(baseData);
        const found = await doctorService.getDoctorByEmail(baseData.email);
        expect(found).not.toBeNull();
        expect(found.fiscalCode).toBe(baseData.fiscalCode);
    });

    test("getDoctorAppointments - restituisce array vuoto se nessun appuntamento", async () => {
        const created = await doctorService.createNewDoctor(baseData);
        const appointments = await doctorService.getDoctorAppointments(created._id);
        expect(appointments).toEqual([]);
    });

    test("deleteDoctor - elimina un medico esistente", async () => {
        const created = await doctorService.createNewDoctor(baseData);
        const deleted = await doctorService.deleteDoctor(created._id);
        expect(deleted.email).toBe(baseData.email);
    });

    test("deleteDoctor - lancia errore se medico non esiste", async () => {
        const fakeId = new mongoose.Types.ObjectId();
        await expect(doctorService.deleteDoctor(fakeId))
            .rejects.toThrow(`Errore durante la rimozione del medico con id: ${fakeId}`);
    });
});
