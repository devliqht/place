import { Router, Request, Response } from 'express';
import { register, login, verifyEmail, resendVerification } from '@/services/authService';
import { authenticateToken } from '@/middleware/auth';
import { loginLimiter } from '@/middleware/rateLimiter';
import { AuthRequest } from '@/types';

const router = Router();

router.post('/register', loginLimiter, async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
      return;
    }

    const result = await register(email, password);

    res.json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Registration failed'
    });
  }
});

router.post('/login', loginLimiter, async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
      return;
    }

    const result = await login(email, password);

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Login failed'
    });
  }
});

router.get('/verify', authenticateToken, (req: Request, res: Response) => {
  const authReq = req as AuthRequest;

  res.json({
    success: true,
    valid: true,
    user: {
      id: authReq.user?.userId,
      email: authReq.user?.email
    }
  });
});

router.get('/verify-email', async (req: Request, res: Response) => {
  try {
    const { token } = req.query;

    if (!token || typeof token !== 'string') {
      res.status(400).json({
        success: false,
        error: 'Verification token is required'
      });
      return;
    }

    const result = await verifyEmail(token);

    res.json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Email verification failed'
    });
  }
});

router.post('/resend-verification', loginLimiter, async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({
        success: false,
        error: 'Email is required'
      });
      return;
    }

    const result = await resendVerification(email);

    res.json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to resend verification'
    });
  }
});

export default router;
