const appointmentsModel = require("../models/Appointment");
const patientModel = require("../models/Patient");

const getAllAppointments = async (doctorID) => {
    try {
        return await appointmentsModel.find({ doctor: doctorID }).populate("patient").populate("doctor");
    } catch (error) {
        throw new Error("Errore durante il ricavo degli appointments del medico");
    }
};

const getAllAppointmentsDate = async (doctorID) => {
    try {
        const appointments = await appointmentsModel.find({ doctor: doctorID });
        return appointments.map(app => app.date); // solo le date
    } catch (error) {
        throw new Error("Errore durante il ricavo delle date");
    }
};

const getAllAppointmentsTime = async (doctorID) => {
    try {
        const appointments = await appointmentsModel.find({ doctor: doctorID });
        return appointments.map(app => app.time); // solo gli orari
    } catch (error) {
        throw new Error("Errore durante il ricavo degli orari");
    }
};

const takeNewAppointment = async (appointmentData, doctorID) => {

    if (!appointmentData.date || !appointmentData.time || !appointmentData.notes) {
        throw new Error("Tutti i campi sono obbligatori");
    }

    const newAppointments = new patientModel({
        ...appointmentData,
        doctor: doctorId
    });
    await newAppointments.save();
    return newAppointments;
}

module.exports = {
    getAllAppointments,
    getAllAppointmentsDate,
    getAllAppointmentsTime,
    takeNewAppointment
};
