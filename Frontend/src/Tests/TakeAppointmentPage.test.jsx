import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TakeAppointmentPage from '../Pages/AppointmentsPages/TakeAppointmentPage';
import { BrowserRouter } from 'react-router-dom';
import axios from 'axios';

jest.mock('axios');

jest.mock('../AtomicComponents/Header.jsx', () => () => <div>Mocked Header</div>);
jest.mock('../AtomicComponents/MessageHandlerModel.jsx', () => () => <div>Mocked MessageHandler</div>);

const mockPatients = [
    {
        _id: '1',
        name: 'Mario',
        surname: 'Rossi',
        birthDate: '1980-01-01',
        fiscalCode: 'RSSMRA80A01F205X'
    },
    {
        _id: '2',
        name: 'Luisa',
        surname: 'Bianchi',
        birthDate: '1975-05-10',
        fiscalCode: 'BNCLSU75E50F205Y'
    }
];

const renderComponent = () =>
    render(
        <BrowserRouter>
            <TakeAppointmentPage />
        </BrowserRouter>
    );

describe('TakeAppointmentPage', () => {
    beforeEach(() => {
        axios.get.mockResolvedValue({ data: mockPatients });
    });

    test('renders title and patient list', async () => {
        renderComponent();

        expect(screen.getByText(/Patient List/i)).toBeInTheDocument();

        await waitFor(() => {
            expect(screen.getByText(/Mario Rossi/i)).toBeInTheDocument();
            expect(screen.getByText(/Luisa Bianchi/i)).toBeInTheDocument();
        });
    });

    test('opens popup on clicking "Take new appointment"', async () => {
        renderComponent();

        const takeButtons = await screen.findAllByText(/Take new appointment/i);
        expect(takeButtons.length).toBeGreaterThan(0);

        fireEvent.click(takeButtons[0]);

        // Cerca tra tutti gli elementi che contengono "New Appointment"
        const popupTitles = await screen.findAllByText(/New Appointment/i);
        expect(popupTitles.length).toBeGreaterThan(0);

        // Verifica che almeno uno contenga Date e Time
        expect(screen.getByText(/Date:/i)).toBeInTheDocument();
        expect(screen.getByText(/Time:/i)).toBeInTheDocument();
    });
});
