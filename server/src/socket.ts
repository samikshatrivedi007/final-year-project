import { Server as SocketIOServer } from "socket.io";
import http from "http";

let io: SocketIOServer;

export const initSocket = (
  server: http.Server,
  allowedOrigins: string[],
): SocketIOServer => {
  io = new SocketIOServer(server, {
    cors: {
      origin: (
        origin: string | undefined,
        callback: (err: Error | null, allow?: boolean) => void,
      ) => {
        // Allow requests with no origin
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        callback(new Error(`Socket CORS blocked: ${origin}`));
      },
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    socket.on("join", (room: string) => {
      socket.join(room);
    });

    socket.on("disconnect", () => {
      // cleanup is automatic
    });
  });

  return io;
};

export const emitTo = (
  rooms: string | string[],
  event: string,
  data?: unknown,
): void => {
  if (!io) return;
  const roomList = Array.isArray(rooms) ? rooms : [rooms];
  roomList.forEach((room) => io.to(room).emit(event, data));
};

export { io };
