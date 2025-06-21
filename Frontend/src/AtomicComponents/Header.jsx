import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../AtomicComponentsCSS/HeaderStyle.css";

const Header = () => {
    const [showPopup, setShowPopup] = useState(false);
    const [language, setLanguage] = useState(localStorage.getItem("language") || "en");
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const navigate = useNavigate();
    const doctorName = localStorage.getItem("doctorName") || "Nome Cognome";

    useEffect(() => {
        localStorage.setItem("language", language);
    }, [language]);

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("doctorName");
        navigate("/login");
    };

    const toggleDropdown = () => {
        setDropdownOpen(!dropdownOpen);
    };

    const selectLanguage = (lang) => {
        setLanguage(lang);
        setDropdownOpen(false);
    };

    return (
        <>
            <div className="shared-header">
                <img src="/images/app_logo.png" alt="Logo" className="shared-logo" />

                <div className="shared-user-actions">
                    <div className="custom-language-dropdown">
                        <div className="selected-language" onClick={toggleDropdown}>
                            {language === "it" ? "🇮🇹 Italiano" : "🇬🇧 English"}
                        </div>
                        {dropdownOpen && (
                            <div className="language-options">
                                <div onClick={() => selectLanguage("it")}>🇮🇹 Italiano</div>
                                <div onClick={() => selectLanguage("en")}>🇬🇧 English</div>
                            </div>
                        )}
                    </div>

                    <div className="shared-user-info" onClick={() => setShowPopup(true)}>
                        <span>{doctorName}</span>
                        <i className="bi bi-person-circle shared-user-icon"></i>
                    </div>
                </div>
            </div>

            {showPopup && (
                <div className="logout-popup-overlay" onClick={() => setShowPopup(false)}>
                    <div className="logout-popup" onClick={(e) => e.stopPropagation()}>
                        <p className="logout-popup-text">
                            Vuoi davvero effettuare il logout dall'applicazione?
                        </p>
                        <div className="logout-popup-buttons">
                            <button className="cancel-button" onClick={() => setShowPopup(false)}>Annulla</button>
                            <button className="confirm-button" onClick={handleLogout}>Logout</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Header;
