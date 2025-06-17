import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import MessageHandlerModel from "../AtomicComponents/MessageHandlerModel.jsx";
import Header from "../AtomicComponents/Header.jsx";
import "../ComponentsCSS/PatientListPageStyle.css";

const PatientListPage = () => {
    const [patients, setPatients] = useState([]);
    const [filteredPatients, setFilteredPatients] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [specificPatient, setSpecificPatient] = useState(null);
    const [showPopup, setShowPopup] = useState(false);
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("success");

    const navigate = useNavigate();

    const handleAllPatient = async () => {
        try {
            const response = await axios.get("smartPhysio/patient", {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            });
            setPatients(response.data);
            setFilteredPatients(response.data);
        } catch (error) {
            console.error("Errore durante il recupero dei pazienti:", error);
        }
    };

    const openPopup = (patientId) => {
        setSpecificPatient(patientId);
        setShowPopup(true);
    };

    const createSession = async (patientId) => {
        try {
            const token = localStorage.getItem("token");

            const response = await axios.post(
                "/smartPhysio/sessions",
                {
                    patient: patientId,
                    time: new Date().toISOString(),
                    data: [],
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const sessionId = response.data._id;
            localStorage.setItem("activeSessionId", sessionId);

            setMessage("Sessione creata con successo");
            setMessageType("success");
            navigate(`/session/${sessionId}`);
        } catch (error) {
            setMessageType("error");

            const errorMsg =
                typeof error.response?.data === "string"
                    ? error.response.data
                    : error.response?.data?.message ||
                    error.response?.data?.error ||
                    "Errore durante la creazione della sessione";

            setMessage(errorMsg);
        }
    };

    const confirmDelete = async () => {
        try {
            const token = localStorage.getItem("token");
            await axios.delete(`/smartPhysio/patient/${specificPatient}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            setMessage("Paziente eliminato con successo");
            setMessageType("success");

            setPatients((prev) => prev.filter((p) => p._id !== specificPatient));
            setFilteredPatients((prev) => prev.filter((p) => p._id !== specificPatient));
            setShowPopup(false);
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

    const handleSearch = (input) => {
        setSearchTerm(input);
        const lower = input.toLowerCase();
        const filtered = patients.filter((p) =>
            p.name.toLowerCase().includes(lower) ||
            p.surname.toLowerCase().includes(lower) ||
            new Date(p.birthDate).toLocaleDateString("it-IT").includes(lower) ||
            p.fiscalCode.toLowerCase().includes(lower)
        );
        setFilteredPatients(filtered);
    };

    useEffect(() => {
        handleAllPatient();
    }, []);

    return (
        <div className="page-container">
            <Header />

            <div className="title-container">
                <img src="/images/patient_blue.png" alt="Icon" className="title-icon" />
                <h2 className="title-text">Patient List</h2>
            </div>

            {/* Input di ricerca */}
            <div className="search-wrapper">
                <div className="search-input-container">
                    <i className="bi bi-search search-icon"></i>
                    <input
                        type="text"
                        placeholder="Search by name, surname..."
                        value={searchTerm}
                        onChange={(e) => handleSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="scrollable patient-scroll">
                <ul className="patient-list">
                    {filteredPatients.length === 0 ? (
                        <p style={{ textAlign: 'center', color: '#003344' }}>No patients found.</p>
                    ) : (
                        filteredPatients.map((p) => (
                            <div key={p._id} className="card-row">
                                <i className="bi bi-trash-fill delete-icon" onClick={() => openPopup(p._id)} />
                                <li className="card-item">
                                    <div className="card-left">
                                        <img
                                            src={p.isCritical ? "/images/red_patient.png" : "/images/green_patient.png"}
                                            alt="User"
                                        />
                                        <div className="card-details">
                                            <div className="card-name">{p.name} {p.surname}</div>
                                            <div className="card-birthdate">{new Date(p.birthDate).toLocaleDateString("it-IT")}</div>
                                            <div className="card-fiscalcode">{p.fiscalCode}</div>
                                        </div>
                                    </div>
                                    <div className="card-right">
                                        <div className="card-action" onClick={() => navigate(`/patient-details/${p._id}`)}>
                                            <img src="/images/patient_details.png" alt="details" />
                                            <span>Patient details</span>
                                        </div>
                                        <div className="card-action" onClick={() => createSession(p._id)}>
                                            <img src="/images/session_registration.png" alt="register" />
                                            <span>Register session</span>
                                        </div>
                                        <div className="card-action" onClick={() => navigate(`/patient-session/${p._id}`)}>
                                            <img src="/images/session_list.png" alt="list" />
                                            <span>Session list</span>
                                        </div>
                                    </div>
                                </li>
                            </div>
                        ))
                    )}
                </ul>
            </div>

            {showPopup && (
                <div className="popup-overlay">
                    <div className="popup-content">
                        <h3>Confirm Deletion</h3>
                        <p>Are you sure you want to delete this patient?</p>
                        <div className="popup-buttons">
                            <button className="btn-delete" onClick={confirmDelete}>Delete</button>
                            <button className="btn-close" onClick={() => setShowPopup(false)}>Close</button>
                        </div>
                    </div>
                </div>
            )}

            <i className="bi bi-house-door-fill home-icon" onClick={() => navigate("/doctor")} />

            <MessageHandlerModel
                messageInfo={message}
                type={messageType}
                onClear={() => setMessage("")}
            />
        </div>
    );
};

export default PatientListPage;
