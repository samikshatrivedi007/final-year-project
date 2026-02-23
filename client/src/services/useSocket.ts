import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

const SERVER_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

type EventHandlers = Record<string, (data: unknown) => void>;

/**
 * useSocket — connects to Socket.io server, joins a room, and subscribes to events.
 * @param room  e.g. 'branch:AI', 'admin', 'faculty'
 * @param handlers  map of { eventName: callback }
 */
export const useSocket = (room: string | null, handlers: EventHandlers): void => {
    const socketRef = useRef<Socket | null>(null);

    useEffect(() => {
        if (!room) return;

        const token = localStorage.getItem('token');
        const socket = io(SERVER_URL, {
            auth: { token },
            transports: ['websocket', 'polling'],
        });

        socketRef.current = socket;

        socket.on('connect', () => {
            socket.emit('join', room);
        });

        // Register all event handlers
        Object.entries(handlers).forEach(([event, cb]) => {
            socket.on(event, cb);
        });

        return () => {
            socket.disconnect();
            socketRef.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [room]);
};
