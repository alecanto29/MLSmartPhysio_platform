import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import TextInfoModel from "../AtomicComponents/TextInfoModel.jsx";
import "../ComponentsCSS/DoctorMainPageStyle.css";


const DoctorMainPage = () => {
    const [patientsNumber, setPatientsNumber] = useState();
    const [criticalPatientsNumber, setCriticalPatientsNumber] = useState();
    const [appointmentsNumber, setAppointmentsNumber] = useState();

    const navigate = useNavigate();

    useEffect(() => {
        fetchPatientsNumber();
        fetchCriticalPatientsNumber();
        fetchAppointmentsNumber();
    }, []);

    const fetchPatientsNumber = async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await axios.get("/smartPhysio/patient", {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            setPatientsNumber(response.data.length);
        } catch (error) {
            console.error("Errore nel recupero pazienti:", error);
        }
    };

    const fetchAppointmentsNumber = async () => {
        try{
            const token = localStorage.getItem("token");
            const response = await axios.get("/smartPhysio/doctor/appointments", {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            setAppointmentsNumber(response.data.length);
        }catch(error){
            console.error("Errore nel recupero del numero di appuntamenti:", error);
        }

    }

    const fetchCriticalPatientsNumber = async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await axios.get("/smartPhysio/patient/critical", {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            setCriticalPatientsNumber(response.data.length);
        } catch (error) {
            console.error("Errore nel recupero pazienti critici:", error);
        }
    };


    return (
        <div className="main-dashboard">
            <div className="header">
                <img src="/images/app_logo.png" alt="Logo" className="logo-img" />
                <div className="user-info">
                    <span>{localStorage.getItem("doctorName") || "Nome Cognome"}</span>
                    <i className="bi bi-person-circle user-icon"></i>
                </div>
            </div>

            <div className="actions-row">
                <div onClick={() => navigate("/add-patient")} className="icon-box">
                    <img src="/images/add_patient.png" alt="Add" className="img-icon" />
                    <p>Add New Patient</p>
                </div>
                <div onClick={() => navigate("/patients")} className="icon-box">
                    <img src="/images/patients_list.png" alt="List" className="img-icon" />
                    <p>Patient List</p>
                </div>
                <div onClick={() => navigate("/appointments")} className="icon-box">
                    <img src="/images/calendar.png" alt="Appointments" className="img-icon" />
                    <p>Appointments</p>
                </div>
            </div>

            <div className="summary-row">
                <div className="summary-box">
                    <img src="/images/dashBoard_calendar.png" alt="Appointments Today" className="summary-icon" />

                    <TextInfoModel textInfo={"Total appointments today"} className="dashboard-label" />
                    <TextInfoModel textInfo={appointmentsNumber} className="blue" />
                </div>
                <div className="summary-box">
                    <img src="/images/green_patient.png" alt="Active Patients" className="summary-icon" />
                    <TextInfoModel textInfo={"Active patients"} className="dashboard-label" />

                    <TextInfoModel textInfo={patientsNumber} className="green" />
                </div>
                <div className="summary-box">
                    <img src="/images/red_patients.png" alt="High Risk" className="summary-icon" />
                    <TextInfoModel textInfo={"High-risk patients"} className="dashboard-label" />

                    <TextInfoModel textInfo={criticalPatientsNumber} className="red" />
                </div>
            </div>
        </div>
    );
};

export default DoctorMainPage;
