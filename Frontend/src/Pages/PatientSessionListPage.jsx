import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import Header from "../AtomicComponents/Header.jsx";
import "../ComponentsCSS/PatientSessionListPage.css";
import MessageHandlerModel from "../AtomicComponents/MessageHandlerModel.jsx";

const PatientSessionListPage = () => {
    const [patientsSessions, setPatientsSessions] = useState([]);
    const [sessionToDelete, setSessionToDelete] = useState(null);
    const [showPopup, setShowPopup] = useState(false);
    const { id } = useParams();

    const navigate = useNavigate();

    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("success");

    const getPatientSessions = async () => {
        try {
            const response = await axios.get(`/smartPhysio/sessions/patient/${id}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`
                }
            });
            setPatientsSessions(response.data);
        } catch (error) {
            console.error("Errore nel caricamento delle sessioni:", error);
        }
    };

    const handleDownloadAllBySession = async (sessionId) => {
        try {
            const semgResponse = await axios.get(`/smartPhysio/semg/export/csv/${sessionId}`, {
                responseType: "blob"
            });
            downloadCSVFile(semgResponse.data, `sEMG_${sessionId}.csv`);

            const inertialResponse = await axios.get(`/smartPhysio/inertial/export/csv/${sessionId}`, {
                responseType: "blob"
            });
            downloadCSVFile(inertialResponse.data, `inertial_${sessionId}.csv`);
        } catch (error) {
            console.error(`Errore nel download della sessione ${sessionId}:`, error);
        }
    };

    const downloadCSVFile = (blobData, fileName) => {
        const url = URL.createObjectURL(blobData);
        const link = document.createElement("a");
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const deleteSession = async (sessionId) => {
        try {
            const sEMGdataResponse = await axios.delete(`/smartPhysio/semg/${sessionId}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`
                }
            });

            const inertialDataResponse = await axios.delete(`/smartPhysio/inertial/${sessionId}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`
                }
            });

            const response = await axios.delete(`/smartPhysio/sessions/${sessionId}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`
                }
            });

            setMessage("sessione eliminata con successo");
            setMessageType("success");
        }catch(error){
            setMessageType("error");

            const errorMsg =
                typeof error.response?.data === "string"
                    ? error.response.data
                    : error.response?.data?.message ||
                    error.response?.data?.error ||
                    "Errore durante la rimozione";

            setMessage(errorMsg);
        }
    }


    useEffect(() => {
        getPatientSessions();
    }, [id]);

    return (
        <div className="page-container">
            <Header />

            <div className="session-title">
                <img src="/images/patient_blue.png" alt="Session Icon" />
                <h2>Patient Session List</h2>
            </div>

            <ul className="session-list">
                {patientsSessions.map((session, index) => (
                    <div key={session._id || index} className="session-container">
                        {/* Icona cestino fuori dalla card */}
                        <i
                            className="bi bi-trash-fill trash-icon"
                            onClick={() => {
                                setSessionToDelete(session._id);
                                setShowPopup(true);
                            }}
                        />

                        {/* Card sessione */}
                        <li className="session-item">
                            <div className="session-info">
                                <img src="/images/session_list.png" alt="Session" />
                                <span>
                        Session {index + 1} - {new Date(session.date).toLocaleDateString("it-IT")}
                    </span>
                            </div>

                            <div className="session-actions">
                                <div
                                    className="action-block"
                                    onClick={() =>
                                        navigate(`/session/details/${session._id}`, {
                                            state: { patientId: session.patient._id }
                                        })
                                    }
                                >
                                    <img src="/images/patient_details.png" alt="Details" />
                                    <span>Session details</span>
                                </div>

                                <div className="action-block" onClick={() => navigate(`/session/analysis`)}>
                                    <img src="/images/session_analysis.png" alt="Analysis" />
                                    <span>Session analysis</span>
                                </div>

                                <div className="action-block" onClick={() => handleDownloadAllBySession(session._id)}>
                                    <img src="/images/download.png" alt="Download" />
                                    <span>Download session</span>
                                </div>
                            </div>
                        </li>
                    </div>
                ))}
            </ul>

            {/* 🔙 Freccia indietro */}
            <i className="bi bi-arrow-left back-icon" onClick={() => navigate("/patients-list")} />

            {/* 📩 Messaggi */}
            <MessageHandlerModel messageInfo={message} type={messageType} onClear={() => setMessage("")} />

            {/* 🧾 Popup conferma eliminazione */}
            {showPopup && (
                <div className="popup-overlay">
                    <div className="popup-content">
                        <h3>Conferma eliminazione</h3>
                        <p>Sei sicuro di voler eliminare questa sessione?</p>
                        <div className="popup-buttons">
                            <button
                                className="delete-btn"
                                onClick={async () => {
                                    await deleteSession(sessionToDelete);
                                    setPatientsSessions(prev => prev.filter(s => s._id !== sessionToDelete));
                                    setShowPopup(false);
                                    setSessionToDelete(null);
                                }}
                            >
                                Elimina
                            </button>
                            <button onClick={() => setShowPopup(false)}>Annulla</button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default PatientSessionListPage;
