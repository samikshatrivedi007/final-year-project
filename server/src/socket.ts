import { Server as SocketIOServer } from 'socket.io';
import http from 'http';

let io: SocketIOServer;

export const initSocket = (server: http.Server, clientUrl: string): SocketIOServer => {
    io = new SocketIOServer(server, {
        cors: {
            origin: clientUrl,
            methods: ['GET', 'POST'],
            credentials: true,
        },
    });

    io.on('connection', (socket) => {
        // Client sends { room } to join e.g. 'branch:AI', 'admin', 'faculty'
        socket.on('join', (room: string) => {
            socket.join(room);
        });

        socket.on('disconnect', () => {
            // cleanup is automatic
        });
    });

    return io;
};

/**
 * Emit a real-time event to one or more rooms.
 * Rooms: 'branch:AI', 'branch:DS', 'branch:Core CS', 'branch:Electronics', 'admin', 'faculty'
 */
export const emitTo = (rooms: string | string[], event: string, data?: unknown): void => {
    if (!io) return;
    const roomList = Array.isArray(rooms) ? rooms : [rooms];
    roomList.forEach((room) => io.to(room).emit(event, data));
};

export { io };
