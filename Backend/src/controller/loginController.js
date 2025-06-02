const loginService = require("../services/loginServices");
const express = require("express");

const app = express();
app.use(express.json());

const registerNewUser = async (req, res) => {
    try {
        const userData = req.body;
        const result = await loginService.registerNewUser(userData);
        res.status(201).json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const login = async (req, res) => {
    try {
        const email = req.body.email;
        const password = req.body.password;

        const loginResult = await loginService.login(email, password);
        res.status(200).json(loginResult);
    } catch (error) {
        res.status(401).json({ error: error.message });
    }
};

module.exports = {
    registerNewUser,
    login
};
