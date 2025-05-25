import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, test, expect, beforeEach, vi } from 'vitest';
import MainMenu from "../Components/ControlPanel";

import axios from "axios";

vi.mock("axios");
vi.mock("../Client", () => ({
    default: () => <div data-testid="client-component" />
}));
vi.mock("../Components/TimerModel", () => ({
    default: React.forwardRef(() => <div data-testid="timer-component" />)
}));
vi.mock("../Components/GraphModel", () => ({
    default: ({ data, type }) => (
        <div data-testid="graph-model">{type}</div>
    )
}));
vi.mock("../AtomicComponents/ButtonModel", () => ({
    default: ({ buttonText, onClick, ...props }) => (
        <button onClick={onClick} {...props}>{buttonText}</button>
    )
}));
vi.mock("../AtomicComponents/DropDownButtonModel", () => ({
    default: ({ buttonText, items, onItemClick }) => (
        <select onChange={(e) => onItemClick(e.target.value)} data-testid="dropdown">
            <option>{buttonText}</option>
            {items.map((item, idx) => (
                <option key={idx} value={item}>{item}</option>
            ))}
        </select>
    )
}));

describe("MainMenu Component", () => {

    beforeEach(() => {
        axios.post.mockResolvedValue({ data: { message: "ok" } });
        axios.get.mockResolvedValue({ data: new Blob(["csv content"], { type: "text/csv" }) });
    });

    test("renders dropdown and buttons", () => {
        render(<MainMenu />);

        expect(screen.getByTestId("dropdown")).toBeInTheDocument();
        expect(screen.getByText(/Download/i)).toBeInTheDocument();
        expect(screen.getByText(/Start/i)).toBeInTheDocument();
        expect(screen.getByText(/Stop/i)).toBeInTheDocument();
    });

    test("changing dropdown updates graph type", () => {
        render(<MainMenu />);
        fireEvent.change(screen.getByTestId("dropdown"), {
            target: { value: "sEMG data" }
        });

        // Verifica che il valore del dropdown sia aggiornato
        expect(screen.getByTestId("dropdown")).toHaveValue("sEMG data");

        // Verifica che anche GraphModel abbia aggiornato
        expect(screen.getByTestId("graph-model")).toHaveTextContent("sEMG data");
    });


    test("clicking Start calls axios POST", async () => {
        render(<MainMenu />);
        fireEvent.click(screen.getByText(/Start/i));

        await waitFor(() => {
            expect(axios.post).toHaveBeenCalledWith("/smartPhysio/send", {
                data: ["Start\\r"],
            });
        });
    });

    test("clicking Stop calls axios POST", async () => {
        render(<MainMenu />);
        fireEvent.click(screen.getByText(/Stop/i));

        await waitFor(() => {
            expect(axios.post).toHaveBeenCalledWith("/smartPhysio/send", {
                data: ["Stop\\r"],
            });
        });
    });

});
