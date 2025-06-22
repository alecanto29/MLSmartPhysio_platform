const appointmentsService = require("../services/AppointmentsService");

const getAllAppointments = async (req, res) => {
    try {
        await appointmentsService.deleteOldAppointments();
        const appointments = await appointmentsService.getAllAppointments(req.user.id);
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
        const lang = req.language || 'en';
        const newAppointments = await appointmentsService.takeNewAppointment(req.body, req.user.id, lang);
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

const deleteAppointmentById = async (req, res) => {
    try{
        const deletedAppointments = await appointmentsService.deleteAppointmentById(req.user.id, req.params.id);
        if (deletedAppointments.deletedCount === 0) {
            return res.status(404).json({ error: "Appuntamento non trovata o già eliminata" });
        }
        res.status(200).json({ message: "Appuntamento eliminato con successo" });
    }catch(error){
        return res.status(500).json("Appuntamento eliminato con successo")
    }

}




module.exports = {
    getAllAppointments,
    getAllAppointmentsDate,
    getAllAppointmentsTime,
    takeNewAppointment,
    deleteOldAppointments,
    deleteAppointmentById
};
