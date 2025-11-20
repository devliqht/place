import { Router, Request, Response } from 'express';
import { placePixel, checkCooldown } from '@/services/pixelService';
import { authenticateToken } from '@/middleware/auth';
import { AuthRequest } from '@/types';
import { getIO } from '@/sockets';

const router = Router();

router.post('/place', authenticateToken, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const { x, y, color } = req.body;

    if (!authReq.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
      return;
    }

    if (typeof x !== 'number' || typeof y !== 'number' || !color) {
      res.status(400).json({
        success: false,
        error: 'Invalid request. x, y, and color are required.'
      });
      return;
    }

    const pixel = await placePixel(
      authReq.user.userId,
      authReq.user.email,
      x,
      y,
      color
    );

    const cooldown = await checkCooldown(authReq.user.userId);

    try {
      const io = getIO();
      io.emit('pixel-update', {
        x: pixel.x,
        y: pixel.y,
        color: pixel.color,
        userId: pixel.userId,
        email: authReq.user.email
      });
    } catch (error) {
      console.error('Failed to broadcast pixel update:', error);
    }

    res.json({
      success: true,
      pixel: {
        x: pixel.x,
        y: pixel.y,
        color: pixel.color,
        placedBy: authReq.user.email,
        timestamp: pixel.placedAt
      },
      cooldown
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to place pixel';

    if (message.includes('Cooldown active')) {
      res.status(429).json({
        success: false,
        error: message
      });
      return;
    }

    res.status(400).json({
      success: false,
      error: message
    });
  }
});

export default router;
