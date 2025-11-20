import { Router, Request, Response } from 'express';
import {
  getUserActivity,
  getLeaderboard,
  logAdminAction,
} from '@/services/adminService';
import { getPixelHistory } from '@/services/pixelService';
import { getPixelColor } from '@/services/canvasService';
import { authenticateToken, requireAdmin } from '@/middleware/auth';
import { AuthRequest } from '@/types';

const router = Router();

router.use(authenticateToken);
router.use(requireAdmin);

router.get('/history', async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const x = parseInt(req.query.x as string, 10);
    const y = parseInt(req.query.y as string, 10);

    if (isNaN(x) || isNaN(y)) {
      res.status(400).json({
        success: false,
        error: 'Valid x and y coordinates are required',
      });
      return;
    }

    const currentColor = await getPixelColor(x, y);
    const history = await getPixelHistory(x, y);

    await logAdminAction(
      authReq.user!.userId,
      'view_pixel_history',
      undefined,
      { x, y }
    );

    res.json({
      success: true,
      pixel: {
        x,
        y,
        currentColor: currentColor || null,
      },
      history,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to get pixel history',
    });
  }
});

router.get('/users/:email', async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const email = req.params.email;

    if (!email) {
      res.status(400).json({
        success: false,
        error: 'email param is required',
      });
      return;
    }

    const activity = await getUserActivity(email);

    await logAdminAction(
      authReq.user!.userId,
      'view_user_activity',
      undefined,
      { targetEmail: email }
    );

    res.json({
      success: true,
      ...activity,
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      error: error instanceof Error ? error.message : 'User not found',
    });
  }
});

router.get('/leaderboard', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string, 10) || 10;
    const leaderboard = await getLeaderboard(limit);

    res.json({
      success: true,
      leaderboard,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to get leaderboard',
    });
  }
});

export default router;
