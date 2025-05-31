const doctorService = require("../services/DoctorServices");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET;

async function registerNewUser(newUser) {
    try {
        // Cripta la password
        const hashedPassword = await hashPassword(newUser.passwordHash);

        // Sostituisci la password in chiaro
        newUser.passwordHash = hashedPassword;

        // Crea il nuovo medico
        const user = await doctorService.createNewDoctor(newUser);
        return user;
    } catch (error) {
        throw new Error("Errore durante la registrazione del medico");
    }
}

async function login(email, password) {
    try {
        const allDoctors = await doctorService.getAllDoctors();

        for (let i = 0; i < allDoctors.length; i++) {
            const doctor = allDoctors[i];

            if (doctor.email === email) {
                const isMatch = await bcrypt.compare(password, doctor.passwordHash);
                if (isMatch) {
                    // Genera JWT
                    const token = jwt.sign({ id: doctor._id, email: doctor.email }, JWT_SECRET, {
                        expiresIn: "1h",
                    });

                    return {
                        token,
                        doctorId: doctor._id,
                        name: doctor.name,
                        surname: doctor.surname,
                    };
                }
            }
        }

        throw new Error("Credenziali non valide");
    } catch (error) {
        throw new Error("Errore durante il login");
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
