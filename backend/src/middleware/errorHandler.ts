import { Request, Response } from 'express';
import { logError } from '@/utils/logger';

export function errorHandler(err: Error, req: Request, res: Response): void {
  logError(err, {
    method: req.method,
    url: req.url,
    ip: req.ip,
  });

  const statusCode = res.statusCode !== 200 ? res.statusCode : 500;

  res.status(statusCode).json({
    success: false,
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}

export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: 'Route not found',
  });
}
