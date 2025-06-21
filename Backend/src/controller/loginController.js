const loginService = require("../services/loginServices");
const express = require("express");
const i18next = require("i18next");

const app = express();
app.use(express.json());

const registerNewUser = async (req, res) => {
    try {
        const lang = req.language || 'en';
        const userData = req.body;
        const result = await loginService.registerNewUser(userData, lang);
        res.status(201).json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const login = async (req, res) => {
    try {
        console.log("LINGUA ricevuta:", req.language);
        const lang = req.language || 'en';
        const email = req.body.email;
        const password = req.body.password;

        const loginResult = await loginService.login(email, password, lang);
        res.status(200).json(loginResult);
    } catch (error) {
        res.status(401).json({ error: error.message });
    }
};

module.exports = {
    registerNewUser,
    login
};
