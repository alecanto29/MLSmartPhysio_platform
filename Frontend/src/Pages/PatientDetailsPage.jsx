import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import "../ComponentsCSS/PatientDetailsPageStyle.css";
import MessageHandlerModel from "../AtomicComponents/MessageHandlerModel.jsx";

const PatientDetailsPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [patient, setPatient] = useState(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("success");

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
        } catch (error) {
            console.error("Errore durante il recupero dei dati del paziente");
        }
    };

    const updatePatientDetails = async () => {
        try {
            const token = localStorage.getItem("token");
            await axios.put(`/smartPhysio/patient/${id}`, patient, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setMessage("Paziente modificato con successo");
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
            <div className="header">
                <img src="/images/app_logo.png" className="logo" alt="logo" />
                <div className="user">
                    {localStorage.getItem("doctorName") || "Utente"}{" "}
                    <i className="bi bi-person-circle icon" />
                </div>
            </div>

            <div className="title-section">
                <img src="/images/patient_blue.png" alt="icon" className="title-icon" />
                <h2 className="title-text">Patient Details</h2>
            </div>

            <div className="patient-box">
                <div className="edit-icon" onClick={() => setIsEditMode(!isEditMode)}>
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
                        <div className="field"><strong>Name:</strong> {isEditMode ? <input name="name" value={patient.name} onChange={handleChange} /> : patient.name}</div>
                        <div className="field"><strong>Birth Date:</strong> {isEditMode ? <input type="date" name="birthDate" value={patient.birthDate?.substring(0, 10)} onChange={handleChange} /> : new Date(patient.birthDate).toLocaleDateString()}</div>
                    </div>
                    <div className="row">
                        <div className="field"><strong>Surname:</strong> {isEditMode ? <input name="surname" value={patient.surname} onChange={handleChange} /> : patient.surname}</div>
                        <div className="field">
                            <strong>Medical history:</strong>
                            {isEditMode
                                ? <textarea
                                    name="medicalHistory"
                                    value={patient.medicalHistory}
                                    onChange={(e) => {
                                        const lineHeight = 20; // Altezza riga in px
                                        const maxLines = 8;

                                        const textarea = e.target;
                                        textarea.rows = 1; // Reset temporaneo per misurare scrollHeight
                                        const currentHeight = textarea.scrollHeight;
                                        const currentLines = Math.floor(currentHeight / lineHeight);

                                        if (currentLines <= maxLines) {
                                            setPatient({ ...patient, medicalHistory: textarea.value });
                                        }
                                    }}
                                    rows="8"
                                    className="medical-history-textarea"
                                />

                                : <div className="medical-display">{patient.medicalHistory}</div>}
                        </div>
                    </div>
                    <div className="row">
                        <div className="field"><strong>Fiscal Code:</strong> {isEditMode ? <input name="fiscalCode" value={patient.fiscalCode} onChange={handleChange} /> : patient.fiscalCode}</div>
                        <div className="field"><strong>Gender:</strong> {isEditMode ? (
                            <div className="horizontal-options">
                                <label className="custom-radio"><input type="radio" name="gender" value="Male" checked={patient.gender === "Male"} onChange={handleChange} /> <span className="radio-circle"></span>Male</label>
                                <label className="custom-radio"><input type="radio" name="gender" value="Female" checked={patient.gender === "Female"} onChange={handleChange} /> <span className="radio-circle"></span>Female</label>
                            </div>
                        ) : patient.gender}</div>
                    </div>
                    <div className="row">
                        <div className="field"><strong>Health Card Number:</strong> {isEditMode ? <input name="healthCardNumber" value={patient.healthCardNumber} onChange={handleChange} /> : patient.healthCardNumber}</div>
                        <div className="field"><strong>Is critical:</strong> {isEditMode ? (
                            <div className="horizontal-options">
                                <label className="custom-radio"><input type="radio" name="isCritical" value={true} checked={patient.isCritical === true} onChange={() => setPatient({ ...patient, isCritical: true })} /><span className="radio-circle"></span>Yes</label>
                                <label className="custom-radio"><input type="radio" name="isCritical" value={false} checked={patient.isCritical === false} onChange={() => setPatient({ ...patient, isCritical: false })} /><span className="radio-circle"></span>No</label>
                            </div>
                        ) : patient.isCritical ? "Yes" : "No"}</div>
                    </div>
                </div>


                {isEditMode && (
                    <div className="save-section">
                        <button className="save-button" onClick={updatePatientDetails}>
                            Save Changes
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
