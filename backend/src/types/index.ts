import { Request } from 'express';

export interface User {
  id: number;
  email: string;
  passwordHash: string;
  emailVerified: boolean;
  verificationToken: string | null;
  verificationExpiresAt: Date | null;
  createdAt: Date;
  lastSeen: Date;
  totalPixelsPlaced: number;
}

export interface UserCreate {
  email: string;
  password: string;
}

export interface UserRegister {
  email: string;
  password: string;
}

export interface UserLogin {
  email: string;
  password: string;
}

export interface JWTPayload {
  userId: number;
  email: string;
  iat?: number;
  exp?: number;
}

export interface AuthRequest extends Request {
  user?: JWTPayload;
}

export interface Pixel {
  x: number;
  y: number;
  color: string;
}

export interface PixelWithUser extends Pixel {
  userId: number;
  placedAt: Date;
}

export interface PixelHistory {
  id: number;
  x: number;
  y: number;
  color: string;
  userId: number;
  placedAt: Date;
}

export interface CanvasState {
  width: number;
  height: number;
  pixels: Pixel[];
  totalPixels: number;
  timestamp: Date;
}

export interface SocketAuthData {
  token: string;
}

export interface SocketPlacePixelData {
  x: number;
  y: number;
  color: string;
}

export interface SocketPixelUpdate {
  x: number;
  y: number;
  color: string;
  userId?: number;
  email?: string;
}

export interface Session {
  id: number;
  userId: number;
  token: string;
  createdAt: Date;
  expiresAt: Date;
  lastActivity: Date;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: number;
    email: string;
    emailVerified: boolean;
    createdAt: Date;
  };
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  email: string;
}

export interface VerifyResponse {
  valid: boolean;
  user?: {
    id: number;
    email: string;
  };
}

export interface VerifyEmailResponse {
  success: boolean;
  message: string;
}

export interface PixelPlaceResponse {
  pixel: PixelWithUser;
  cooldown: {
    active: boolean;
    remainingSeconds: number;
  };
}

export interface AdminLog {
  id: number;
  adminUserId: number;
  action: string;
  targetUserId?: number;
  details?: Record<string, unknown>;
  createdAt: Date;
}

export interface UserActivity {
  user: User;
  recentActivity: PixelHistory[];
}

export interface CanvasStats {
  totalUsers: number;
  totalPixelsPlaced: number;
  uniquePixelsFilled: number;
  fillPercentage: number;
}

export interface OnlineStats {
  activeUsers: number;
  totalPixelsPlaced: number;
  canvasFillPercentage: number;
}

export interface AppConfig {
  port: number;
  nodeEnv: string;
  jwtSecret: string;
  jwtExpiry: string;
  allowedOrigins: string[];
  canvasWidth: number;
  canvasHeight: number;
  pixelCooldown: number;
  adminEmails: string[];
}

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
}

export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface CooldownInfo {
  active: boolean;
  remainingSeconds: number;
}

export type Color = string; 

export const PALETTE: Color[] = [
  '#FFFFFF', '#E4E4E4', '#888888', '#222222',  // Whites & Grays
  '#FFA7D1', '#E50000', '#E59500', '#A06A42',  // Pinks & Reds
  '#E5D900', '#94E044', '#02BE01', '#00D3DD',  // Yellows & Greens
  '#0083C7', '#0000EA', '#CF6EE4', '#820080',  // Blues & Purples
  '#FF99AA', '#FF6600', '#FFD635', '#FFF8B8',  // Additional colors
  '#00A368', '#00CC78', '#009EAA', '#00756F',
  '#2450A4', '#3690EA', '#51E9F4', '#493AC1',
  '#6A5CFF', '#811E9F', '#B44AC0', '#FF3881'
];

export interface ServerToClientEvents {
  'pixel-update': (data: SocketPixelUpdate) => void;
  'pixel-batch': (data: SocketPixelUpdate[]) => void;
  'user-count': (data: { count: number }) => void;
  'cooldown-update': (data: { remainingSeconds: number }) => void;
  error: (data: { message: string }) => void;
}

export interface ClientToServerEvents {
  authenticate: (data: SocketAuthData) => void;
  'place-pixel': (data: SocketPlacePixelData) => void;
}

export interface InterServerEvents {
  ping: () => void;
}

export interface SocketData {
  userId?: number;
  email?: string;
}
