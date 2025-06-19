import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import RegistrationPage from '../Pages/loginPages/RegistrationPage.jsx';
import { BrowserRouter } from 'react-router-dom';
import axios from 'axios';

const mockNavigate = jest.fn();

jest.mock('axios');
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockNavigate,
}));

jest.mock('../AtomicComponents/TextFieldModel.jsx', () => (props) => (
    <input
        data-testid={`input-${props.placeholder}`}
        type={props.type}
        placeholder={props.placeholder}
        value={props.value}
        onChange={props.onChange}
    />
));
jest.mock('../AtomicComponents/ButtonModel.jsx', () => (props) => (
    <button onClick={props.onClick}>{props.buttonText}</button>
));
jest.mock('../AtomicComponents/MessageHandlerModel.jsx', () => ({ messageInfo }) =>
    messageInfo ? <div>{messageInfo}</div> : null
);

describe('RegistrationPage', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        localStorage.clear();
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    test('renders all inputs and buttons', () => {
        render(
            <BrowserRouter>
                <RegistrationPage />
            </BrowserRouter>
        );

        expect(screen.getByText('Name')).toBeInTheDocument();
        expect(screen.getByText('Surname')).toBeInTheDocument();
        expect(screen.getByText('Fiscal Code')).toBeInTheDocument();
        expect(screen.getByText('Email')).toBeInTheDocument();
        expect(screen.getByText('Password')).toBeInTheDocument();
        expect(screen.getByText('License Number')).toBeInTheDocument();
        expect(screen.getByText('Confirm')).toBeInTheDocument();
    });

    test('successful registration sets token and navigates', async () => {
        const fakePayload = { name: 'Mario', surname: 'Rossi' };
        const fakeToken =
            btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' })) +
            '.' +
            btoa(JSON.stringify(fakePayload)) +
            '.sig';

        axios.post.mockResolvedValueOnce({ data: { token: fakeToken } });

        render(
            <BrowserRouter>
                <RegistrationPage />
            </BrowserRouter>
        );

        fireEvent.change(screen.getByPlaceholderText('Insert your name here...'), {
            target: { value: 'Mario' },
        });
        fireEvent.change(screen.getByPlaceholderText('Insert your surname here...'), {
            target: { value: 'Rossi' },
        });
        fireEvent.change(screen.getByPlaceholderText('Insert your fiscal code here...'), {
            target: { value: 'ABCDEF12G34H567I' },
        });
        fireEvent.change(screen.getByPlaceholderText('Insert your specialization here...'), {
            target: { value: 'Physiotherapy' },
        });
        fireEvent.change(screen.getByPlaceholderText('Insert your email here...'), {
            target: { value: 'mario.rossi@example.com' },
        });
        fireEvent.change(screen.getByPlaceholderText('Insert your password here...'), {
            target: { value: 'securePass' },
        });
        fireEvent.change(screen.getByPlaceholderText('Insert your license number here...'), {
            target: { value: '123456' },
        });

        fireEvent.click(screen.getByText('Confirm'));

        await waitFor(() => {
            expect(localStorage.getItem('token')).toBe(fakeToken);
            expect(localStorage.getItem('doctorName')).toBe('Mario Rossi');
            expect(screen.getByText('Registrazione avvenuta con successo')).toBeInTheDocument();
        });

        jest.runAllTimers();

        expect(mockNavigate).toHaveBeenCalledWith('/doctor');
    });

    test('failed registration shows error message', async () => {
        axios.post.mockRejectedValueOnce({
            response: { data: { message: 'Email già esistente' } },
        });

        render(
            <BrowserRouter>
                <RegistrationPage />
            </BrowserRouter>
        );

        fireEvent.click(screen.getByText('Confirm'));

        await waitFor(() => {
            expect(screen.getByText('Email già esistente')).toBeInTheDocument();
        });
    });
});
