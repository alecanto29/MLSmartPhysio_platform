import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import Header from "../AtomicComponents/Header.jsx";
import "../ComponentsCSS/PatientSessionListPage.css";
import MessageHandlerModel from "../AtomicComponents/MessageHandlerModel.jsx";
import i18n from "i18next";
import {useTranslation} from "react-i18next";

const PatientSessionListPage = () => {
    const [patientsSessions, setPatientsSessions] = useState([]);
    const [sessionToDelete, setSessionToDelete] = useState(null);
    const [showPopup, setShowPopup] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const { id } = useParams();

    const navigate = useNavigate();
    const { t } = useTranslation();

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
            await axios.delete(`/smartPhysio/semg/${sessionId}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
            });

            await axios.delete(`/smartPhysio/inertial/${sessionId}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
            });

            await axios.delete(`/smartPhysio/sessions/${sessionId}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
            });

            setMessage(t("DELETE_SESSION"));
            setMessageType("success");

            setPatientsSessions((prev) => prev.filter((s) => s._id !== sessionId));
        } catch (error) {
            setMessageType("error");
            const errorMsg =
                typeof error.response?.data === "string"
                    ? error.response.data
                    : error.response?.data?.message ||
                    error.response?.data?.error ||
                    "Errore durante la rimozione";
            setMessage(errorMsg);
        }
    };

    useEffect(() => {
        getPatientSessions();
    }, [id]);

    const numberedSessions = patientsSessions.map((session, index) => ({
        ...session,
        sessionNumber: index + 1,
    }));

    const filteredSessions = numberedSessions.filter((session) => {
        const dateStr = new Date(session.date).toLocaleDateString("it-IT");
        const sessionStr = `Session ${session.sessionNumber}`;
        return (
            sessionStr.toLowerCase().includes(searchTerm.toLowerCase()) ||
            dateStr.includes(searchTerm) ||
            session.sessionNumber.toString() === searchTerm
        );
    });

    return (
        <div className="page-container">
            <Header />

            <div className="title-container">
                <img src="/images/patient_blue.png" alt="Session Icon" className="title-icon" />
                <h2 className="title-text">{t("PATIENT_SESSION_LIST_TITLE")}</h2>
            </div>

            <div className="search-wrapper">
                <div className="search-input-container">
                    <i className="bi bi-search search-icon"></i>
                    <input
                        type="text"
                        placeholder={t("SEARCH_BAR_CONTENT_SESSION")}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="scrollable">
                {filteredSessions.length === 0 ? (
                    <div style={{ textAlign: "center", color: "#003344", fontWeight: "bold", padding: "20px" }}>
                        {t("NOT_FOUND_SESSION")}
                    </div>
                ) : (
                    <ul className="session-list">
                        {filteredSessions.map((session, index) => (
                            <div key={session._id || index} className="card-row">
                                <i
                                    className="bi bi-trash-fill delete-icon"
                                    onClick={() => {
                                        setSessionToDelete(session._id);
                                        setShowPopup(true);
                                    }}
                                />
                                <li className="card-item">
                                    <div className="card-left">
                                        <img src="/images/session_list.png" alt="Session" />
                                        <span className="card-name">
                                            {t("SESSION")} {session.sessionNumber} - {new Date(session.date).toLocaleDateString("it-IT")}
                                        </span>
                                    </div>

                                    <div className="card-right">
                                        <div
                                            className="card-action"
                                            onClick={() =>
                                                navigate(`/session/details/${session._id}`, {
                                                    state: { patientId: session.patient._id }
                                                })
                                            }
                                        >
                                            <img src="/images/patient_details.png" alt="Details" />
                                            <span>{t("SESSION_DETAILS_ICON")}</span>
                                        </div>

                                        <div className="card-action" onClick={() => navigate(`/session/analysis`)}>
                                            <img src="/images/session_analysis.png" alt="Analysis" />
                                            <span>{t("SESSION_ANALYSIS")}</span>
                                        </div>

                                        <div className="card-action" onClick={() => handleDownloadAllBySession(session._id)}>
                                            <img src="/images/download.png" alt="Download" />
                                            <span>{t("DOWNLOAD_SESSION")}</span>
                                        </div>
                                    </div>
                                </li>
                            </div>
                        ))}
                    </ul>
                )}
            </div>

            <i className="bi bi-arrow-left back-icon" onClick={() => navigate("/patients-list")} />

            <MessageHandlerModel messageInfo={message} type={messageType} onClear={() => setMessage("")} />

            {showPopup && (
                <div className="popup-overlay">
                    <div className="popup-content">
                        <h3>{t("DELETE_POPUP_TITLE")}</h3>
                        <p>{t("SESSION_DELETE_POPUP_MESSAGE")}</p>
                        <div className="popup-buttons">
                            <button
                                className="btn-delete"
                                onClick={async () => {
                                    await deleteSession(sessionToDelete);
                                    setShowPopup(false);
                                    setSessionToDelete(null);
                                }}
                            >
                                {t("DELETE_POPUP_DELETE")}
                            </button>
                            <button className="btn-close" onClick={() => setShowPopup(false)}>{t("DELETE_POPUP_CLOSE")}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PatientSessionListPage;
