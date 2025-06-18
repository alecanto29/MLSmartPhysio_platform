const appointmentsModel = require("../models/Appointment");
const doctorModel = require ("../models/Doctor");
const patientModel = require("../models/Patient");

const getAllAppointments = async (doctorID) => {
    try {
        const results = await appointmentsModel.find({ doctor: doctorID }).populate("patient").populate("doctor");
        return results;
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
    const { date, time, notes, specificPatient } = appointmentData;

    if (!date || !time || !notes) {
        throw new Error("Tutti i campi sono obbligatori");
    }

    const [year, month, day] = date.split("-");
    const [hours, minutes] = time.split(":");

    const appointmentDateTime = new Date(
        year,
        month - 1,
        day,
        hours,
        minutes
    );

    const now = new Date();

    if (appointmentDateTime.getTime() < now.getTime()) {
        throw new Error("Impostare una data e ora valida");
    }

    const newAppointment = new appointmentsModel({
        date,
        time,
        notes,
        patient: specificPatient,
        doctor: doctorID
    });

    await newAppointment.save();

    await doctorModel.findByIdAndUpdate(doctorID, {
        $push: { appointments: newAppointment._id }
    });

    await patientModel.findByIdAndUpdate(specificPatient, {
        $push: { appointments: newAppointment._id }
    });

    return newAppointment;
};



const deleteOldAppointments = async () => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        await appointmentsModel.deleteMany({ date: { $lt: today } });

    } catch (err) {
        console.error("Errore durante la cancellazione degli appuntamenti vecchi:", err);
    }
};

const deleteAppointmentById = async (doctorID, appointmentID) => {
    // Trova l'appuntamento per sapere a quale paziente è associato
    const appointment = await appointmentsModel.findOne({ _id: appointmentID, doctor: doctorID });
    if (!appointment) {
        throw new Error("Appuntamento non trovato o non autorizzato");
    }

    const patientID = appointment.patient;

    await appointmentsModel.deleteOne({ _id: appointmentID });

    await doctorModel.findByIdAndUpdate(doctorID, {
        $pull: { appointments: appointmentID }
    });

    await patientModel.findByIdAndUpdate(patientID, {
        $pull: { appointments: appointmentID }
    });

    return { success: true };
};



module.exports = {
    getAllAppointments,
    getAllAppointmentsDate,
    getAllAppointmentsTime,
    takeNewAppointment,
    deleteOldAppointments,
    deleteAppointmentById
};
