"use client";

import { io } from 'socket.io-client';

let socket;

export const getSocket = () => {
    if (!socket) {
        // If we're on the client, connect
        if (typeof window !== 'undefined') {
            socket = io({
                path: '/socket.io',
            });
            console.log("Socket initialized");
        }
    }
    return socket;
};
