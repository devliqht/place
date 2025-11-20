export interface User {
  id: number;
  email: string;
  emailVerified: boolean;
  createdAt: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  email: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  token: string;
  user: User;
}

export interface VerifyResponse {
  success: boolean;
  valid: boolean;
  user?: User;
}

export interface Pixel {
  x: number;
  y: number;
  color: string;
}

export interface PixelWithTimestamp extends Pixel {
  placedBy?: string;
  timestamp?: string;
}

export interface CanvasState {
  width: number;
  height: number;
  pixels: Pixel[];
  totalPixels: number;
  timestamp: string;
}

export interface CanvasStateResponse {
  success: boolean;
  canvas: CanvasState;
}

export interface PlacePixelRequest {
  x: number;
  y: number;
  color: string;
}

export interface PlacePixelResponse {
  success: boolean;
  pixel: PixelWithTimestamp;
  cooldown: {
    active: boolean;
    remainingSeconds: number;
  };
}

export interface SocketPixelUpdate {
  x: number;
  y: number;
  color: string;
  userId?: number;
  email?: string;
}

export interface VerifyEmailResponse {
  success: boolean;
  message: string;
}

export interface SocketUserCount {
  count: number;
}

export interface SocketCooldownUpdate {
  remainingSeconds: number;
}

export interface SocketError {
  message: string;
}

export interface PixelHistory {
  color: string;
  placedBy: string;
  timestamp: string;
}

export interface PixelHistoryResponse {
  success: boolean;
  pixel: {
    x: number;
    y: number;
    currentColor: string;
  };
  history: PixelHistory[];
}

export interface UserActivity {
  user: {
    email: string;
    createdAt: string;
    lastSeen: string;
    totalPixelsPlaced: number;
  };
  recentActivity: Array<{
    x: number;
    y: number;
    color: string;
    timestamp: string;
  }>;
}

export interface UserActivityResponse {
  success: boolean;
  user: UserActivity['user'];
  recentActivity: UserActivity['recentActivity'];
}

export interface OnlineStats {
  activeUsers: number;
  totalPixelsPlaced: number;
  canvasFillPercentage: number;
}

export interface OnlineStatsResponse {
  success: boolean;
  stats: OnlineStats;
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

export const CANVAS_WIDTH = 250;
export const CANVAS_HEIGHT = 250;
export const PIXEL_COOLDOWN = 10; // seconds

export interface ViewportState {
  zoom: number;
  offsetX: number;
  offsetY: number;
}

export interface VisibleRegion {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

export interface CanvasStore {
  pixels: Map<string, string>;
  selectedColor: string;
  zoom: number;
  offset: { x: number; y: number };

  isAuthenticated: boolean;
  user: User | null;
  token: string | null;

  cooldown: number;
  isPlacing: boolean;
  activeUsers: number;
  isPreviewMode: boolean;
  canvasMode: 'paint' | 'move';

  setPixel: (x: number, y: number, color: string) => void;
  loadCanvas: (pixels: Pixel[]) => void;
  setSelectedColor: (color: string) => void;
  setZoom: (zoom: number) => void;
  setOffset: (x: number, y: number) => void;
  setUser: (user: User, token: string) => void;
  logout: () => void;
  setCooldown: (seconds: number) => void;
  setIsPlacing: (isPlacing: boolean) => void;
  setActiveUsers: (count: number) => void;
  setIsPreviewMode: (isPreviewMode: boolean) => void;
  setCanvasMode: (mode: 'paint' | 'move') => void;
}

export interface ApiError {
  success: false;
  error: string;
  message?: string;
}

export type ApiResponse<T> = T | ApiError;

export interface ServerToClientEvents {
  'pixel-update': (data: SocketPixelUpdate) => void;
  'pixel-batch': (data: SocketPixelUpdate[]) => void;
  'user-count': (data: SocketUserCount) => void;
  'cooldown-update': (data: SocketCooldownUpdate) => void;
  error: (data: SocketError) => void;
}

export interface ClientToServerEvents {
  authenticate: (data: { token: string }) => void;
  'place-pixel': (data: PlacePixelRequest) => void;
}
