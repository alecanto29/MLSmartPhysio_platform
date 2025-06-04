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

    useEffect(() => {
        axios.get('http://localhost:5000/smartPhysio/appointments', {
            headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`
            }
        })
            .then(res => {
                const transformed = res.data.map(app => ({
                    title: app.patient?.name || 'Appuntamento',
                    start: `${app.date}T${app.time}`,
                    end: `${app.date}T${add30Min(app.time)}`
                }));
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

    const takeNewAppointments = async () => {
        try{

        }catch(error){

        }
    }

    return (
        <div className="page-container" style={{ backgroundColor: '#ccf2ff', minHeight: '100vh', position: 'relative' }}>
            {/* HEADER */}
            <header style={{
                width: '100%',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '20px 40px',
                boxSizing: 'border-box'
            }}>
                <img src="/images/app_logo.png" alt="Logo" style={{ height: '60px', objectFit: 'contain' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontWeight: 'bold', color: '#003344' }}>
                    <span>{localStorage.getItem("doctorName") || "Utente"}</span>
                    <i className="bi bi-person-circle" style={{ fontSize: '28px' }}></i>
                </div>
            </header>

            {/* TITOLO */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                marginLeft: '120px',
                marginTop: '10px',
                marginBottom: '10px'
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
                    margin: '10px auto 60px auto',
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
        </div>
    );
};

export default AppointmentCalendar;
