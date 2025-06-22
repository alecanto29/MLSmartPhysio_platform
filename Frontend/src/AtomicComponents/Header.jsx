import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "../AtomicComponentsCSS/HeaderStyle.css";

const Header = () => {
    const { i18n } = useTranslation();
    const [showPopup, setShowPopup] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const navigate = useNavigate();
    const doctorName = localStorage.getItem("doctorName") || "Nome Cognome";

    const currentLang = i18n.language || "en";

    const changeLanguage = (lang) => {
        i18n.changeLanguage(lang);
        localStorage.setItem("language", lang);
        setDropdownOpen(false);
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("doctorName");
        navigate("/login");
    };

    const toggleDropdown = () => {
        setDropdownOpen(!dropdownOpen);
    };

    return (
        <>
            <div className="header-container">
                <img src="/images/app_logo.png" alt="Logo" className="header-logo" />

                <div className="header-actions">
                    <div className="header-user-info" onClick={() => setShowPopup(true)}>
                        <span>{doctorName}</span>
                        <i className="bi bi-person-circle header-user-icon"></i>
                    </div>

                    <div className="header-language-dropdown">
                        <div className="header-language-button" onClick={toggleDropdown}>
                            <img
                                src={currentLang === "it" ? "/images/it_icon.png" : "/images/en_icon.png"}
                                alt={currentLang}
                                className={`header-flag-icon ${currentLang === "en" ? "flag-scale" : ""}`}
                            />
                            <span className="header-lang-label">{currentLang.toUpperCase()}</span>
                        </div>

                        {dropdownOpen && (
                            <div className="header-language-menu">
                                <div className="header-lang-option" onClick={() => changeLanguage("it")}>
                                    <img src="/images/it_icon.png" alt="it" className="header-flag-icon" />
                                    <span className={currentLang === "it" ? "active-language" : ""}>IT</span>
                                </div>
                                <div className="header-lang-option" onClick={() => changeLanguage("en")}>
                                    <img src="/images/en_icon.png" alt="en" className="header-flag-icon" />
                                    <span className={currentLang === "en" ? "active-language" : ""}>EN</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {showPopup && (
                <div className="header-logout-overlay" onClick={() => setShowPopup(false)}>
                    <div className="header-logout-popup" onClick={(e) => e.stopPropagation()}>
                        <p className="header-logout-text">Vuoi davvero effettuare il logout dall'applicazione?</p>
                        <div className="header-logout-buttons">
                            <button className="header-cancel-btn" onClick={() => setShowPopup(false)}>Annulla</button>
                            <button className="header-confirm-btn" onClick={handleLogout}>Logout</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Header;
