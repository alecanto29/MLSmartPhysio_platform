import React, { useState } from "react";
import axios from "axios";
import TextFieldModel from "../../AtomicComponents/TextFieldModel.jsx";
import ButtonModel from "../../AtomicComponents/ButtonModel.jsx";
import { useNavigate } from "react-router-dom";
import "../../ComponentsCSS/LoginPage.css";
import MessageHandlerModel from "../../AtomicComponents/MessageHandlerModel.jsx";

const LoginPage = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();

    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("success");

    const handleLogin = async () => {
        try {
            const response = await axios.post("smartPhysio/auth/login", {
                email,
                password,
            });

            const token = response.data.token;
            localStorage.setItem("token", token);

            const decoded = JSON.parse(atob(token.split('.')[1]));
            console.log("Decoded JWT:", decoded);
            localStorage.setItem("doctorName", `${decoded.name} ${decoded.surname}`);

            setMessageType("success");
            setMessage("Login effettuato correttamente");

            setTimeout(() => {
                navigate("/doctor");
            }, 1000);

        } catch (error) {
            setMessageType("error");

            const errorMsg =
                typeof error.response?.data === "string"
                    ? error.response.data
                    : error.response?.data?.message ||
                    error.response?.data?.error ||
                    "Errore durante il login";

            setMessage(errorMsg);
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
                    <label>Email</label>
                    <TextFieldModel
                        type="email"
                        placeholder="Insert your email here..."
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>

                <div className="input-group">
                    <label>Password</label>
                    <TextFieldModel
                        type="password"
                        placeholder="Insert your password here..."
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>

                <div className="button-row">
                    <ButtonModel buttonText="Sign Up" onClick={() => navigate("/registration")} />
                    <ButtonModel buttonText="Login" onClick={handleLogin} />
                </div>
                <MessageHandlerModel
                    messageInfo={message}
                    type={messageType}
                    onClear={() => setMessage("")}
                />
            </div>
        </div>
    );
};

export default LoginPage;
