import React, { useState } from "react";
import axios from "axios";
import TextFieldModel from "../../AtomicComponents/TextFieldModel.jsx";
import ButtonModel from "../../AtomicComponents/ButtonModel.jsx";
import { useNavigate } from "react-router-dom";
import "../../ComponentsCSS/LoginPage.css";
import MessageHandlerModel from "../../AtomicComponents/MessageHandlerModel.jsx";
import { useTranslation } from "react-i18next";

const LoginPage = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();

    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("success");

    const { t, i18n } = useTranslation();
    const [showLangDropdown, setShowLangDropdown] = useState(false);

    const toggleLanguage = (lang) => {
        i18n.changeLanguage(lang);
        localStorage.setItem("language", lang);
        setShowLangDropdown(false);
    };

    const handleLogin = async () => {
        try {
            const response = await axios.post(
                "smartPhysio/auth/login",
                { email, password },
                {
                    headers: {
                        "Accept-Language": i18n.language
                    }
                }
            );

            const token = response.data.token;
            localStorage.setItem("token", token);

            const decoded = JSON.parse(atob(token.split('.')[1]));
            console.log("Decoded JWT:", decoded);
            localStorage.setItem("doctorName", `${decoded.name} ${decoded.surname}`);
            localStorage.setItem("userId", decoded._id); // Salva l'ID del medico

            setMessageType("success");
            setMessage(t("SUCCESSFULLY_LOGIN"));

            setTimeout(() => {
                navigate("/doctor");
            }, 1000);

        } catch (error) {
            setMessageType("error");

            let rawMessage = error.response?.data?.message || error.response?.data?.error || error.response?.data;

            if (typeof rawMessage !== "string") {
                rawMessage = t("Error during login");
            }

            // Se esiste una chiave di traduzione per il messaggio, usala
            const translatedMessage = t(rawMessage);
            setMessage(translatedMessage !== rawMessage ? translatedMessage : rawMessage);
        }
    };

    return (
        <div className="login-container">
            <div className="language-selector">
                <div
                    className="language-button"
                    onClick={() => setShowLangDropdown(!showLangDropdown)}
                >
                    <div className="lang-option">
                        <img
                            src={`/images/${i18n.language}_icon.png`}
                            alt={i18n.language}
                            className="flag-icon"
                        />
                        <span className="lang-label">{i18n.language.toUpperCase()}</span>
                    </div>
                </div>

                {showLangDropdown && (
                    <div
                        className="language-dropdown"
                        onMouseLeave={() => setShowLangDropdown(false)}
                    >
                        <div className="lang-option" onClick={() => toggleLanguage("it")}>
                            <img src="/images/it_icon.png" alt="it" className="flag-icon" />
                            <span className="lang-label">IT</span>
                        </div>
                        <div className="lang-option" onClick={() => toggleLanguage("en")}>
                            <img src="/images/en_icon.png" alt="en" className="flag-icon" />
                            <span className="lang-label">EN</span>
                        </div>
                    </div>
                )}
            </div>

            <img src="/images/app_logo.png" alt="Logo MLSmartPhysio" className="login-logo" />

            <div className="user-icon">
                <i className="bi bi-person-circle"></i>
            </div>

            <div className="login-form">
                <div className="input-group">
                    <label>{t("EMAIL")}</label>
                    <TextFieldModel
                        type="email"
                        placeholder={t("EMAIL_PLACEHOLDER")}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>

                <div className="input-group">
                    <label>{t("PASSWORD")}</label>
                    <TextFieldModel
                        type="password"
                        placeholder={t("PASSWORD_PLACEHOLDER")}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>

                <div className="button-row">
                    <ButtonModel buttonText={t("SIGN_UP_BUTTON")} onClick={() => navigate("/registration")} />
                    <ButtonModel buttonText={t("LOGIN_BUTTON")} onClick={handleLogin} />
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
