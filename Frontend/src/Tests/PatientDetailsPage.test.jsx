import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import PatientDetailsPage from "../Pages/PatientDetailsPage";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import axios from "axios";

jest.mock("axios");
jest.mock("../AtomicComponents/MessageHandlerModel", () => ({ messageInfo }) => (
    <div>{messageInfo}</div>
));

const mockPatient = {
    name: "Mario",
    surname: "Rossi",
    birthDate: "1990-01-01T00:00:00.000Z",
    fiscalCode: "RSSMRA90A01H501U",
    gender: "Male",
    healthCardNumber: "123456789",
    isCritical: true,
    medicalHistory: "No major issues"
};

describe("PatientDetailsPage", () => {
    beforeEach(() => {
        localStorage.setItem("token", "fake-token");
        localStorage.setItem("doctorName", "Dr. Test");

        axios.get.mockResolvedValue({ data: mockPatient });
        axios.put.mockResolvedValue({});
    });

    test("carica e mostra i dati del paziente", async () => {
        render(
            <MemoryRouter initialEntries={["/patient-details/1"]}>
                <Routes>
                    <Route path="/patient-details/:id" element={<PatientDetailsPage />} />
                </Routes>
            </MemoryRouter>
        );

        expect(screen.getByText(/Caricamento in corso/)).toBeInTheDocument();

        await waitFor(() => {
            expect(screen.getByText(/Mario Rossi/)).toBeInTheDocument();
            expect(screen.getByText(/1990/)).toBeInTheDocument();
            expect(screen.getByText(/RSSMRA90A01H501U/)).toBeInTheDocument();
            expect(screen.getByText(/Yes/)).toBeInTheDocument();
            expect(screen.getByText(/No major issues/)).toBeInTheDocument();
        });
    });

    test("permette la modifica dei dati e salvataggio", async () => {
        render(
            <MemoryRouter initialEntries={["/patient-details/1"]}>
                <Routes>
                    <Route path="/patient-details/:id" element={<PatientDetailsPage />} />
                </Routes>
            </MemoryRouter>
        );

        await waitFor(() => screen.getByText(/Mario Rossi/));

        fireEvent.click(screen.getByAltText("Edit")); // click sull’icona per edit mode

        const nameInput = screen.getByDisplayValue("Mario");
        fireEvent.change(nameInput, { target: { value: "Luigi" } });

        fireEvent.click(screen.getByText("Save Changes"));

        await waitFor(() => {
            expect(screen.getByText(/Paziente modificato con successo/)).toBeInTheDocument();
            expect(axios.put).toHaveBeenCalledWith(
                "/smartPhysio/patient/1",
                expect.objectContaining({ name: "Luigi" }),
                expect.any(Object)
            );
        });
    });
});
