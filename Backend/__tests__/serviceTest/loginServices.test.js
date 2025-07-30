process.env.JWT_SECRET = "testsecret123";

jest.mock("i18next", () => ({
    t: (key, options) => {
        const translations = {
            ALL_FIELDS_REQUIRED: "Tutti i campi sono obbligatori",
            EMAIL_ALREADY_REGISTERED: "Email già registrata",
            EMAIL_NOT_FOUND: "Email non trovata",
            WRONG_PASSWORD: "Password errata"
        };
        return translations[key] || key;
    }
}));

const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const authService = require("../../src/services/loginServices");
const Doctor = require("../../src/models/Doctor");

let mongoServer;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
    await Doctor.syncIndexes();
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

afterEach(async () => {
    await Doctor.deleteMany();
});

describe("AuthService", () => {
    const baseDoctor = {
        name: "Mario",
        surname: "Rossi",
        email: "mario.rossi@example.com",
        password: "secure123",
        fiscalCode: "RSSMRA80A01F205X",
        specialization: "Cardiology",
        licenseNumber: "LIC123456",
        birthDate: new Date("1980-01-01")
    };

    const lang = "it";

    test("registerNewUser - crea un nuovo medico e restituisce token", async () => {
        const result = await authService.registerNewUser(baseDoctor, lang);
        expect(result).toHaveProperty("token");
        expect(result).toHaveProperty("doctorId");
        expect(result.name).toBe("Mario");

        const doctors = await Doctor.find({});
        expect(doctors.length).toBe(1);
    });

    test("registerNewUser - fallisce se manca un campo", async () => {
        const incomplete = { ...baseDoctor };
        delete incomplete.email;

        await expect(authService.registerNewUser(incomplete, lang))
            .rejects.toThrow("Tutti i campi sono obbligatori");
    });

    test("registerNewUser - fallisce se email è già registrata", async () => {
        await authService.registerNewUser(baseDoctor, lang);
        await expect(authService.registerNewUser(baseDoctor, lang))
            .rejects.toThrow("Email già registrata");
    });

    test("login - restituisce token se credenziali corrette", async () => {
        await authService.registerNewUser(baseDoctor, lang);
        const result = await authService.login(baseDoctor.email, baseDoctor.password, lang);

        expect(result).toHaveProperty("token");
        expect(result.name).toBe("Mario");
    });

    test("login - fallisce se email non esiste", async () => {
        await expect(authService.login("notfound@example.com", "password", lang))
            .rejects.toThrow("Email non trovata");
    });

    test("login - fallisce se password errata", async () => {
        await authService.registerNewUser(baseDoctor, lang);
        await expect(authService.login(baseDoctor.email, "wrongpassword", lang))
            .rejects.toThrow("Password errata");
    });
});
