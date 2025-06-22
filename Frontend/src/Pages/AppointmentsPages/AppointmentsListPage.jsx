import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import axios from 'axios';
import { Paper, Typography, Button, IconButton, GlobalStyles } from '@mui/material';
import Header from "../../AtomicComponents/Header.jsx";
import MessageHandlerModel from "../../AtomicComponents/MessageHandlerModel.jsx";
import DeleteIcon from '@mui/icons-material/Delete';
import { useTranslation } from "react-i18next";
import i18n from "i18next";

const AppointmentCalendar = () => {
    const [events, setEvents] = useState([]);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const navigate = useNavigate();
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("success");
    const { t } = useTranslation();
    useEffect(() => {
        fetchAppointments();
    }, []);

    const fetchAppointments = () => {
        axios.get('smartPhysio/appointments', {
            headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`
            }
        })
            .then(res => {
                const transformed = res.data.map(app => {
                    const name = app.patient?.name || '';
                    const surname = app.patient?.surname || '';
                    return {
                        id: app._id,
                        title: (name + ' ' + surname).trim() || 'Appuntamento',
                        start: `${app.date.split("T")[0]}T${app.time}`,
                        end: `${app.date.split("T")[0]}T${add30Min(app.time)}`,
                        extendedProps: {
                            patient: app.patient,
                            date: app.date.split("T")[0],
                            time: app.time,
                            notes: app.notes
                        }
                    };
                });
                setEvents(transformed);
            })
            .catch(err => console.error(err));
    };

    const add30Min = (time) => {
        const [h, m] = time.split(':');
        const date = new Date();
        date.setHours(parseInt(h), parseInt(m) + 30);
        return date.toTimeString().slice(0, 5);
    };

    const deleteAppointment = async (id) => {
        try {
            await axios.delete("smartPhysio/appointments/" + id, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                    "Accept-Language": i18n.language
                }
            });

            setMessage(t("DELETED_APPOINTMENTS"));
            setMessageType("success");

            setEvents(prev => prev.filter(e => e.id !== id));
            setIsDialogOpen(false);
        } catch (error) {
            setMessageType("error");
            setMessage("Errore durante l'eliminazione dell'appuntamento");
        }
    };

    const renderEventContent = (arg) => {
        const { event } = arg;
        return (
            <div style={{ position: 'relative', paddingRight: '20px' }}>
                <div>{event.startStr.slice(11, 16)} - {event.endStr.slice(11, 16)}</div>
                <div>{event.title}</div>
                <div
                    onClick={(e) => {
                        e.stopPropagation();
                        setSelectedEvent(event);
                        setIsDialogOpen(true);
                    }}
                    style={{
                        position: 'absolute',
                        top: '12px',
                        right: '4px',
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        backgroundColor: '#fff',
                        color: '#003344',
                        fontWeight: 'bold',
                        fontSize: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 0 4px rgba(0,0,0,0.2)',
                        cursor: 'pointer',
                        zIndex: 10
                    }}
                    title="View details"
                >
                    i
                </div>
            </div>
        );
    };

    return (
        <div className="page-container" style={{ backgroundColor: '#ccf2ff', height: '100vh', overflow: 'hidden', position: 'relative' }}>
            <GlobalStyles styles={{
                html: { height: '100%', overflow: 'hidden' },
                body: { height: '100%', overflow: 'hidden', margin: 0, padding: 0 },
                '#root': { height: '100%', overflow: 'hidden' },
                '.page-container': { height: '100%', overflow: 'hidden' },
                '.fc-button': {
                    backgroundColor: '#003344',
                    border: 'none',
                    color: '#fff',
                    fontWeight: 'bold',
                },
                '.fc-button:hover': {
                    backgroundColor: '#002233',
                },
                '.fc-col-header-cell-cushion': {
                    color: '#003344',
                    fontWeight: 'bold',
                },
                '.fc-toolbar-title': {
                    color: '#003344',
                    fontWeight: 'bold',
                },
                '.fc-scroller': {
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                },
                '.fc-scroller::-webkit-scrollbar': {
                    display: 'none',
                },
                '.fc-day-today': {
                    backgroundColor: '#ffebee !important',
                },
                '.fc-timegrid-slot': {
                    height: '60px !important',
                },
                '.fc-timegrid-event': {
                    width: '101% !important',
                    margin: '0 auto',
                },
                '.fc-event': {
                    height: '200% !important',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    padding: '5px 12px',
                    fontSize: '0.85rem',
                },
                '.fc-event-title': {
                    whiteSpace: 'normal',
                    overflowWrap: 'break-word',
                }
            }} />

            <Header />

            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                marginLeft: '80px',
                marginTop: '70px',
                marginBottom: '15px'
            }}>
                <img
                    src="/images/calendar.png"
                    alt="Calendar Icon"
                    style={{ height: '70px' }}
                />
                <Typography
                    variant="h4"
                    fontWeight="bold"
                    color="#003344"
                    style={{ fontSize: '1.8rem' }}
                >
                    {t("APPOINTMENTS_TITLE")}

                </Typography>
            </div>

            <Paper
                elevation={4}
                sx={{
                    p: 3,
                    borderRadius: '24px',
                    backgroundColor: '#f9f9f9',
                    maxWidth: '1200px',
                    width: '100%',
                    margin: '0 auto',
                    boxShadow: '0 6px 24px rgba(0, 0, 0, 0.08)',
                    flexGrow: 1,
                    overflow: 'hidden'
                }}
            >
                <FullCalendar
                    plugins={[timeGridPlugin, interactionPlugin]}
                    initialView="timeGridWeek"
                    allDaySlot={false}
                    slotMinTime="08:00:00"
                    slotMaxTime="20:00:00"
                    slotDuration="01:00:00"
                    height={450}
                    events={events}
                    headerToolbar={{
                        left: 'prev,next today',
                        center: 'title',
                        right: 'timeGridDay,timeGridWeek'
                    }}
                    dayHeaderFormat={{ weekday: 'short', month: 'numeric', day: 'numeric' }}
                    eventClick={(info) => {
                        setSelectedEvent(info.event);
                        setIsDialogOpen(true);
                    }}
                    eventContent={renderEventContent}
                />

                <Button
                    variant="contained"
                    onClick={() => navigate('/takeappointments')}
                    sx={{
                        mt: 4,
                        display: 'block',
                        marginLeft: 'auto',
                        marginRight: 'auto',
                        paddingX: 4,
                        paddingY: 1.5,
                        borderRadius: '30px',
                        textTransform: 'none',
                        fontWeight: 'bold',
                        backgroundColor: '#003344',
                        '&:hover': {
                            backgroundColor: '#002233',
                        }
                    }}
                >

                    {t("TAKE_NEW_APPOINTMENT_BUTTON")}
                </Button>
            </Paper>

            <i
                className="bi bi-house-door-fill"
                onClick={() => navigate("/doctor")}
                style={{
                    position: 'fixed',
                    bottom: '20px',
                    right: '20px',
                    fontSize: '32px',
                    color: '#003344',
                    cursor: 'pointer'
                }}
            />

            {/* DIALOG */}
            {selectedEvent && isDialogOpen && (
                <Paper
                    elevation={6}
                    style={{
                        position: 'fixed',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        backgroundColor: 'white',
                        padding: '24px',
                        borderRadius: '12px',
                        zIndex: 1500,
                        width: '320px',
                        boxShadow: '0 6px 20px rgba(0,0,0,0.2)'
                    }}
                >
                    <Typography variant="h6" gutterBottom>
                        {t("APPOINTMENTS_DETAILS")}
                    </Typography>
                    <Typography><strong>{t("APPOINTMENT_POPUP_DATE")}:</strong> {selectedEvent.extendedProps.date}</Typography>
                    <Typography><strong>{t("APPOINTMENT_POPUP_TIME")}:</strong> {selectedEvent.extendedProps.time}</Typography>
                    <Typography><strong>{t("APPOINTMENT_POPUP_PATIENT")}:</strong> {selectedEvent.extendedProps.patient?.name} {selectedEvent.extendedProps.patient?.surname}</Typography>
                    <Typography><strong>{t("APPOINTMENT_POPUP_NOTES")}:</strong> {selectedEvent.extendedProps.notes || "—"}</Typography>

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px' }}>
                        <Button onClick={() => setIsDialogOpen(false)} variant="outlined">
                            Close
                        </Button>

                        <IconButton aria-label="delete" color="error" onClick={() => deleteAppointment(selectedEvent.id)}>
                            <DeleteIcon />
                        </IconButton>
                    </div>
                </Paper>
            )}

            <MessageHandlerModel messageInfo={message} type={messageType} onClear={() => setMessage("")} />
        </div>
    );
};

export default AppointmentCalendar;
