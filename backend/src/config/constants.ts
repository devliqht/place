import { Color } from '@/types';
import { appConfig } from './env';

export const CANVAS_WIDTH = appConfig.canvasWidth;
export const CANVAS_HEIGHT = appConfig.canvasHeight;
export const PIXEL_COOLDOWN = appConfig.pixelCooldown;

export const PALETTE: Color[] = [
  '#FFFFFF', '#E4E4E4', '#888888', '#222222',
  '#FFA7D1', '#E50000', '#E59500', '#A06A42',
  '#E5D900', '#94E044', '#02BE01', '#00D3DD',
  '#0083C7', '#0000EA', '#CF6EE4', '#820080',
  '#FF99AA', '#FF6600', '#FFD635', '#FFF8B8',
  '#00A368', '#00CC78', '#009EAA', '#00756F',
  '#2450A4', '#3690EA', '#51E9F4', '#493AC1',
  '#6A5CFF', '#811E9F', '#B44AC0', '#FF3881'
];

export const REDIS_KEYS = {
  CANVAS_STATE: 'canvas:state',
  SESSION: (token: string) => `session:${token}`,
  COOLDOWN: (userId: number) => `cooldown:${userId}`,
  RATE_LIMIT_LOGIN: (ip: string) => `rate:login:${ip}`,
  ACTIVE_USERS: 'active:users'
} as const;

export const JWT_EXPIRY_SECONDS = 7 * 24 * 60 * 60;

export const RATE_LIMITS = {
  LOGIN_PER_IP: 10,
  LOGIN_WINDOW_SECONDS: 60,
  GLOBAL_REQUESTS_PER_MINUTE: 100
} as const;
