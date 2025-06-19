import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LoginPage from '../Pages/loginPages/LoginPage.jsx';
import { BrowserRouter, useNavigate } from 'react-router-dom';
import axios from 'axios';

jest.mock('axios');

// Mock per navigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockNavigate,
}));

// Mock componenti atomici
jest.mock('../AtomicComponents/TextFieldModel.jsx', () => (props) => (
    <input
        data-testid={`input-${props.type}`}
        type={props.type}
        placeholder={props.placeholder}
        value={props.value}
        onChange={props.onChange}
    />
));
jest.mock('../AtomicComponents/ButtonModel.jsx', () => (props) => (
    <button onClick={props.onClick}>{props.buttonText}</button>
));
jest.mock('../AtomicComponents/MessageHandlerModel.jsx', () => () => <div>Mocked MessageHandler</div>);

describe('LoginPage', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        localStorage.clear();
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    test('renders inputs and buttons', () => {
        render(
            <BrowserRouter>
                <LoginPage />
            </BrowserRouter>
        );

        expect(screen.getByTestId('input-email')).toBeInTheDocument();
        expect(screen.getByTestId('input-password')).toBeInTheDocument();
        expect(screen.getByText('Login')).toBeInTheDocument();
        expect(screen.getByText('Sign Up')).toBeInTheDocument();
    });

    test('successful login sets token and navigates', async () => {
        const fakePayload = {
            name: 'Mario',
            surname: 'Rossi',
        };
        const fakeToken =
            btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' })) +
            '.' +
            btoa(JSON.stringify(fakePayload)) +
            '.sig';

        axios.post.mockResolvedValueOnce({ data: { token: fakeToken } });

        render(
            <BrowserRouter>
                <LoginPage />
            </BrowserRouter>
        );

        fireEvent.change(screen.getByTestId('input-email'), {
            target: { value: 'doctor@example.com' },
        });
        fireEvent.change(screen.getByTestId('input-password'), {
            target: { value: 'securePass' },
        });
        fireEvent.click(screen.getByText('Login'));

        await waitFor(() => {
            expect(localStorage.getItem('token')).toBe(fakeToken);
            expect(localStorage.getItem('doctorName')).toBe('Mario Rossi');
        });

        // Simula il tempo per attivare il setTimeout
        jest.runAllTimers();

        expect(mockNavigate).toHaveBeenCalledWith('/doctor');
    });

    test('failed login shows error message', async () => {
        axios.post.mockRejectedValueOnce({
            response: {
                data: {
                    message: 'Invalid credentials',
                },
            },
        });

        render(
            <BrowserRouter>
                <LoginPage />
            </BrowserRouter>
        );

        fireEvent.change(screen.getByTestId('input-email'), {
            target: { value: 'wrong@example.com' },
        });
        fireEvent.change(screen.getByTestId('input-password'), {
            target: { value: 'wrongpass' },
        });
        fireEvent.click(screen.getByText('Login'));

        await waitFor(() => {
            expect(screen.getByText('Mocked MessageHandler')).toBeInTheDocument();
        });
    });
});
