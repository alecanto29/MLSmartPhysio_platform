import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../AtomicComponentsCSS/HeaderStyle.css";

const Header = () => {
    const [showPopup, setShowPopup] = useState(false);
    const navigate = useNavigate();
    const doctorName = localStorage.getItem("doctorName") || "Nome Cognome";

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("doctorName");
        navigate("/login");
    };

    return (
        <>
            <div className="shared-header">
                <img src="/images/app_logo.png" alt="Logo" className="shared-logo" />
                <div className="shared-user-info" onClick={() => setShowPopup(true)}>
                    <span>{doctorName}</span>
                    <i className="bi bi-person-circle shared-user-icon"></i>
                </div>
            </div>

            {showPopup && (
                <div className="logout-popup-overlay" onClick={() => setShowPopup(false)}>
                    <div className="logout-popup" onClick={(e) => e.stopPropagation()}>
                        <p className="logout-popup-text">Vuoi davvero effettuare il logout dall'applicazione?</p>
                        <div className="logout-popup-buttons">
                            <button className="cancel-button" onClick={() => setShowPopup(false)}>
                                Annulla
                            </button>
                            <button className="confirm-button" onClick={handleLogout}>
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Header;
