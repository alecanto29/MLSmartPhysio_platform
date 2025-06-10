// App.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./Pages/loginPages/LoginPage.jsx";
import RegistrationPage from "./Pages/loginPages/RegistrationPage.jsx";
import DoctorMainPage from "./Pages/DoctorMainPage.jsx";
import AddPatientPage from "./Pages/AddPatientPage.jsx";
import AppointmentCalendar from "./Pages/AppointmentsPages/AppointmentsListPage.jsx";
import TakeAppointmentPage from "./Pages/AppointmentsPages/TakeAppointmentPage.jsx";
import PatientListPage from "./Pages/PatientListPage.jsx";
import PatientDetailsPage from "./Pages/PatientDetailsPage.jsx";
import ConnectionGateModel from "./Pages/SessionPages/ConnectionGateModel.jsx";

const App = () => {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Navigate to="/login" />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/registration" element={<RegistrationPage />} />
                <Route path="/doctor" element={<DoctorMainPage />} />
                <Route path="/add-patient" element={<AddPatientPage />} />
                <Route path="/appointments" element={<AppointmentCalendar />} />
                <Route path="/takeappointments" element={<TakeAppointmentPage />} />
                <Route path="/patients-list" element={<PatientListPage />} />
                <Route path="/patient-details/:id" element={<PatientDetailsPage />} />
                <Route path="/session/:id" element={<ConnectionGateModel />} />
            </Routes>
        </Router>
    );
};

export default App;
