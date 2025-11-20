import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '@/services/authService';
import { AuthRequest } from '@/types';
import { appConfig } from '@/config/env';
import { isAdmin } from '@/utils/validators';

export function authenticateToken(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
    return;
  }

  const payload = verifyToken(token);

  if (!payload) {
    res.status(403).json({
      success: false,
      error: 'Invalid or expired token'
    });
    return;
  }

  (req as AuthRequest).user = payload;
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const authReq = req as AuthRequest;

  if (!authReq.user) {
    res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
    return;
  }

  if (!isAdmin(authReq.user.email, appConfig.adminEmails)) {
    res.status(403).json({
      success: false,
      error: 'Admin access required'
    });
    return;
  }

  next();
}
