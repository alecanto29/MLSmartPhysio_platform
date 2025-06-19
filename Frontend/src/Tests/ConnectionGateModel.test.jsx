import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import ConnectionGateModel from "../Pages/SessionPages/ConnectionGateModel.jsx";
import axios from "axios";

// Mock per axios
jest.mock("axios");

// Mock del componente ControlPanel
jest.mock("../Pages/SessionPages/ControlPanel.jsx", () => () => <div>Mock ControlPanel</div>);

describe("ConnectionGateModel", () => {
    beforeEach(() => {
        localStorage.clear();
        jest.clearAllMocks();
    });

    test("mostra il messaggio di caricamento iniziale", async () => {
        axios.get.mockResolvedValue({ data: { connected: false } });
        axios.post.mockResolvedValue({});

        render(<ConnectionGateModel />);

        expect(screen.getByText("Connessione alla porta seriale in corso...")).toBeInTheDocument();
    });

    test("mostra messaggio di errore se non connesso", async () => {
        axios.get.mockResolvedValue({ data: { connected: false } });
        axios.post.mockResolvedValue({});

        render(<ConnectionGateModel />);

        await waitFor(() => {
            expect(screen.queryByText("Connessione alla porta seriale in corso...")).not.toBeInTheDocument();
        });

        await waitFor(() => {
            expect(screen.getByText("Nessuna porta seriale disponibile.")).toBeInTheDocument();
        });
    });

    test("renderizza ControlPanel se connesso", async () => {
        localStorage.setItem("boardsConnected", "true");

        render(<ConnectionGateModel />);

        await waitFor(() => {
            expect(screen.getByText("Mock ControlPanel")).toBeInTheDocument();
        });
    });
});
