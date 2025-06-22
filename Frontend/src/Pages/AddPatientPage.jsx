import React, { useRef, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import TextFieldModel from "../AtomicComponents/TextFieldModel.jsx";
import ButtonModel from "../AtomicComponents/ButtonModel.jsx";
import MessageHandlerModel from "../AtomicComponents/MessageHandlerModel.jsx";
import "../ComponentsCSS/AddPatientPageStyle.css";
import Header from "../AtomicComponents/Header.jsx";
import { useTranslation } from "react-i18next";

const AddPatientPage = () => {
    const { t, i18n } = useTranslation();

    const [name, setName] = useState("");
    const [surname, setSurname] = useState("");
    const [fiscalCode, setFiscalCode] = useState("");
    const [healthCardNumber, setHealthCardNumber] = useState("");
    const [medicalHistory, setMedicalHistory] = useState("");
    const [gender, setGender] = useState("");
    const [birthDate, setBirthDate] = useState("");

    const navigate = useNavigate();
    const birthDateRef = useRef(null);

    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("success");

    const handleAddPatient = async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await axios.post(
                "/smartPhysio/patient",
                {
                    name,
                    surname,
                    fiscalCode,
                    healthCardNumber,
                    gender,
                    medicalHistory,
                    birthDate,
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Accept-Language": i18n.language
                    }
                }
            );

            setMessage(t("CONFIRM PATIENT"));
            setMessageType("success");

            setTimeout(() => {
                navigate("/doctor");
            }, 1000);
        } catch (error) {
            setMessageType("error");

            const raw =
                typeof error.response?.data === "string"
                    ? error.response.data
                    : error.response?.data?.message ||
                    error.response?.data?.error ||
                    "PATIENT_ADD_ERROR";

            setMessage(raw);
        }
    };

    return (
        <div className="page-container" style={{ position: "relative" }}>
            <Header />

            <div className="form-container">
                <div className="form-title">
                    <img src="/images/patient_blue.png" alt="Icona paziente" className="title-icon" />
                    <h2>{t("ADD_NEW_PATIENCE_TITLE")}</h2>
                </div>

                <div className="form-box">
                    <form className="form-grid">
                        <div className="input-block">
                            <label>{t("NAME")}</label>
                            <TextFieldModel placeholder={t("NAME_PLACEHOLDER")} value={name} onChange={(e) => setName(e.target.value)} />
                        </div>
                        <div className="input-block">
                            <label>{t("SURNAME")}</label>
                            <TextFieldModel placeholder={t("SURNAME_PLACEHOLDER")} value={surname} onChange={(e) => setSurname(e.target.value)} />
                        </div>

                        <div className="input-block">
                            <label>{t("FISCAL_CODE")}</label>
                            <TextFieldModel placeholder={t("FISCAL_CODE_PLACEHOLDER")} value={fiscalCode} onChange={(e) => setFiscalCode(e.target.value)} />
                        </div>
                        <div className="input-block">
                            <label>{t("HEALTH_CARD_NUMBER")}</label>
                            <TextFieldModel placeholder={t("HEALTH_CARD_NUMBER_PLACEHOLDER")} value={healthCardNumber} onChange={(e) => setHealthCardNumber(e.target.value)} />
                        </div>

                        <div className="input-block full-width">
                            <label>{t("MEDICAL_HISTORY")}</label>
                            <textarea
                                placeholder={t("MEDICAL_HISTORY_PLACEHOLDER")}
                                value={medicalHistory}
                                onChange={(e) => setMedicalHistory(e.target.value)}
                            />
                        </div>

                        <div className="input-block">
                            <label htmlFor="birth-date">{t("BIRTH_DATE")}</label>
                            <input
                                id="birth-date"
                                type="date"
                                className="birth-date-input"
                                value={birthDate}
                                onChange={(e) => setBirthDate(e.target.value)}
                            />
                        </div>

                        <div className="input-block gender-shift-up">
                            <label htmlFor="gender-selection">{t("GENDER")}</label>
                            <div id="gender-selection" className="gender-options gender-options-shift">
                                <label className="custom-radio">
                                    <input type="radio" name="gender" value="Male" checked={gender === "Male"} onChange={() => setGender("Male")} />
                                    <span className="radio-circle"></span> {t("MALE")}
                                </label>
                                <label className="custom-radio">
                                    <input type="radio" name="gender" value="Female" checked={gender === "Female"} onChange={() => setGender("Female")} />
                                    <span className="radio-circle"></span> {t("FEMALE")}
                                </label>
                            </div>
                        </div>
                    </form>
                </div>

                <div className="confirm-button-wrapper">
                    <ButtonModel buttonText={t("CONFIRM_BUTTON")} onClick={handleAddPatient} />
                </div>

                <MessageHandlerModel messageInfo={message} type={messageType} onClear={() => setMessage("")} />
            </div>

            <i className="bi bi-house-door-fill bottom-icon" onClick={() => navigate("/doctor")}></i>
        </div>
    );
};

export default AddPatientPage;
