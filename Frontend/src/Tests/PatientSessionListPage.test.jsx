import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import PatientSessionListPage from "../Pages/PatientSessionListPage";
import { BrowserRouter, MemoryRouter, Route, Routes } from "react-router-dom";
import axios from "axios";

// Mock dependencies
jest.mock("axios");
jest.mock("../AtomicComponents/Header", () => () => <div>Header</div>);
jest.mock("../AtomicComponents/MessageHandlerModel", () => ({ messageInfo, type }) =>
    <div data-testid="message" className={type}>{messageInfo}</div>
);

const renderWithRouter = (id = "123") => {
    window.localStorage.setItem("token", "fake-token");

    return render(
        <MemoryRouter initialEntries={[`/sessions/patient/${id}`]}>
            <Routes>
                <Route path="/sessions/patient/:id" element={<PatientSessionListPage />} />
            </Routes>
        </MemoryRouter>
    );
};

describe("PatientSessionListPage", () => {
    beforeEach(() => {
        axios.get.mockResolvedValue({
            data: [
                {
                    _id: "s1",
                    date: "2023-06-01T10:00:00Z",
                    patient: { _id: "p1" }
                },
                {
                    _id: "s2",
                    date: "2023-06-02T10:00:00Z",
                    patient: { _id: "p1" }
                }
            ]
        });
    });

    test("renders patient sessions and filters correctly", async () => {
        renderWithRouter();

        await waitFor(() => {
            expect(screen.getByText(/Session 1 - 01\/06\/2023/i)).toBeInTheDocument();
            expect(screen.getByText(/Session 2 - 02\/06\/2023/i)).toBeInTheDocument();
        });

        const input = screen.getByPlaceholderText("Search by session number or date...");
        fireEvent.change(input, { target: { value: "02/06/2023" } });

        expect(screen.queryByText(/Session 1 - 01\/06\/2023/i)).not.toBeInTheDocument();
        expect(screen.getByText(/Session 2 - 02\/06\/2023/i)).toBeInTheDocument();
    });

    test("shows 'No session found' if nothing matches", async () => {
        renderWithRouter();

        await waitFor(() => {
            expect(screen.getByText(/Session 1 - 01\/06\/2023/i)).toBeInTheDocument();
        });

        const input = screen.getByPlaceholderText("Search by session number or date...");
        fireEvent.change(input, { target: { value: "non esiste" } });

        expect(screen.getByText(/No session found/i)).toBeInTheDocument();
    });
});
