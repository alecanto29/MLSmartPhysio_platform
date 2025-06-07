const appointmentsService = require("../services/AppointmentsService");

const getAllAppointments = async (req, res) => {
    try {
        await appointmentsService.deleteOldAppointments();
        const appointments = await appointmentsService.getAllAppointments(req.user.id);
        console.log("chiamata da frontend, numero appuntamenti:", appointments.length);
        res.status(200).json(appointments);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getAllAppointmentsDate = async (req, res) => {
    try {
        const appointments = await appointmentsService.getAllAppointmentsDate(req.user.id);
        res.status(200).json(appointments);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getAllAppointmentsTime = async (req, res) => {
    try {
        const appointments = await appointmentsService.getAllAppointmentsTime(req.user.id);
        res.status(200).json(appointments);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const takeNewAppointment = async (req, res) =>{
    try{
        const newAppointments = await appointmentsService.takeNewAppointment(req.body, req.user.id);
        res.status(200).json(newAppointments);
    }catch(error){
        res.status(500).json({ error: error.message });
    }
}

const deleteOldAppointments = async (req, res) => {
    try {
        await appointmentsService.deleteOldAppointments();
        return res.json({ message: "Appuntamenti vecchi cancellati con successo." });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};



module.exports = {
    getAllAppointments,
    getAllAppointmentsDate,
    getAllAppointmentsTime,
    takeNewAppointment,
    deleteOldAppointments
};
