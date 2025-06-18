const request = require("supertest");
const express = require("express");
const app = express();
const router = require("../../src/routes/loginRoutes");

// Mock del controller
const loginController = require("../../src/controller/loginController");
jest.mock("../../src/controller/loginController");

// Setup app
app.use(express.json());
app.use("/auth", router);

describe("Login Router", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("POST /auth/register - registerNewUser", async () => {
        loginController.registerNewUser.mockImplementation((req, res) => {
            res.status(201).json({ message: "User registered" });
        });

        const res = await request(app)
            .post("/auth/register")
            .send({
                email: "user@example.com",
                password: "securepassword",
                name: "John",
                surname: "Doe"
            });

        expect(res.status).toBe(201);
        expect(res.body.message).toBe("User registered");
        expect(loginController.registerNewUser).toHaveBeenCalled();
    });

    test("POST /auth/login - login", async () => {
        loginController.login.mockImplementation((req, res) => {
            res.status(200).json({ token: "mocked-jwt-token" });
        });

        const res = await request(app)
            .post("/auth/login")
            .send({
                email: "user@example.com",
                password: "securepassword"
            });

        expect(res.status).toBe(200);
        expect(res.body.token).toBe("mocked-jwt-token");
        expect(loginController.login).toHaveBeenCalled();
    });
});
