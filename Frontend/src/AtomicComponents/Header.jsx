// components/Header.jsx
import React from "react";
import "../AtomicComponentsCSS/HeaderStyle.css";
const Header = () => {
    return (
        <div className="shared-header">
            <img src="/images/app_logo.png" alt="Logo" className="shared-logo" />
            <div className="shared-user-info">
                <span>{localStorage.getItem("doctorName") || "Nome Cognome"}</span>
                <i className="bi bi-person-circle shared-user-icon"></i>
            </div>
        </div>
    );
};

export default Header;
