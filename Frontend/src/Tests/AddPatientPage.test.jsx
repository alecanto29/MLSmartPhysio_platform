import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import AddPatientPage from "../Pages/AddPatientPage";
import { BrowserRouter } from "react-router-dom";
import axios from "axios";


// Mock dei componenti figli
jest.mock("../AtomicComponents/TextFieldModel", () => ({ value, onChange, placeholder }) => (
    <input placeholder={placeholder} value={value} onChange={onChange} />
));
jest.mock("../AtomicComponents/ButtonModel", () => ({ buttonText, onClick }) => (
    <button onClick={onClick}>{buttonText}</button>
));
jest.mock("../AtomicComponents/Header", () => () => <div>Header</div>);
jest.mock("../AtomicComponents/MessageHandlerModel", () => ({ messageInfo }) =>
    messageInfo ? <div>{messageInfo}</div> : null
);

// Mock di axios
jest.mock("axios");

describe("AddPatientPage", () => {
    beforeEach(() => {
        localStorage.setItem("token", "fake-token");
    });

    test("compila il form e invia con successo", async () => {
        axios.post.mockResolvedValueOnce({ data: {} });

        render(
            <BrowserRouter>
                <AddPatientPage />
            </BrowserRouter>
        );

        fireEvent.change(screen.getByPlaceholderText("Insert name here..."), {
            target: { value: "Mario" },
        });
        fireEvent.change(screen.getByPlaceholderText("Insert surname here..."), {
            target: { value: "Rossi" },
        });
        fireEvent.change(screen.getByPlaceholderText("Insert fiscal code here..."), {
            target: { value: "RSSMRA80A01H501U" },
        });
        fireEvent.change(screen.getByPlaceholderText("Insert Health card number here..."), {
            target: { value: "1234567890" },
        });
        fireEvent.change(screen.getByPlaceholderText("Insert Medical history here..."), {
            target: { value: "Nessuna patologia" },
        });

        fireEvent.change(screen.getByLabelText("Date of Birth"), {
            target: { value: "1980-01-01" },
        });
        fireEvent.click(screen.getByLabelText("Male"));

        fireEvent.click(screen.getByText("Confirm"));

        await waitFor(() => {
            expect(screen.getByText("Paziente aggiunto con successo")).toBeInTheDocument();
        });

        expect(axios.post).toHaveBeenCalledWith(
            "/smartPhysio/patient",
            expect.objectContaining({
                name: "Mario",
                surname: "Rossi",
                fiscalCode: "RSSMRA80A01H501U",
                healthCardNumber: "1234567890",
                gender: "Male",
                medicalHistory: "Nessuna patologia",
                birthDate: "1980-01-01",
            }),
            expect.any(Object)
        );
    });
});
