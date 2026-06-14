import { Server as HTTPServer } from 'http';
import { Server as IOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';

let io: IOServer;

export function initSocket(httpServer: HTTPServer): void {
  io = new IOServer(httpServer, {
    cors: {
      origin: process.env.CLIENT_ORIGIN || '*',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket: Socket) => {
    socket.on('join_expense', (data: { expenseId: number; token: string }) => {
      try {
        jwt.verify(data.token, process.env.JWT_SECRET as string);
        socket.join(`expense:${data.expenseId}`);
      } catch {
        socket.emit('error', { message: 'Invalid token' });
      }
    });

    socket.on('leave_expense', (data: { expenseId: number }) => {
      socket.leave(`expense:${data.expenseId}`);
    });
  });
}

export function getIO(): IOServer {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
}
