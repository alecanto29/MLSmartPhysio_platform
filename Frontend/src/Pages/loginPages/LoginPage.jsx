import React, { useState } from "react";
import axios from "axios";
import TextFieldModel from "../../AtomicComponents/TextFieldModel.jsx";
import ButtonModel from "../../AtomicComponents/ButtonModel.jsx";
import { useNavigate } from "react-router-dom";
import "../../ComponentsCSS/LoginPage.css";

const LoginPage = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();

    const handleLogin = async () => {
        try {
            const response = await axios.post("smartPhysio/auth/login", {
                email,
                password,
            });

            localStorage.setItem("token", response.data.token);
            navigate("/doctor");
        } catch (error) {
            console.error("Errore durante il login:", error.response?.data || error.message);
        }
    };

    return (
        <div className="login-container">
            <img src="/images/app_logo.png" alt="Logo MLSmartPhysio" className="login-logo" />

            <div className="user-icon">
                <i className="bi bi-person-circle"></i>
            </div>

            <div className="login-form">

                <div className="input-group">
                    <TextFieldModel
                        type="email"
                        placeholder="Insert your email here..."
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>

                <div className="input-group">
                    <TextFieldModel
                        type="password"
                        placeholder="Insert your password here..."
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>

                <div>
                    <ButtonModel buttonText="Sign Up" onClick={() => navigate("/registration")} />
                    <ButtonModel buttonText="Login" onClick={handleLogin} />
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
