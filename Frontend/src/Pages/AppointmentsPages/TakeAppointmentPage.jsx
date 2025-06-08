import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../../ComponentsCSS/TakeAppointmentPageStyle.css";
import MessageHandlerModel from "../../AtomicComponents/MessageHandlerModel.jsx";
import Header from "../../AtomicComponents/Header.jsx";

const TakeAppointmentPage = () => {
    const [patients, setPatients] = useState([]);
    const [date, setDate] = useState("");
    const [time, setTime] = useState("");
    const [notes, setNotes] = useState("");
    const [specificPatient, setSpecificPatient] = useState(null);
    const [showPopup, setShowPopup] = useState(false);
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("success");

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
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setMessage("Appuntamento creato con successo");
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
                    "Errore durante la registrazione";
            setMessage(errorMsg);
        }
    };

    return (
        <div className="page-container">
            {/* HEADER */}
            <Header />

            {/* TITOLO */}
            <div className="title-container">
                <img src="/images/calendar.png" alt="Calendar" className="calendar-icon" />
                <h2>Patient List</h2>
            </div>

            {/* LISTA PAZIENTI */}
            <ul className="patient-list">
                {patients.map((p, i) => (
                    <li key={i} className="patient-card">
                        <div className="patient-left">
                            <img src="/images/patient_blue.png" alt="User icon" className="user-img" />
                            <span className="patient-name">{p.name} {p.surname}</span>
                        </div>
                        <div className="patient-right" onClick={() => openPopup(p._id)}>
                            <img src="/images/calendar_v2.png" alt="Calendar icon" className="calendar-mini" />
                            <span className="take-label">Take new appointment</span>
                        </div>
                    </li>
                ))}
            </ul>

            {/* POPUP */}
            {showPopup && (
                <div className="popup-overlay">
                    <div className="popup-content">
                        <h3>New Appointment</h3>
                        <form onSubmit={handleSubmit}>
                            <label>
                                Date:
                                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
                            </label>
                            <label>
                                Time:
                                <input type="time" value={time} onChange={(e) => setTime(e.target.value)} required />
                            </label>
                            <label>
                                Notes:
                                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
                            </label>
                            <div className="popup-buttons">
                                <button type="submit">Save</button>
                                <button type="button" onClick={() => setShowPopup(false)}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MESSAGE */}
            <MessageHandlerModel messageInfo={message} type={messageType} onClear={() => setMessage("")} />

            {/* FRECCIA IN BASSO A DESTRA */}
            <div className="back-icon-container" onClick={() => navigate("/appointments")}>
                <i className="bi bi-arrow-left"></i>
            </div>
        </div>
    );
};

export default TakeAppointmentPage;
