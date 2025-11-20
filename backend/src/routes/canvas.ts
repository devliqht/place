import { Router, Request, Response } from 'express';
import { getCanvasState } from '@/services/canvasService';

const router = Router();

router.get('/state', async (_req: Request, res: Response) => {
  try {
    const canvas = await getCanvasState();

    res.json({
      success: true,
      canvas,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to get canvas state',
    });
  }
});

export default router;
