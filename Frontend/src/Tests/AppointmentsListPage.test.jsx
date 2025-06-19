import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AppointmentCalendar from '../Pages/AppointmentsPages/AppointmentsListPage';
import { BrowserRouter as Router } from 'react-router-dom';
import axios from 'axios';

// Mock axios
jest.mock('axios');

const mockAppointments = [
    {
        _id: '1',
        patient: { name: 'Mario', surname: 'Rossi' },
        date: '2025-06-20T00:00:00.000Z',
        time: '10:00',
        notes: 'Controllo annuale'
    }
];

describe('AppointmentCalendar', () => {
    beforeEach(() => {
        axios.get.mockResolvedValue({ data: mockAppointments });
    });

    it('renders calendar and title correctly', async () => {
        render(
            <Router>
                <AppointmentCalendar />
            </Router>
        );

        expect(screen.getByText(/Appointments List/i)).toBeInTheDocument();

        // Aspetta che gli eventi vengano caricati
        await waitFor(() => {
            expect(screen.getByText(/Mario Rossi/)).toBeInTheDocument();
        });

        expect(screen.getByRole('img', { name: /Calendar Icon/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Take new appointment/i })).toBeInTheDocument();
    });

    it('apre il dialog di dettaglio quando si clicca su un evento', async () => {
        render(
            <Router>
                <AppointmentCalendar />
            </Router>
        );

        await waitFor(() => {
            expect(screen.getByText(/Mario Rossi/)).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText(/Mario Rossi/));

        await waitFor(() => {
            expect(screen.getByText(/Appointment Details/i)).toBeInTheDocument();
            expect(screen.getByText(/Controllo annuale/i)).toBeInTheDocument();
        });
    });
});
