import React, { useState, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../../ComponentsCSS/RegistrationPage.css";


const RegistrationPage = () => {
    const [name, setName] = useState("");
    const [surname, setSurname] = useState("");
    const [fiscalCode, setFiscalCode] = useState("");
    const [specialization, setSpecialization] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [licenseNumber, setLicenseNumber] = useState("");
    const [birthDate, setBirthDate] = useState("");

    const navigate = useNavigate();

    const birthDateRef = useRef(null);

    const handleRegistration = async () => {
        try {
            const response = await axios.post("/smartPhysio/auth/register", {
                name,
                surname,
                fiscalCode,
                specialization,
                email,
                password,
                licenseNumber,
                birthDate,
            });
            console.log("Registrazione completata:", response.data);
            navigate("/doctor");
        } catch (error) {
            console.error("Errore durante la registrazione:", error.response?.data || error.message);
        }
    };

    return (
        <div className="registration-container">
            <div className="registration-left">
                <img src="/images/app_logo.png" alt="Logo MLSmartPhysio" className="login-logo" />
                <button onClick={() => navigate("/login")}>Sign In</button>
            </div>

            <div className="registration-right">
                <i className="bi bi-person-circle user-icon"></i>

                <div className="form-grid">
                    <div className="input-block">
                        <label>Name</label>
                        <input
                            type="text"
                            placeholder="Insert your name here..."
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>

                    <div className="input-block">
                        <label>Surname</label>
                        <input
                            type="text"
                            placeholder="Insert your surname here..."
                            value={surname}
                            onChange={(e) => setSurname(e.target.value)}
                        />
                    </div>

                    <div className="input-block">
                        <label>Fiscal Code</label>
                        <input
                            type="text"
                            placeholder="Insert your fiscal code here..."
                            value={fiscalCode}
                            onChange={(e) => setFiscalCode(e.target.value)}
                        />
                    </div>

                    <div className="input-block">
                        <label>Specialization</label>
                        <input
                            type="text"
                            placeholder="Insert your specialization here..."
                            value={specialization}
                            onChange={(e) => setSpecialization(e.target.value)}
                        />
                    </div>

                    <div className="input-block">
                        <label>Email</label>
                        <input
                            type="email"
                            placeholder="Insert your email here..."
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    <div className="input-block">
                        <label htmlFor="birth-date">Birth Date</label>
                        <div className="input-icon-wrapper">
                            <input
                                id="birth-date"
                                ref={birthDateRef}
                                type="date"
                                className="birth-date-input"
                                value={birthDate}
                                onChange={(e) => setBirthDate(e.target.value)}
                            />
                            <button
                                type="button"
                                className="calendar-button"
                                onClick={() => birthDateRef.current?.showPicker?.() || birthDateRef.current?.focus()}
                            >
                                <i className="bi bi-calendar calendar-icon"></i>
                            </button>
                        </div>
                    </div>


                    <div className="input-block">
                        <label>Password</label>
                        <input
                            type="password"
                            placeholder="Insert your password here..."
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    <div className="input-block">
                        <label>License Number</label>
                        <input
                            type="text"
                            placeholder="Insert your license number here..."
                            value={licenseNumber}
                            onChange={(e) => setLicenseNumber(e.target.value)}
                        />
                    </div>
                </div>

                <button className="confirm-button" onClick={handleRegistration}>
                    Confirm
                </button>
            </div>
        </div>
    );
};

export default RegistrationPage;
