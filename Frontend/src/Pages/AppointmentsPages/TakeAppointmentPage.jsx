import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../../ComponentsCSS/TakeAppointmentPageStyle.css";

const TakeAppointmentPage = () => {
    const [patients, setPatients] = useState([]);
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

    return (
        <div className="page-container">
            {/* HEADER */}
            <header className="header">
                <img src="/images/app_logo.png" alt="Logo" className="logo" />
                <div className="user-info">
                    <span>{localStorage.getItem("doctorName") || "Utente"}</span>
                    <i className="bi bi-person-circle user-icon"></i>
                </div>
            </header>

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
                        <div className="patient-right" onClick={() => navigate(`/take-appointment/${p._id}`)}>
                            <img src="/images/calendar_v2.png" alt="Calendar icon" className="calendar-mini" />
                            <span className="take-label">Take new appointment</span>
                        </div>
                    </li>
                ))}
            </ul>

            {/* ICONA HOME */}
            <i className="bi bi-house-door-fill home-button" onClick={() => navigate("/doctor")}></i>
        </div>
    );
};

export default TakeAppointmentPage;
