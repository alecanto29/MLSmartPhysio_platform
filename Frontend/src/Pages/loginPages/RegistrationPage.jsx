import React, { useState, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../../ComponentsCSS/RegistrationPage.css";
import MessageHandlerModel from "../../AtomicComponents/MessageHandlerModel.jsx";
import TextFieldModel from "../../AtomicComponents/TextFieldModel.jsx";


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

    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("succes")

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

            const token = response.data.token;
            localStorage.setItem("token", token);

            const decoded = JSON.parse(atob(token.split('.')[1]));
            localStorage.setItem("doctorName", `${decoded.name} ${decoded.surname}`);

            setMessage("Registrazione avvenuta con successo");
            setMessageType("success");

            setTimeout(() =>{
                navigate("/doctor");
            },1000);

        } catch (error) {

            setMessageType("error");

            const errorMsg =
                typeof error.response?.data === "string"
                    ? error.response.data
                    : error.response?.data?.message ||
                    error.response?.data?.error ||
                    "Errore durante la registrazione";

            setMessage(errorMsg);
        }
    };

    return (
        <div className="registration-container">
            <div className="registration-left">
                <img src="/images/app_logo.png" alt="Logo MLSmartPhysio" className="login-logo" />
                <button onClick={() => navigate("/login")}>Sign In</button>
            </div>

            <div className="registration-right">
                <div className="user-icon">
                    <i className="bi bi-person-circle"></i>
                </div>

                <div className="form-grid">
                    <div className="input-block">
                        <label>Name</label>
                        <TextFieldModel
                            type="text"
                            placeholder="Insert your name here..."
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>

                    <div className="input-block">
                        <label>Surname</label>
                        <TextFieldModel
                            type="text"
                            placeholder="Insert your surname here..."
                            value={surname}
                            onChange={(e) => setSurname(e.target.value)}
                        />
                    </div>

                    <div className="input-block">
                        <label>Fiscal Code</label>
                        <TextFieldModel
                            type="text"
                            placeholder="Insert your fiscal code here..."
                            value={fiscalCode}
                            onChange={(e) => setFiscalCode(e.target.value)}
                        />
                    </div>

                    <div className="input-block">
                        <label>Specialization</label>
                        <TextFieldModel
                            type="text"
                            placeholder="Insert your specialization here..."
                            value={specialization}
                            onChange={(e) => setSpecialization(e.target.value)}
                        />
                    </div>

                    <div className="input-block">
                        <label>Email</label>
                        <TextFieldModel
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
                        <TextFieldModel
                            type="password"
                            placeholder="Insert your password here..."
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    <div className="input-block">
                        <label>License Number</label>
                        <TextFieldModel
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

                <MessageHandlerModel messageInfo={message}
                                     type={messageType}
                                     onClear={() => setMessage("")}/>
            </div>
        </div>
    );
};

export default RegistrationPage;
