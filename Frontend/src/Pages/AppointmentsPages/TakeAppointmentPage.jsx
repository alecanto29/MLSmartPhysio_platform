import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useTranslation } from "react-i18next";
import "../../ComponentsCSS/TakeAppointmentPageStyle.css";
import MessageHandlerModel from "../../AtomicComponents/MessageHandlerModel.jsx";
import Header from "../../AtomicComponents/Header.jsx";
import i18n from "i18next";

const TakeAppointmentPage = () => {
    const [patients, setPatients] = useState([]);
    const [date, setDate] = useState("");
    const [time, setTime] = useState("");
    const [notes, setNotes] = useState("");
    const [specificPatient, setSpecificPatient] = useState(null);
    const [showPopup, setShowPopup] = useState(false);
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("success");
    const [searchTerm, setSearchTerm] = useState("");

    const { t } = useTranslation();
    const dateRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchPatients = async () => {
            try {
                const token = localStorage.getItem("token");
                const res = await axios.get("/smartPhysio/patient", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setPatients(res.data);
            } catch (err) {
                console.error("Errore nel recupero pazienti", err);
            }
        };
        fetchPatients();
    }, []);

    const openPopup = (patientId) => {
        setSpecificPatient(patientId);
        setShowPopup(true);
        setMessage("");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem("token");
            await axios.post(
                "/smartPhysio/appointments/newAppointments",
                { date, time, notes, specificPatient },
                { headers: {
                                Authorization: `Bearer ${token}`,
                                "Accept-Language": i18n.language
                    } }
            );
            setMessage(t("APPOINTMENT_POPUP_MESSAGE"));
            setMessageType("success");
            setShowPopup(false);
            setDate("");
            setTime("");
            setNotes("");
            setSpecificPatient(null);
        } catch (error) {
            setMessageType("error");
            const errorMsg =
                typeof error.response?.data === "string"
                    ? error.response.data
                    : error.response?.data?.message ||
                    error.response?.data?.error ||
                    t("appointment.error");
            setMessage(errorMsg);
        }
    };

    const filteredPatients = patients.filter((p) =>
        `${p.name} ${p.surname} ${p.fiscalCode}`.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="page-container">
            <Header />
            <div className="title-container">
                <img src="/images/calendar.png" alt="Calendar" className="calendar-icon" />
                <h2>{t("PATIENT_LIST_MAIN_ICON")}</h2>
            </div>

            <div className="search-wrapper">
                <div className="search-input-container">
                    <i className="bi bi-search search-icon"></i>
                    <input
                        type="text"
                        placeholder={t("SEARCH_BAR_CONTENT_PATIENTS")}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="patient-list-container">
                {filteredPatients.length === 0 ? (
                    <div style={{ textAlign: "center", color: "#003344", fontWeight: "bold", padding: "20px" }}>
                        {t("NOT_FOUND_PATIENT")}
                    </div>
                ) : (
                    <ul className="patient-list">
                        {filteredPatients.map((p, i) => (
                            <li key={i} className="patient-card">
                                <div className="patient-left">
                                    <img src="/images/patient_blue.png" alt="User icon" className="user-img" />
                                    <div className="patient-details">
                                        <div className="patient-name">{p.name} {p.surname}</div>
                                        <div className="patient-birthdate">{new Date(p.birthDate).toLocaleDateString("it-IT")}</div>
                                        <div className="patient-fiscalcode">{p.fiscalCode}</div>
                                    </div>
                                </div>
                                <div className="patient-right" onClick={() => openPopup(p._id)}>
                                    <img src="/images/calendar_v2.png" alt="Calendar icon" className="calendar-mini" />
                                    <span className="take-label">{t("TAKE_NEW_APPOINTMENT_ICON")}</span>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {showPopup && (
                <div className="popup-overlay">
                    <div className="popup-content">
                        <h3>{t("APPOINTMENT_POPUP_TITLE")}</h3>
                        <form onSubmit={handleSubmit}>
                            <label className="date-label-with-button">
                                {t("APPOINTMENT_POPUP_DATE")}:
                                <div className="date-input-wrapper">
                                    <input
                                        type="date"
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                        required
                                        ref={dateRef}
                                    />
                                    <button
                                        type="button"
                                        className="calendar-button"
                                        onClick={() =>
                                            dateRef.current?.showPicker?.() || dateRef.current?.focus()
                                        }
                                    >
                                        <i className="bi bi-calendar calendar-icon"></i>
                                    </button>
                                </div>
                            </label>
                            <label>
                                {t("APPOINTMENT_POPUP_TIME")}:
                                <input type="time" value={time} onChange={(e) => setTime(e.target.value)} required />
                            </label>
                            <label>
                                {t("APPOINTMENT_POPUP_NOTES")}:
                                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
                            </label>
                            <div className="popup-buttons">
                                <button type="submit">{t("APPOINTMENT_POPUP_CONFIRM")}</button>
                                <button type="button" onClick={() => setShowPopup(false)}>{t("APPOINTMENT_POPUP_CANCEL")}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <MessageHandlerModel messageInfo={message} type={messageType} onClear={() => setMessage("")} />

            <div className="back-icon-container" onClick={() => navigate("/appointments")}>
                <i className="bi bi-arrow-left"></i>
            </div>
        </div>
    );
};

export default TakeAppointmentPage;
