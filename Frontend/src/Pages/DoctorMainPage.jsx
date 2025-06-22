import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import TextInfoModel from "../AtomicComponents/TextInfoModel.jsx";
import "../ComponentsCSS/DoctorMainPageStyle.css";
import Header from "../AtomicComponents/Header.jsx";
import { useTranslation } from "react-i18next";

const DoctorMainPage = () => {
    const [patientsNumber, setPatientsNumber] = useState();
    const [criticalPatientsNumber, setCriticalPatientsNumber] = useState();
    const [appointmentsNumber, setAppointmentsNumber] = useState();

    const navigate = useNavigate();
    const location = useLocation();
    const { t } = useTranslation();

    useEffect(() => {
        fetchPatientsNumber();
        fetchCriticalPatientsNumber();
        fetchAppointmentsNumber();
    }, [location]);

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
        try {
            const token = localStorage.getItem("token");
            const response = await axios.get("/smartPhysio/appointments", {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const todaysApp = response.data.filter(app => {
                const appDate = new Date(app.date);
                appDate.setHours(0, 0, 0, 0);
                return appDate.getTime() === today.getTime();
            });

            setAppointmentsNumber(todaysApp.length);
        } catch (error) {
            console.error("Errore nel recupero del numero di appuntamenti:", error);
        }
    };

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
            <Header />

            <div className="actions-row">
                <div onClick={() => navigate("/add-patient")} className="icon-box">
                    <img src="/images/add_patient.png" alt="Add" className="img-icon" />
                    <p>{t("ADD_NEW_PATIENT_MAIN_ICON")}</p>
                </div>
                <div onClick={() => navigate("/patients-list")} className="icon-box">
                    <img src="/images/patients_list.png" alt="List" className="img-icon" />
                    <p>{t("PATIENT_LIST_MAIN_ICON")}</p>
                </div>
                <div onClick={() => navigate("/appointments")} className="icon-box">
                    <img src="/images/calendar.png" alt="Appointments" className="img-icon" />
                    <p>{t("APPOINTMENTS_MAIN_ICON")}</p>
                </div>
            </div>

            <div className="summary-container">
                <div className="summary-row">
                    <div className="summary-box">
                        <img src="/images/dashBoard_calendar.png" alt="Appointments Today" className="summary-icon" />
                        <TextInfoModel textInfo={t("MAIN_TOTAL_APPOINTMENTS_TODAY")} className="dashboard-label" />
                        <TextInfoModel textInfo={appointmentsNumber} className="blue" />
                    </div>
                    <div className="summary-box">
                        <img src="/images/green_patient.png" alt="Active Patients" className="summary-icon" />
                        <TextInfoModel textInfo={t("MAIN_ACTIVE_PATIENT")} className="dashboard-label" />
                        <TextInfoModel textInfo={patientsNumber} className="green" />
                    </div>
                    <div className="summary-box">
                        <img src="/images/red_patient.png" alt="High Risk" className="summary-icon" />
                        <TextInfoModel textInfo={t("MAIN_PRIORITY_PATIENT")} className="dashboard-label" />
                        <TextInfoModel textInfo={criticalPatientsNumber} className="red" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DoctorMainPage;
