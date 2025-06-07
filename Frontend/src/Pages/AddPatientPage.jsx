import react, {useRef, useState} from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import TextFieldModel from "../AtomicComponents/TextFieldModel.jsx";
import React from "react";
import ButtonModel from "../AtomicComponents/ButtonModel.jsx";
import MessageHandlerModel from "../AtomicComponents/MessageHandlerModel.jsx";
import "../ComponentsCSS/AddPatientPageStyle.css";

const AddPatientPage = () => {
    const [name, setName] = useState("");
    const [surname, setSurname] = useState("");
    const [fiscalCode, setFiscalCode] = useState("");
    const [healthCardNumber, setHealthCardNumber] = useState("");
    const [medicalHistory, setMedicalHistory] = useState("");
    const [gender, setGender] = useState("");
    const [birthDate, setBirthDate] = useState("");

    const navigate = useNavigate();
    const birthDateRef = useRef(null);

    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("success");

    const handleAddPatient = async () =>{
        try{
            const token = localStorage.getItem("token");
            const response = await axios.post(
                "/smartPhysio/patient",
                {
                    name,
                    surname,
                    fiscalCode,
                    healthCardNumber,
                    gender,
                    medicalHistory,
                    birthDate,
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    }
                }
            );

            setMessage("Paziente aggiunto con successo");
            setMessageType("success");

            setTimeout(() =>{
                navigate("/doctor");
            },1000);
        }catch(error){
            setMessageType("error");

            const errorMsg =
                typeof error.response?.data === "string"
                    ? error.response.data
                    : error.response?.data?.message ||
                    error.response?.data?.error ||
                    "Errore durante la registrazione";

            setMessage(errorMsg);
        }
    }

    return (
        <div className="page-container">
            {/* HEADER */}
            <header style={{
                position: 'absolute',
                top: '30px',
                left: '0',
                width: '100%',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                padding: '0 40px',
                boxSizing: 'border-box'
            }}>
                {/* LOGO IN ALTO A SINISTRA */}
                <img
                    src="/images/app_logo.png"
                    alt="Logo"
                    style={{
                        height: '70px',
                        objectFit: 'contain',
                        marginTop: '0'
                    }}
                />

                {/* INFO UTENTE IN ALTO A DESTRA */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    fontWeight: 'bold',
                    fontSize: '16px',
                    color: '#003344',
                    marginTop: '0'
                }}>
                    <span>{localStorage.getItem("doctorName") || "Utente"}</span>
                    <i className="bi bi-person-circle" style={{ fontSize: '28px' }}></i>
                </div>
            </header>

            {/* MAIN FORM */}
            <div className="form-container">
                <div className="form-title">
                    <img src="/images/patient_blue.png" alt="Icona paziente" className="title-icon" />
                    <h2>Add new patience</h2>
                </div>
                <form className="form-grid">
                    <div className="input-block">
                        <label>Name</label>
                        <TextFieldModel placeholder="Insert name here..." value={name}
                                        onChange={(e) => setName(e.target.value)}/>
                    </div>

                    <div className="input-block">
                        <label>Surname</label>
                        <TextFieldModel placeholder="Insert surname here..." value={surname}
                                        onChange={(e) => setSurname(e.target.value)}/>
                    </div>

                    <div className="input-block">
                        <label>Fiscal code</label>
                        <TextFieldModel placeholder="Insert fiscal code here..." value={fiscalCode}
                                        onChange={(e) => setFiscalCode(e.target.value)}/>
                    </div>

                    <div className="input-block">
                        <label>Health card number</label>
                        <TextFieldModel placeholder="Insert Health card number here..." value={healthCardNumber}
                                        onChange={(e) => setHealthCardNumber(e.target.value)}/>
                    </div>

                    <div className="input-block">
                        <label>Medical history</label>
                        <textarea
                            placeholder="Insert Medical history here..."
                            value={medicalHistory}
                            onChange={(e) => setMedicalHistory(e.target.value)}
                        />
                    </div>

                    <div className="input-block">
                        <label htmlFor="birth-date">Data di nascita</label>
                        <div className="input-icon-wrapper">
                            <input
                                id="birth-date"
                                ref={birthDateRef}
                                type="date"
                                className="birth-date-input"
                                value={birthDate}
                                onChange={(e) => setBirthDate(e.target.value)}
                            />
                            <button
                                type="button"
                                className="calendar-button"
                                onClick={() =>
                                    birthDateRef.current?.showPicker?.() ||
                                    birthDateRef.current?.focus()
                                }
                            >
                                <i className="bi bi-calendar calendar-icon"></i>
                            </button>
                        </div>
                    </div>


                    <div className="input-block full-width">
                        <label htmlFor="gender-selection">Gender</label>
                        <div id="gender-selection" className="gender-options">
                            <label className="custom-radio">
                                <input
                                    type="radio"
                                    name="gender"
                                    value="Male"
                                    checked={gender === "Male"}
                                    onChange={() => setGender("Male")}
                                />
                                <span className="radio-circle"></span>
                                Male
                            </label>
                            <label className="custom-radio">
                                <input
                                    type="radio"
                                    name="gender"
                                    value="Female"
                                    checked={gender === "Female"}
                                    onChange={() => setGender("Female")}
                                />
                                <span className="radio-circle"></span>
                                Female
                            </label>
                        </div>
                    </div>


                </form>

                <div className="confirm-button-wrapper">
                    <ButtonModel buttonText={"Confirm"} onClick={handleAddPatient}/>
                </div>

                <MessageHandlerModel messageInfo={message} type={messageType} onClear={() => setMessage("")}/>
            </div>

            {/* ICONA HOME */}
            <i className="bi bi-house-door-fill bottom-icon" onClick={() => navigate("/doctor")}></i>

            <i
                className="bi bi-house-door-fill bottom-icon"
                onClick={() => navigate("/doctor")}
            />
        </div>
    );


}

export default AddPatientPage;
