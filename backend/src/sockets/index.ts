import { Server as HTTPServer } from 'http';
import { Server } from 'socket.io';
import { verifyToken } from '@/services/authService';
import { redisClient } from '@/config/redis';
import { REDIS_KEYS } from '@/config/constants';
import { appConfig } from '@/config/env';
import { ServerToClientEvents, ClientToServerEvents, InterServerEvents, SocketData } from '@/types';
import { setupPixelHandlers } from './pixelHandlers';

let ioInstance: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData> | null = null;

export function initializeSocketIO(httpServer: HTTPServer): Server {
  const io = new Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(httpServer, {
    cors: {
      origin: appConfig.allowedOrigins,
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  ioInstance = io;

  io.use((socket, next) => {
    const token = socket.handshake.auth.token as string;

    if (!token) {
      socket.data.userId = undefined;
      socket.data.email = 'Guest';
      return next();
    }

    const payload = verifyToken(token);

    if (!payload) {
      socket.data.userId = undefined;
      socket.data.email = 'Guest';
      return next();
    }

    socket.data.userId = payload.userId;
    socket.data.email = payload.email;

    next();
  });

  io.on('connection', async (socket) => {
    const userId = socket.data.userId;
    const email = socket.data.email;

    console.log(`User connected: ${email} (ID: ${userId})`);

    if (userId) {
      await redisClient.sAdd(REDIS_KEYS.ACTIVE_USERS, userId.toString());
    }

    const activeUsers = await redisClient.sCard(REDIS_KEYS.ACTIVE_USERS);
    io.emit('user-count', { count: activeUsers });

    setupPixelHandlers(io, socket);

    socket.on('disconnect', async () => {
      console.log(`User disconnected: ${email} (ID: ${userId})`);

      if (userId) {
        await redisClient.sRem(REDIS_KEYS.ACTIVE_USERS, userId.toString());
      }

      const activeUsersAfter = await redisClient.sCard(REDIS_KEYS.ACTIVE_USERS);
      io.emit('user-count', { count: activeUsersAfter });
    });
  });

  return io;
}

export function getIO(): Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData> {
  if (!ioInstance) {
    throw new Error('Socket.IO not initialized');
  }
  return ioInstance;
}
