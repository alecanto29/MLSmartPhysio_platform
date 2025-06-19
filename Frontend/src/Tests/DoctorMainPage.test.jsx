import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import DoctorMainPage from "../Pages/DoctorMainPage";
import { BrowserRouter } from "react-router-dom";
import axios from "axios";

// Mocks
jest.mock("axios");
jest.mock("../AtomicComponents/TextInfoModel", () => ({ textInfo, className }) => (
    <div className={className}>{textInfo}</div>
));
jest.mock("../AtomicComponents/Header", () => () => <div>Header</div>);

describe("DoctorMainPage", () => {
    beforeEach(() => {
        localStorage.setItem("token", "fake-token");

        axios.get.mockImplementation((url) => {
            switch (url) {
                case "/smartPhysio/patient":
                    return Promise.resolve({ data: [{}, {}] }); // 2 pazienti
                case "/smartPhysio/patient/critical":
                    return Promise.resolve({ data: [{}] }); // 1 critico
                case "/smartPhysio/appointments":
                    return Promise.resolve({
                        data: [
                            { date: new Date().toISOString() }, // oggi
                            { date: new Date().toISOString() }, // oggi
                            { date: "2000-01-01T00:00:00.000Z" } // vecchio
                        ]
                    });
                default:
                    return Promise.resolve({ data: [] });
            }
        });
    });

    test("visualizza i dati correttamente", async () => {
        render(
            <BrowserRouter>
                <DoctorMainPage />
            </BrowserRouter>
        );

        await waitFor(() => {
            expect(screen.getByText("Total appointments today")).toBeInTheDocument();
            expect(screen.getByText("Active patients")).toBeInTheDocument();
            expect(screen.getByText("Priority Patients")).toBeInTheDocument();

            // Verifica che ci siano due elementi con testo "2" (pazienti + appuntamenti)
            const twos = screen.getAllByText("2");
            expect(twos.length).toBe(2);

            // Verifica che ci sia un elemento con testo "1" (critici)
            expect(screen.getByText("1")).toBeInTheDocument();
        });
    });
});
