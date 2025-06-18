const request = require("supertest");
const express = require("express");
const loginController = require("../../src/controller/loginController");
const loginService = require("../../src/services/loginServices");

jest.mock("../../src/services/loginServices");

const app = express();
app.use(express.json());

// Rotte simulate
app.post("/auth/register", loginController.registerNewUser);
app.post("/auth/login", loginController.login);

describe("loginController", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("POST /auth/register - registra un nuovo utente con successo", async () => {
        const newUser = { email: "test@example.com", password: "123456" };
        const registeredUser = { id: "1", email: newUser.email };

        loginService.registerNewUser.mockResolvedValue(registeredUser);

        const res = await request(app).post("/auth/register").send(newUser);

        expect(res.status).toBe(201);
        expect(res.body).toEqual(registeredUser);
        expect(loginService.registerNewUser).toHaveBeenCalledWith(newUser);
    });

    test("POST /auth/register - errore durante la registrazione", async () => {
        const newUser = { email: "invalid", password: "123" };
        loginService.registerNewUser.mockRejectedValue(new Error("Email non valida"));

        const res = await request(app).post("/auth/register").send(newUser);

        expect(res.status).toBe(400);
        expect(res.body).toEqual({ error: "Email non valida" });
        expect(loginService.registerNewUser).toHaveBeenCalledWith(newUser);
    });

    test("POST /auth/login - login riuscito", async () => {
        const credentials = { email: "test@example.com", password: "123456" };
        const loginResult = { token: "fake-jwt-token" };

        loginService.login.mockResolvedValue(loginResult);

        const res = await request(app).post("/auth/login").send(credentials);

        expect(res.status).toBe(200);
        expect(res.body).toEqual(loginResult);
        expect(loginService.login).toHaveBeenCalledWith(credentials.email, credentials.password);
    });

    test("POST /auth/login - login fallito", async () => {
        const credentials = { email: "wrong@example.com", password: "wrong" };
        loginService.login.mockRejectedValue(new Error("Credenziali non valide"));

        const res = await request(app).post("/auth/login").send(credentials);

        expect(res.status).toBe(401);
        expect(res.body).toEqual({ error: "Credenziali non valide" });
        expect(loginService.login).toHaveBeenCalledWith(credentials.email, credentials.password);
    });
});
