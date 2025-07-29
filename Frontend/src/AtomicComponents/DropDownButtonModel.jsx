import React, { useState, useRef, useEffect } from "react";
import "../AtomicComponentsCSS/DropDownButtonModel.css";

const DropDownButtonModel = ({ buttonText, items = [], onItemClick = () => {}, className = "" }) => {

    const [open, setOpen] = useState(false);
    const dropdownRef = useRef(null);

    const handleClickOutside = (event) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
            setOpen(false);
        }
    };

    useEffect(() => {
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className={`custom-dropdown ${className}`} ref={dropdownRef}>

            <button className="dropdown-toggle" onClick={() => setOpen(!open)}>
                {buttonText}
                <i className={`bi ${open ? "bi-caret-down-fill" : "bi-caret-right-fill"}`}></i>
            </button>

            {open && (
                <div className="dropdown-menu">
                    {items.map((item, idx) => {
                        const label = typeof item === "object" ? item.label : item;
                        return (
                            <div
                                key={idx}
                                className="dropdown-item"
                                onClick={() => {
                                    onItemClick(item);
                                    setOpen(false);
                                }}
                            >
                                {label}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default DropDownButtonModel;
