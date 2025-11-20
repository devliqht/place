import dotenv from 'dotenv';
import { AppConfig, DatabaseConfig, RedisConfig } from '@/types';

dotenv.config();

function getEnvVar(key: string, defaultValue?: string): string {
  const value = process.env[key] || defaultValue;
  if (!value) {
    throw new Error(`Environment variable ${key} is required but not set`);
  }
  return value;
}

function getEnvNumber(key: string, defaultValue: number): number {
  const value = process.env[key];
  return value ? parseInt(value, 10) : defaultValue;
}

function getEnvArray(key: string, defaultValue: string[] = []): string[] {
  const value = process.env[key];
  return value ? value.split(',').map(v => v.trim()) : defaultValue;
}

export const appConfig: AppConfig = {
  port: getEnvNumber('PORT', 3000),
  nodeEnv: getEnvVar('NODE_ENV', 'development'),
  jwtSecret: getEnvVar('JWT_SECRET'),
  jwtExpiry: getEnvVar('JWT_EXPIRY', '7d'),
  allowedOrigins: getEnvArray('ALLOWED_ORIGINS', ['http://localhost:5173']),
  canvasWidth: getEnvNumber('CANVAS_WIDTH', 1000),
  canvasHeight: getEnvNumber('CANVAS_HEIGHT', 1000),
  pixelCooldown: getEnvNumber('PIXEL_COOLDOWN', 10),
  adminEmails: getEnvArray('ADMIN_EMAILS', [])
};

export const dbConfig: DatabaseConfig = {
  host: getEnvVar('DB_HOST', 'localhost'),
  port: getEnvNumber('DB_PORT', 5432),
  database: getEnvVar('DB_NAME', 'place'),
  user: getEnvVar('DB_USER', 'placeadmin'),
  password: getEnvVar('DB_PASSWORD')
};

export const redisConfig: RedisConfig = {
  host: getEnvVar('REDIS_HOST', 'localhost'),
  port: getEnvNumber('REDIS_PORT', 6379),
  password: process.env.REDIS_PASSWORD
};

export const logLevel = getEnvVar('LOG_LEVEL', 'info');

export const isProduction = appConfig.nodeEnv === 'production';
export const isDevelopment = appConfig.nodeEnv === 'development';
