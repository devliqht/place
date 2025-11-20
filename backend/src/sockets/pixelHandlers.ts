import { Server, Socket } from 'socket.io';
import { placePixel, checkCooldown } from '@/services/pixelService';
import { ServerToClientEvents, ClientToServerEvents, InterServerEvents, SocketData } from '@/types';

export function setupPixelHandlers(
  io: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
  socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>
): void {
  socket.on('place-pixel', async (data) => {
    const userId = socket.data.userId;
    const email = socket.data.email;

    if (!userId || !email) {
      socket.emit('error', { message: 'Authentication required' });
      return;
    }

    try {
      const { x, y, color } = data;

      const pixel = await placePixel(userId, email, x, y, color);

      io.emit('pixel-update', {
        x: pixel.x,
        y: pixel.y,
        color: pixel.color,
        userId: pixel.userId,
        email
      });

      const cooldown = await checkCooldown(userId);
      socket.emit('cooldown-update', {
        remainingSeconds: cooldown.remainingSeconds
      });

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to place pixel';
      socket.emit('error', { message });

      if (message.includes('Cooldown active')) {
        const cooldown = await checkCooldown(userId);
        socket.emit('cooldown-update', {
          remainingSeconds: cooldown.remainingSeconds
        });
      }
    }
  });
}
