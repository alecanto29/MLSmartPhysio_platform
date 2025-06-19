import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import SessionDetailsPage from "../Pages/SessionDetailsPage";
import { BrowserRouter, MemoryRouter, Route, Routes } from "react-router-dom";
import axios from "axios";

// Mock dipendenze
jest.mock("axios");
jest.mock("../AtomicComponents/MessageHandlerModel", () => ({ messageInfo, type, onClear }) => (
    <div>{messageInfo && <div>{messageInfo}</div>}</div>
));
jest.mock("../AtomicComponents/Header", () => () => <div>Header</div>);

const mockSession = {
    _id: "session1",
    notes: "Initial notes",
    patient: { _id: "patient1", name: "Mario", surname: "Rossi" },
    doctor: { name: "Luca", surname: "Verdi" },
    date: new Date().toISOString()
};

describe("SessionDetailsPage", () => {
    beforeEach(() => {
        axios.get.mockResolvedValue({ data: mockSession });
        axios.put.mockResolvedValue({});
        localStorage.setItem("token", "fake-token");
    });

    test("visualizza i dati della sessione", async () => {
        render(
            <MemoryRouter initialEntries={["/session-details/session1"]}>
                <Routes>
                    <Route path="/session-details/:id" element={<SessionDetailsPage />} />
                </Routes>
            </MemoryRouter>
        );

        expect(screen.getByText("Caricamento in corso...")).toBeInTheDocument();

        await waitFor(() => {
            expect(screen.getByText("Session Details")).toBeInTheDocument();
            expect(screen.getByText("Mario Rossi")).toBeInTheDocument();
            expect(screen.getByText("Luca Verdi")).toBeInTheDocument();
            expect(screen.getByText("Initial notes")).toBeInTheDocument();
        });
    });

    test("consente di modificare le note e salva le modifiche", async () => {
        render(
            <MemoryRouter initialEntries={["/session-details/session1"]}>
                <Routes>
                    <Route path="/session-details/:id" element={<SessionDetailsPage />} />
                </Routes>
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByText("Initial notes")).toBeInTheDocument();
        });

        fireEvent.click(screen.getByAltText("Edit"));

        const textarea = screen.getByRole("textbox");
        fireEvent.change(textarea, { target: { value: "Note aggiornate" } });

        const saveButton = screen.getByText("Save Changes");
        fireEvent.click(saveButton);

        await waitFor(() => {
            expect(axios.put).toHaveBeenCalledWith(
                "/smartPhysio/sessions/session1",
                { notes: "Note aggiornate" },
                expect.any(Object)
            );
            expect(screen.getByText("Sessione modificata con successo")).toBeInTheDocument();
        });
    });
});
