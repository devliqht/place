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

router.post('/revert-pixel', async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const { x, y } = req.body;

    if (typeof x !== 'number' || typeof y !== 'number') {
      res.status(400).json({
        success: false,
        error: 'Valid x and y coordinates are required',
      });
      return;
    }

    const { revertPixel } = await import('@/services/adminService');
    const previousColor = await revertPixel(x, y);

    await logAdminAction(
      authReq.user!.userId,
      'revert_pixel',
      undefined,
      { x, y, previousColor }
    );

    const { getIO } = await import('@/sockets');
    const io = getIO();
    if (previousColor) {
      io.emit('pixel-update', {
        x,
        y,
        color: previousColor,
        userId: authReq.user!.userId,
        email: authReq.user!.email
      });
    } else {
      io.emit('canvas-reload');
    }

    res.json({
      success: true,
      x,
      y,
      color: previousColor,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to revert pixel',
    });
  }
});

router.post('/delete-user-pixels', async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const { email } = req.body;

    if (!email) {
      res.status(400).json({
        success: false,
        error: 'Email is required',
      });
      return;
    }

    const { deleteUserPixels } = await import('@/services/adminService');
    const deletedCount = await deleteUserPixels(email);

    await logAdminAction(
      authReq.user!.userId,
      'delete_user_pixels',
      undefined,
      { targetEmail: email, deletedCount }
    );

    const { getIO } = await import('@/sockets');
    const io = getIO();
    io.emit('canvas-reload');

    res.json({
      success: true,
      deletedCount,
      email,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to delete user pixels',
    });
  }
});

router.get('/recent-pixels', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string, 10) || 50;
    const { getRecentPixels } = await import('@/services/adminService');
    const recentPixels = await getRecentPixels(limit);

    res.json({
      success: true,
      pixels: recentPixels,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to get recent pixels',
    });
  }
});

router.get('/pixel-info', async (req: Request, res: Response) => {
  try {
    const x = parseInt(req.query.x as string, 10);
    const y = parseInt(req.query.y as string, 10);

    if (isNaN(x) || isNaN(y)) {
      res.status(400).json({
        success: false,
        error: 'Valid x and y coordinates are required',
      });
      return;
    }

    const { getPixelInfo } = await import('@/services/adminService');
    const pixelInfo = await getPixelInfo(x, y);

    res.json({
      success: true,
      pixel: pixelInfo,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to get pixel info',
    });
  }
});

export default router;
