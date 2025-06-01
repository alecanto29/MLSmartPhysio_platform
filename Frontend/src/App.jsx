// App.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./Pages/loginPages/LoginPage.jsx";
import RegistrationPage from "./Pages/loginPages/RegistrationPage.jsx";
import DoctorMainPage from "./Pages/DoctorMainPage.jsx";

const App = () => {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Navigate to="/login" />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/registration" element={<RegistrationPage />} />
                <Route path="/doctor" element={<DoctorMainPage />} />
            </Routes>
        </Router>
    );
};

export default App;
