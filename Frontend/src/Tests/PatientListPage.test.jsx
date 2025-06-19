import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import PatientListPage from "../Pages/PatientListPage";
import { BrowserRouter } from "react-router-dom";
import axios from "axios";

// Mocks
jest.mock("axios");
jest.mock("../AtomicComponents/Header", () => () => <div>Header</div>);
jest.mock("../AtomicComponents/MessageHandlerModel", () => ({ messageInfo, type }) => (
    <div data-testid="message" className={type}>{messageInfo}</div>
));

describe("PatientListPage", () => {
    beforeEach(() => {
        localStorage.setItem("token", "fake-token");

        axios.get.mockResolvedValue({
            data: [
                {
                    _id: "1",
                    name: "Mario",
                    surname: "Rossi",
                    birthDate: "1990-01-01T00:00:00.000Z",
                    fiscalCode: "RSSMRA90A01H501U",
                    isCritical: false,
                },
                {
                    _id: "2",
                    name: "Giulia",
                    surname: "Bianchi",
                    birthDate: "1985-12-12T00:00:00.000Z",
                    fiscalCode: "BNCGLI85T52H501Y",
                    isCritical: true,
                },
            ],
        });
    });

    test("renders patient list and filters by name", async () => {
        render(
            <BrowserRouter>
                <PatientListPage />
            </BrowserRouter>
        );

        await waitFor(() => {
            expect(screen.getByText("Mario Rossi")).toBeInTheDocument();
            expect(screen.getByText("Giulia Bianchi")).toBeInTheDocument();
        });

        // Test search
        const input = screen.getByPlaceholderText("Search by name, surname...");
        fireEvent.change(input, { target: { value: "giulia" } });

        expect(screen.queryByText("Mario Rossi")).not.toBeInTheDocument();
        expect(screen.getByText("Giulia Bianchi")).toBeInTheDocument();
    });

    test("shows no patients found if search doesn't match", async () => {
        render(
            <BrowserRouter>
                <PatientListPage />
            </BrowserRouter>
        );

        await waitFor(() => {
            expect(screen.getByText("Mario Rossi")).toBeInTheDocument();
        });

        const input = screen.getByPlaceholderText("Search by name, surname...");
        fireEvent.change(input, { target: { value: "zzz" } });

        expect(screen.getByText("No patients found.")).toBeInTheDocument();
    });
});
