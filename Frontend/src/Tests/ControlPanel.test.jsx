import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ControlPanel from "../Pages/SessionPages/ControlPanel";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import axios from "axios";

// Mocks
jest.mock("axios");
jest.mock("../Client", () => () => <div data-testid="client" />);
jest.mock("../AtomicComponents/DropDownButtonModel", () => (props) => (
    <button onClick={() => props.onItemClick("sEMG data")}>{props.buttonText}</button>
));
jest.mock("../AtomicComponents/ButtonModel", () => (props) => (
    <button onClick={props.onClick} disabled={props.disabled}>{props.buttonText}</button>
));
jest.mock("../AtomicComponents/Header", () => () => <div>Header</div>);
jest.mock("../Pages/SessionPages/GraphModel", () => () => <div>Graph</div>);

// ✅ FIX: usa require dentro il factory di jest.mock per evitare ReferenceError
jest.mock("../Pages/SessionPages/TimerModel", () => {
    const React = require("react");
    return React.forwardRef((_, ref) => {
        ref.current = {
            start: jest.fn(),
            stop: jest.fn()
        };
        return <div>Timer</div>;
    });
});

beforeAll(() => {
    // Per evitare errori di jsdom su URL.* e navigation
    global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
    global.URL.revokeObjectURL = jest.fn();

    delete window.location;
    window.location = { assign: jest.fn() };
});

describe("ControlPanel", () => {
    beforeEach(() => {
        axios.post.mockResolvedValue({});
        axios.get.mockResolvedValue({ data: new Blob(["data"], { type: "text/csv" }) });
        URL.createObjectURL = jest.fn(() => "blob:url");
        const anchor = document.createElement("a");
        document.body.appendChild(anchor);
        document.body.removeChild = jest.fn();
    });

    it("renders ControlPanel and interacts with dropdown and buttons", async () => {
        render(
            <MemoryRouter initialEntries={["/control-panel/123"]}>
                <Routes>
                    <Route path="/control-panel/:id" element={<ControlPanel />} />
                </Routes>
            </MemoryRouter>
        );

        // Dropdown interaction
        const dropdown = screen.getByText("Graph type");
        fireEvent.click(dropdown);

        // Simula selezione sEMG data
        await waitFor(() => expect(screen.getByText("sEMG data")).toBeInTheDocument());

        // Click Download
        const downloadBtn = screen.getByText(/Download/);
        fireEvent.click(downloadBtn);

        await waitFor(() => expect(axios.get).toHaveBeenCalled());

        // Click Start e Stop
        const startBtn = screen.getByText(/Start/);
        fireEvent.click(startBtn);
        await waitFor(() => expect(axios.post).toHaveBeenCalledWith(
            "/smartPhysio/send",
            expect.objectContaining({ data: ["Start\\r"], sessionId: "123" })
        ));

        const stopBtn = screen.getByText(/Stop/);
        fireEvent.click(stopBtn);
        await waitFor(() => expect(axios.post).toHaveBeenCalledWith(
            "/smartPhysio/send",
            expect.objectContaining({ data: ["Stop\\r"], sessionId: "123" })
        ));
    });
});
