import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import MessageHandlerModel from "../AtomicComponents/MessageHandlerModel.jsx";
import Header from "../AtomicComponents/Header.jsx";

const PatientListPage = () => {
    const [patients, setPatients] = useState([]);
    const [specificPatient, setSpecificPatient] = useState(null);
    const [showPopup, setShowPopup] = useState(false);

    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("success");

    const navigate = useNavigate();

    const handleAllPatient = async () => {
        try {
            const response = await axios.get('smartPhysio/patient', {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                }
            });
            setPatients(response.data);
        } catch (error) {
            console.error("Errore durante il recupero dei pazienti:", error);
        }
    };

    const openPopup = (patientId) => {
        setSpecificPatient(patientId);
        setShowPopup(true);
    };

    const confirmDelete = async () => {
        try {
            const token = localStorage.getItem("token");
            await axios.delete(`/smartPhysio/patient/${specificPatient}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            setMessage("Paziente eliminato con successo");
            setMessageType("success");

            setPatients(prev => prev.filter(p => p._id !== specificPatient));
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

    useEffect(() => {
        handleAllPatient();
    }, []);

    return (
        <div className="page-container" style={{ backgroundColor: '#ccf2ff', minHeight: '100vh' }}>
            {/* HEADER */}
            <Header />

            {/* TITOLO */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '80px', marginLeft: '80px', marginBottom: '30px' }}>
                <img src="/images/patient_blue.png" alt="Icon" style={{ height: '70px' }} />
                <h2 style={{ color: '#003344', fontWeight: 'bold' }}>Patient List</h2>
            </div>

            <ul style={{ listStyle: 'none', padding: '0 40px' }}>
                {patients.map((p) => (
                    <div key={p._id} style={{ display: 'flex', alignItems: 'center', marginBottom: '14px' }}>
                        {/* CESTINO FUORI */}
                        <i
                            className="bi bi-trash-fill"
                            style={{
                                color: 'red',
                                fontSize: '24px',
                                cursor: 'pointer',
                                marginRight: '16px'
                            }}
                            onClick={() => openPopup(p._id)}
                        />

                        {/* CONTENITORE PAZIENTE */}
                        <li
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                backgroundColor: '#e0f7fa',
                                padding: '10px 24px',
                                borderRadius: '16px',
                                border: '1.5px solid #003344',
                                transition: 'border 0.3s ease-in-out',
                                flex: 1
                            }}
                            onMouseEnter={e => e.currentTarget.style.border = '2px solid #0077cc'}
                            onMouseLeave={e => e.currentTarget.style.border = '1.5px solid #003344'}
                        >
                            {/* ICONA E NOME */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <img
                                    src={p.isCritical ? "/images/red_patient.png" : "/images/green_patient.png"}
                                    alt="User"
                                    style={{ height: '70px' }}
                                />
                                <span style={{ fontWeight: 'bold', fontSize: '18px', color: '#003344' }}>
            {p.name} {p.surname}
          </span>
                            </div>

                            {/* AZIONI */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '40px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}>
                                    <img src="/images/patient_details.png" alt="details" style={{ height: '50px' }} onClick={() => navigate(`/patient-details/${p._id}`)}/>
                                    <span style={{ fontSize: '13px', color: '#003344' }}>Patient details</span>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}>
                                    <img src="/images/session_registration.png" alt="register" style={{ height: '50px' }} />
                                    <span style={{ fontSize: '13px', color: '#003344' }}>Register session</span>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}>
                                    <img src="/images/session_list.png" alt="list" style={{ height: '50px' }} />
                                    <span style={{ fontSize: '13px', color: '#003344' }}>Session list</span>
                                </div>
                            </div>
                        </li>
                    </div>
                ))}
            </ul>


            {/* MODALE DI CONFERMA */}
            {showPopup && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100vw',
                    height: '100vh',
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        backgroundColor: '#fff',
                        color: 'black',
                        padding: '24px',
                        borderRadius: '12px',
                        width: '320px',
                        textAlign: 'center'
                    }}>
                        <h3>Confirm Deletion</h3>
                        <p>Are you sure you want to delete this patient? </p>
                        <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-around' }}>
                            <button onClick={confirmDelete} style={{ padding: '6px 16px', backgroundColor: 'red', color: 'white', border: 'none', borderRadius: '8px' }}>
                                Delete
                            </button>
                            <button onClick={() => setShowPopup(false)} style={{ padding: '6px 16px', borderRadius: '8px' }}>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ICONA HOME */}
            <i
                className="bi bi-house-door-fill"
                onClick={() => navigate("/doctor")}
                style={{
                    position: 'fixed',
                    bottom: '20px',
                    right: '20px',
                    fontSize: '32px',
                    color: '#003344',
                    cursor: 'pointer'
                }}
            />

            <MessageHandlerModel messageInfo={message} type={messageType} onClear={() => setMessage("")} />

        </div>

    );
};

export default PatientListPage;
