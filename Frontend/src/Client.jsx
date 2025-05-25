import { useEffect } from "react";
import { io } from "socket.io-client";

const socket = io("http://localhost:5000");

const Client = ({ onData, isStreaming }) => {
    useEffect(() => {
        if (!isStreaming) return;

        const imuHandler = (data) => {
            console.log("dati imuData", data);
            onData("imuData", data);
        };

        const semgHandler = (data) => {
            console.log("dati sEMG", data);
            onData("sEMG", data);
        };

        socket.on("imuData", imuHandler);
        socket.on("sEMG", semgHandler);

        return () => {
            socket.off("imuData", imuHandler);
            socket.off("sEMG", semgHandler);
        };
    }, [isStreaming, onData]);

    return null;
};

export default Client;
