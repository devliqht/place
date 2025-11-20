import { Router, Request, Response } from 'express';
import { redisClient } from '@/config/redis';
import {
  getCanvasFillPercentage,
  getFilledPixelCount,
} from '@/services/canvasService';
import { getCanvasStats } from '@/services/adminService';
import { REDIS_KEYS } from '@/config/constants';

const router = Router();

router.get('/online', async (_req: Request, res: Response) => {
  try {
    const activeUsers = await redisClient.sCard(REDIS_KEYS.ACTIVE_USERS);
    const totalPixelsPlaced = await getFilledPixelCount();
    const canvasFillPercentage = await getCanvasFillPercentage();

    res.json({
      success: true,
      stats: {
        activeUsers,
        totalPixelsPlaced,
        canvasFillPercentage: parseFloat(canvasFillPercentage.toFixed(2)),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get stats',
    });
  }
});

router.get('/canvas', async (_req: Request, res: Response) => {
  try {
    const stats = await getCanvasStats();

    res.json({
      success: true,
      stats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to get canvas stats',
    });
  }
});

export default router;
