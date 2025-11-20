import winston from 'winston';
import { logLevel } from '@/config/env';

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(meta).length > 0) {
      msg += ` ${JSON.stringify(meta)}`;
    }
    return msg;
  })
);

export const logger = winston.createLogger({
  level: logLevel,
  format: logFormat,
  transports: [
    new winston.transports.Console({
      format: consoleFormat
    }),
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880,
      maxFiles: 5
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 5242880,
      maxFiles: 5
    })
  ]
});

export function logRequest(method: string, url: string, statusCode: number, duration: number) {
  logger.info('HTTP Request', {
    method,
    url,
    statusCode,
    duration: `${duration}ms`
  });
}

export function logError(error: Error, context?: Record<string, unknown>) {
  logger.error('Error occurred', {
    message: error.message,
    stack: error.stack,
    ...context
  });
}

export function logPixelPlacement(userId: number, email: string, x: number, y: number, color: string) {
  logger.info('Pixel placed', {
    userId,
    email,
    x,
    y,
    color
  });
}
