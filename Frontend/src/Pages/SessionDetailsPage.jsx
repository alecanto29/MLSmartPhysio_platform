import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import "../ComponentsCSS/SessionDetailsPageStyle.css";
import MessageHandlerModel from "../AtomicComponents/MessageHandlerModel.jsx";
import Header from "../AtomicComponents/Header.jsx";
import i18n from "i18next";
import { useTranslation } from "react-i18next";

const SessionDetailsPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { t } = useTranslation();

    const [session, setSession] = useState(null);
    const [editedNotes, setEditedNotes] = useState(""); // NOTE separate
    const [isEditMode, setIsEditMode] = useState(false);
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("success");
    const [patientId, setPatientId] = useState(location.state?.patientId);

    useEffect(() => {
        fetchSessionDetails();
    }, []);

    const fetchSessionDetails = async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await axios.get(`/smartPhysio/sessions/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setSession(response.data);
            setEditedNotes(response.data.notes); // copia iniziale
        } catch (error) {
            console.error("Errore durante il recupero dei dati della sessione");
        }
    };

    const updateSessionDetails = async () => {
        try {
            const token = localStorage.getItem("token");
            const payload = { notes: editedNotes }; // invia solo le note modificate

            await axios.put(`/smartPhysio/sessions/${id}`, payload, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Accept-Language": i18n.language,
                },
            });

            setSession({ ...session, notes: editedNotes }); // aggiorna visivamente
            setMessage(t("UPDATE_SESSION"));
            setMessageType("success");
            setIsEditMode(false);
        } catch (error) {
            console.error("Errore nel PUT:", error);
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

    useEffect(() => {
        if (!patientId && session?.patient?._id) {
            setPatientId(session.patient._id);
        }
    }, [session]);

    if (!session) return <p className="session-loading">Caricamento in corso...</p>;

    return (
        <div className="session-page-container">
            <Header />

            <div className="session-title-section">
                <img src="/images/session_list.png" alt="icon" className="session-title-icon" />
                <h2 className="session-title-text">{t("SESSION_DETAILS_TITLE")}</h2>
            </div>

            <div className="session-box">
                <div className="session-edit-icon" onClick={() => setIsEditMode(!isEditMode)}>
                    <img src="/images/update_icon.png" alt="Edit" className="session-gear-image" />
                </div>

                <div className="session-info-grid">
                    <div className="session-left">
                        <div className="session-field">
                            <strong>{t("PATIENT")}:</strong>
                            <span>{session.patient.name} {session.patient.surname}</span>
                        </div>
                        <div className="session-field">
                            <strong>{t("DOCTOR")}:</strong>
                            <span>{session.doctor.name} {session.doctor.surname}</span>
                        </div>
                        <div className="session-field">
                            <strong>{t("DATE")}:</strong>
                            <span>{new Date(session.date).toLocaleDateString()}</span>
                        </div>
                    </div>

                    <div className="session-right">
                        <div className="session-field">
                            <strong>{t("NOTE")}:</strong>
                            {isEditMode ? (
                                <textarea
                                    name="notes"
                                    value={editedNotes}
                                    onChange={(e) => setEditedNotes(e.target.value)}
                                    className="session-notes-input"
                                />
                            ) : (
                                <div className="session-notes-display scrollable-notes">
                                    {session.notes}
                                </div>
                            )}
                        </div>

                        {isEditMode && (
                            <div className="session-save-section">
                                <button className="session-save-button" onClick={updateSessionDetails}>
                                    {t("SAVE_CHANGES_BUTTON")}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div
                className="session-back-icon"
                onClick={() => navigate(`/patient-session/${patientId}`)}
            >
                <i className="bi bi-arrow-left"></i>
            </div>

            <MessageHandlerModel
                messageInfo={message}
                type={messageType}
                onClear={() => setMessage("")}
            />
        </div>
    );
};

export default SessionDetailsPage;
