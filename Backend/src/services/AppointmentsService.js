const appointmentsModel = require("../models/Appointment");


const getAllAppointments = async (doctorID) => {
    try {
        console.log("entrata nel service");
        const results = await appointmentsModel.find({ doctor: doctorID }).populate("patient").populate("doctor");
        console.log("chiamata da controller, numero appuntamenti:", results.length);
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

    // Parsing sicuro della data e ora
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
    return newAppointment;
};




const deleteOldAppointments = async () => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        await appointmentsModel.deleteMany({ date: { $lt: today } });

        console.log("Appuntamenti vecchi cancellati con successo.");
    } catch (err) {
        console.error("Errore durante la cancellazione degli appuntamenti vecchi:", err);
    }
};

module.exports = {
    getAllAppointments,
    getAllAppointmentsDate,
    getAllAppointmentsTime,
    takeNewAppointment,
    deleteOldAppointments
};
