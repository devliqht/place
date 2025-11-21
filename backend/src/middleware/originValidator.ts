import { Request, Response, NextFunction } from 'express';
import { appConfig } from '@/config/env';

export function validateOrigin(req: Request, res: Response, next: NextFunction): void {
  const origin = req.get('origin') || req.get('referer');

  if (!origin) {
    res.status(403).json({
      success: false,
      error: 'Forbidden'
    });
    return;
  }

  const isAllowed = appConfig.allowedOrigins.some(allowed =>
    origin.startsWith(allowed)
  );

  if (!isAllowed) {
    res.status(403).json({
      success: false,
      error: 'Forbidden'
    });
    return;
  }

  next();
}
