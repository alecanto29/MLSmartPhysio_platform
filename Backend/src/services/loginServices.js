const doctorService = require("../services/DoctorServices");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const i18next = require("i18next");

const JWT_SECRET = process.env.JWT_SECRET;

async function registerNewUser(newUser, lang) {
    try {
        if (
            !newUser.name || !newUser.surname || !newUser.email ||
            !newUser.password || !newUser.fiscalCode ||
            !newUser.specialization || !newUser.licenseNumber || !newUser.birthDate
        ) {
            throw new Error(i18next.t("ALL_FIELDS_REQUIRED", { lng: lang }));
        }

        const existingDoctor = await doctorService.getDoctorByEmail(newUser.email);
        if (existingDoctor) {
            throw new Error(i18next.t("EMAIL_ALREADY_REGISTERED", { lng: lang }));        }

        const birth = new Date(newUser.birthDate);
        const now = new Date();

        birth.setHours(0, 0, 0, 0);
        now.setHours(0, 0, 0, 0);

        if (birth > now) {
            throw new Error(i18next.t("FUTURE_DATE", { lng: lang }));
        }

        const hashedPassword = await hashPassword(newUser.password);

        const doctorToSave = {
            name: newUser.name,
            surname: newUser.surname,
            fiscalCode: newUser.fiscalCode,
            specialization: newUser.specialization,
            email: newUser.email,
            licenseNumber: newUser.licenseNumber,
            birthDate: newUser.birthDate,
            passwordHash: hashedPassword
        };

        const user = await doctorService.createNewDoctor(doctorToSave);

        const token = jwt.sign(
            {
                id: user._id,
                email: user.email,
                name: user.name,
                surname: user.surname
            },
            JWT_SECRET,
            { expiresIn: "1h" }
        );

        return {
            token,
            doctorId: user._id,
            name: user.name,
            surname: user.surname
        };
    } catch (error) {
        throw new Error(error.message);
    }
}

async function login(email, password, lang) {
    try {
        const doctor = await doctorService.getDoctorByEmail(email);

        if (!doctor) {
            throw new Error(i18next.t("EMAIL_NOT_FOUND", { lng: lang }));
        }

        const isMatch = await bcrypt.compare(password, doctor.passwordHash);
        if (!isMatch) {
            throw new Error(i18next.t("WRONG_PASSWORD", { lng: lang }));
        }

        const token = jwt.sign(
            {
                id: doctor._id,
                email: doctor.email,
                name: doctor.name,
                surname: doctor.surname
            },
            JWT_SECRET,
            { expiresIn: "1h" }
        );

        return {
            token,
            doctorId: doctor._id,
            name: doctor.name,
            surname: doctor.surname,
        };
    } catch (error) {
        throw new Error(error.message);
    }
}

async function hashPassword(plainPassword) {
    const saltRounds = 10;
    return await bcrypt.hash(plainPassword, saltRounds);
}

module.exports = {
    registerNewUser,
    login,
    hashPassword
};
