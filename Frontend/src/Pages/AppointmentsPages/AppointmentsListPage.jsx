import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import axios from 'axios';
import { Paper, Typography, Button, GlobalStyles } from '@mui/material';

const AppointmentCalendar = () => {

    const [events, setEvents] = useState([]);
    const navigate = useNavigate();

    const [selectedEvent, setSelectedEvent] = useState(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    useEffect(() => {
        axios.get('http://localhost:5000/smartPhysio/appointments', {
            headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`
            }
        })
            .then(res => {
                const transformed = res.data.map(app => {
                    const name = app.patient?.name || '';
                    const surname = app.patient?.surname || '';
                    return {
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
    }, []);

    const add30Min = (time) => {
        const [h, m] = time.split(':');
        const date = new Date();
        date.setHours(parseInt(h), parseInt(m) + 30);
        return date.toTimeString().slice(0, 5);
    };


    return (
        <div className="page-container" style={{ backgroundColor: '#ccf2ff', minHeight: '100vh', position: 'relative' }}>
            {/* HEADER */}
            <header style={{
                position: 'absolute',
                top: '30px',
                left: '0',
                width: '100%',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                padding: '0 40px',
                boxSizing: 'border-box'
            }}>
                {/* LOGO IN ALTO A SINISTRA */}
                <img
                    src="/images/app_logo.png"
                    alt="Logo"
                    style={{
                        height: '70px',
                        objectFit: 'contain',
                        marginTop: '0'
                    }}
                />

                {/* INFO UTENTE IN ALTO A DESTRA */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    fontWeight: 'bold',
                    fontSize: '16px',
                    color: '#003344',
                    marginTop: '0'
                }}>
                    <span>{localStorage.getItem("doctorName") || "Utente"}</span>
                    <i className="bi bi-person-circle" style={{ fontSize: '28px' }}></i>
                </div>
            </header>



            {/* TITOLO */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                marginLeft: '80px',
                marginTop: '70px', // aumentato per lasciare spazio al logo
                marginBottom: '40px'
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
                    Appointments List
                </Typography>
            </div>

            {/* STILI GLOBALI */}
            <GlobalStyles styles={{
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
                '.fc-day-today': {
                    backgroundColor: '#ffebee !important',
                },
                '.fc-scroller::-webkit-scrollbar': {
                    display: 'none',
                },
                '.fc-timegrid-slot': {
                    height: '60px !important',
                },
                '.fc-timegrid-event': {
                    width: '101% !important',         // Aumenta la larghezza fino quasi a toccare i bordi
                    margin: '0 auto',                // Centra il rettangolo nella cella
                },
                '.fc-event': {
                    height: '200% !important',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    padding: '5px 12px',
                    fontSize: '0.85rem'
                },
                '.fc-event-title': {
                    whiteSpace: 'normal',
                    overflowWrap: 'break-word'
                }
            }} />

            {/* CALENDARIO */}
            <Paper
                elevation={4}
                sx={{
                    p: 3,
                    borderRadius: '24px',
                    backgroundColor: '#f9f9f9',
                    maxWidth: '1200px',
                    width: '100%',
                    margin: '-30px auto 60px auto', // aumentato da 10px a 40px
                    boxShadow: '0 6px 24px rgba(0, 0, 0, 0.08)',
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
                    height={400}
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
                    Take new appointment
                </Button>
            </Paper>

            {/* HOME ICON */}
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
                        width: '300px',
                        boxShadow: '0 6px 20px rgba(0,0,0,0.2)'
                    }}
                >
                    <Typography variant="h6" gutterBottom>
                        Appointment Details
                    </Typography>
                    <Typography><strong>Date:</strong> {selectedEvent.extendedProps.date}</Typography>
                    <Typography><strong>Time:</strong> {selectedEvent.extendedProps.time}</Typography>
                    <Typography><strong>Patient:</strong> {selectedEvent.extendedProps.patient?.name} {selectedEvent.extendedProps.patient?.surname}</Typography>
                    <Typography><strong>Notes:</strong> {selectedEvent.extendedProps.notes || "—"}</Typography>
                    <Button
                        onClick={() => setIsDialogOpen(false)}
                        variant="outlined"
                        sx={{ marginTop: '16px' }}
                    >
                        Close
                    </Button>
                </Paper>
            )}
        </div>
    );
};

export default AppointmentCalendar;
