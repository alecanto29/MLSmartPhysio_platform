import React, { useState, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "../../ComponentsCSS/RegistrationPage.css";
import MessageHandlerModel from "../../AtomicComponents/MessageHandlerModel.jsx";
import TextFieldModel from "../../AtomicComponents/TextFieldModel.jsx";
import ButtonModel from "../../AtomicComponents/ButtonModel.jsx";

const RegistrationPage = () => {
    const { t, i18n } = useTranslation();

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
    const [messageType, setMessageType] = useState("success");

    const [showLangDropdown, setShowLangDropdown] = useState(false);

    const toggleLanguage = (lang) => {
        i18n.changeLanguage(lang);
        localStorage.setItem("language", lang);
        setShowLangDropdown(false);
    };

    const handleRegistration = async () => {
        try {
            const response = await axios.post(
                "/smartPhysio/auth/register",
                {
                    name,
                    surname,
                    fiscalCode,
                    specialization,
                    email,
                    password,
                    licenseNumber,
                    birthDate,
                },
                {
                    headers: {
                        "Accept-Language": i18n.language
                    }
                }
            );

            const token = response.data.token;
            localStorage.setItem("token", token);

            const decoded = JSON.parse(atob(token.split('.')[1]));
            localStorage.setItem("doctorName", `${decoded.name} ${decoded.surname}`);
            localStorage.setItem("userId", decoded._id); // Salva l'ID del medico

            setMessage(t("SUCCESSFULLY_SIGNED_UP"));
            setMessageType("success");

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
                    t("EMAIL_ALREADY_REGISTERED");

            setMessage(errorMsg);
        }
    };

    return (
        <div className="registration-page">

            {/* Selettore lingua in alto a destra */}
            <div className="fixed-lang-selector">
                <div
                    className="reg-language-button"
                    onClick={() => setShowLangDropdown(!showLangDropdown)}
                >
                    <div className="reg-lang-option">
                        <img
                            src={`/images/${i18n.language}_icon.png`}
                            alt={i18n.language}
                            className="reg-flag-icon"
                        />
                        <span className="reg-lang-label">{i18n.language.toUpperCase()}</span>
                    </div>
                </div>

                {showLangDropdown && (
                    <div
                        className="reg-language-dropdown"
                        onMouseLeave={() => setShowLangDropdown(false)}
                    >
                        <div className="reg-lang-option" onClick={() => toggleLanguage("it")}>
                            <img src="/images/it_icon.png" alt="it" className="reg-flag-icon" />
                            <span className="reg-lang-label">IT</span>
                        </div>
                        <div className="reg-lang-option" onClick={() => toggleLanguage("en")}>
                            <img src="/images/en_icon.png" alt="en" className="reg-flag-icon" />
                            <span className="reg-lang-label">EN</span>
                        </div>
                    </div>
                )}
            </div>

            <div className="registration-container">
                <div className="registration-left">
                    <img src="/images/app_logo.png" alt="Logo MLSmartPhysio" className="login-logo" />
                    <button onClick={() => navigate("/login")}>{t("SIGN_IN_BUTTON")}</button>
                </div>

                <div className="registration-right">
                    <div className="user-icon">
                        <i className="bi bi-person-circle"></i>
                    </div>

                    <div className="form-grid">
                        {/* Input fields */}
                        <div className="input-block">
                            <label>{t("NAME")}</label>
                            <TextFieldModel
                                type="text"
                                placeholder={t("NAME_PLACEHOLDER")}
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>

                        <div className="input-block">
                            <label>{t("SURNAME")}</label>
                            <TextFieldModel
                                type="text"
                                placeholder={t("SURNAME_PLACEHOLDER")}
                                value={surname}
                                onChange={(e) => setSurname(e.target.value)}
                            />
                        </div>

                        <div className="input-block">
                            <label>{t("FISCAL_CODE")}</label>
                            <TextFieldModel
                                type="text"
                                placeholder={t("FISCAL_CODE_PLACEHOLDER")}
                                value={fiscalCode}
                                onChange={(e) => setFiscalCode(e.target.value)}
                            />
                        </div>

                        <div className="input-block">
                            <label>{t("SPECIALIZATION")}</label>
                            <TextFieldModel
                                type="text"
                                placeholder={t("SPECIALIZATION_PLACEHOLDER")}
                                value={specialization}
                                onChange={(e) => setSpecialization(e.target.value)}
                            />
                        </div>

                        <div className="input-block">
                            <label>{t("EMAIL")}</label>
                            <TextFieldModel
                                type="email"
                                placeholder={t("EMAIL_PLACEHOLDER")}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>

                        <div className="input-block">
                            <label htmlFor="birth-date">{t("BIRTH_DATE")}</label>
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
                            <label>{t("PASSWORD")}</label>
                            <TextFieldModel
                                type="password"
                                placeholder={t("PASSWORD_PLACEHOLDER")}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>

                        <div className="input-block">
                            <label>{t("LICENSE_NUMBER")}</label>
                            <TextFieldModel
                                type="text"
                                placeholder={t("LICENSE_PLACEHOLDER")}
                                value={licenseNumber}
                                onChange={(e) => setLicenseNumber(e.target.value)}
                            />
                        </div>
                    </div>

                    <ButtonModel className="confirm-button" buttonText={t("CONFIRM_BUTTON")} onClick={handleRegistration} />
                    <MessageHandlerModel messageInfo={message} type={messageType} onClear={() => setMessage("")} />
                </div>
            </div>
        </div>
    );
};

export default RegistrationPage;
