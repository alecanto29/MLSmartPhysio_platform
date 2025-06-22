import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import "../ComponentsCSS/PatientDetailsPageStyle.css";
import MessageHandlerModel from "../AtomicComponents/MessageHandlerModel.jsx";
import { useTranslation } from "react-i18next";
import Header from "../AtomicComponents/Header";
import i18n from "i18next";

const PatientDetailsPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [patient, setPatient] = useState(null);
    const [originalPatient, setOriginalPatient] = useState(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("success");
    const { t } = useTranslation();

    useEffect(() => {
        handlePatientDetails();
    }, []);

    const handlePatientDetails = async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await axios.get(`/smartPhysio/patient/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setPatient(response.data);
            setOriginalPatient(response.data);
        } catch (error) {
            console.error("Errore durante il recupero dei dati del paziente");
        }
    };

    const updatePatientDetails = async () => {
        try {
            const token = localStorage.getItem("token");
            await axios.put(`/smartPhysio/patient/${id}`, patient, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Accept-Language": i18n.language
                },
            });

            setOriginalPatient(patient); // aggiorna la copia originale solo se si salva
            setMessage(t("UPDATE_PATIENT"));
            setMessageType("success");
            setIsEditMode(false);
        } catch (error) {
            setMessageType("error");
            const errorMsg =
                typeof error.response?.data === "string"
                    ? error.response.data
                    : error.response?.data?.message ||
                    error.response?.data?.error ||
                    "Errore durante la modifica";
            setMessage(errorMsg);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setPatient({
            ...patient,
            [name]: type === "checkbox" ? checked : value,
        });
    };

    const formatGender = (genderCode) => {
        switch (genderCode) {
            case "M":
                return "Male";
            case "F":
                return "Female";
            case "Other":
                return "Other";
            default:
                return genderCode;
        }
    };

    if (!patient) return <p className="loading">Caricamento in corso...</p>;

    return (
        <div className="page-container">
            <Header />

            <div className="title-section">
                <img src="/images/patient_blue.png" alt="icon" className="title-icon" />
                <h2 className="title-text">{t("PATIENT_DETAILS_TITLE")}</h2>
            </div>

            <div className={`patient-box ${isEditMode ? "scroll-mode" : ""}`}>
                <div className="edit-icon" onClick={() => {
                    if (isEditMode) {
                        setPatient(originalPatient); // annulla le modifiche
                    }
                    setIsEditMode(!isEditMode);
                }}>
                    <img src="/images/update_icon.png" alt="Edit" className="gear-image" />
                </div>

                <div className="patient-header">
                    <img
                        src={patient.isCritical ? "/images/red_patient.png" : "/images/green_patient.png"}
                        alt="patient avatar"
                        className="user-icon"
                    />
                    <h3>{patient.name} {patient.surname}</h3>
                </div>

                <div className="info-grid-rows">
                    <div className="row">
                        <div className="field"><strong>{t("NAME")}:</strong> {isEditMode ? <input name="name" value={patient.name} onChange={handleChange} /> : patient.name}</div>
                        <div className="field"><strong>{t("BIRTH_DATE")}:</strong> {isEditMode ? <input type="date" name="birthDate" value={patient.birthDate?.substring(0, 10)} onChange={handleChange} /> : new Date(patient.birthDate).toLocaleDateString()}</div>
                    </div>
                    <div className="row">
                        <div className="field"><strong>{t("SURNAME")}:</strong> {isEditMode ? <input name="surname" value={patient.surname} onChange={handleChange} /> : patient.surname}</div>
                        <div className="field">
                            <strong>{t("MEDICAL_HISTORY")}:</strong>
                            {isEditMode
                                ? <textarea
                                    name="medicalHistory"
                                    value={patient.medicalHistory}
                                    onChange={(e) => setPatient({ ...patient, medicalHistory: e.target.value })}
                                    className="medical-history-textarea"
                                />
                                : <div className="medical-display">{patient.medicalHistory}</div>}
                        </div>
                    </div>
                    <div className="row">
                        <div className="field"><strong>{t("FISCAL_CODE")}:</strong> {isEditMode ? <input name="fiscalCode" value={patient.fiscalCode} onChange={handleChange} /> : patient.fiscalCode}</div>
                        <div className="field"><strong>{t("GENDER")}:</strong> {isEditMode ? (
                            <div className="horizontal-options">
                                <label className="custom-radio"><input type="radio" name="gender" value="Male" checked={patient.gender === "Male"} onChange={handleChange} /> <span className="radio-circle"></span>{t("MALE")}</label>
                                <label className="custom-radio"><input type="radio" name="gender" value="Female" checked={patient.gender === "Female"} onChange={handleChange} /> <span className="radio-circle"></span>{t("FEMALE")}</label>
                            </div>
                        ) : (
                            patient.gender === "Male" ? t("MALE") : t("FEMALE")
                        )}
                        </div>
                    </div>
                    <div className="row">
                        <div className="field"><strong>{t("HEALTH_CARD_NUMBER")}:</strong> {isEditMode ? <input name="healthCardNumber" value={patient.healthCardNumber} onChange={handleChange} /> : patient.healthCardNumber}</div>
                        <div className="field"><strong>{t("IS_PRIORITY")}:</strong> {isEditMode ? (
                            <div className="horizontal-options">
                                <label className="custom-radio"><input type="radio" name="isCritical" value={true} checked={patient.isCritical === true} onChange={() => setPatient({ ...patient, isCritical: true })} /><span className="radio-circle"></span>{t("YES")}</label>
                                <label className="custom-radio"><input type="radio" name="isCritical" value={false} checked={patient.isCritical === false} onChange={() => setPatient({ ...patient, isCritical: false })} /><span className="radio-circle"></span>{t("NO")}</label>
                            </div>
                        ) : (
                            patient.isCritical ? t("YES") : t("NO")
                        )}
                        </div>
                    </div>
                </div>

                {isEditMode && (
                    <div className="save-section">
                        <button className="save-button" onClick={updatePatientDetails}>
                            {t("SAVE_CHANGES_BUTTON")}
                        </button>
                    </div>
                )}
            </div>

            <div className="back-icon-container" onClick={() => navigate("/patients-list")}>
                <i className="bi bi-arrow-left"></i>
            </div>

            <MessageHandlerModel messageInfo={message} type={messageType} onClear={() => setMessage("")} />
        </div>
    );
};

export default PatientDetailsPage;
