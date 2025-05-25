import React from "react";

const ButtonModel = ({ buttonText, onClick, className = "", disabled = false }) => {
    return (
        <button
            onClick={onClick}
            className={`btn ${className}`}
            disabled={disabled}
        >
            {buttonText}
        </button>
    );
};

export default ButtonModel;