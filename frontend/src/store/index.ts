import { create } from 'zustand';
import { CanvasStore, User, Pixel, PALETTE } from '../types';

export const useStore = create<CanvasStore>((set) => ({
  pixels: new Map<string, string>(),
  selectedColor: PALETTE[0] || '#FFFFFF',
  zoom: 1,
  offset: { x: 0, y: 0 },

  isAuthenticated: false,
  user: null,
  token: localStorage.getItem('token') || null,

  cooldown: 0,
  isPlacing: false,
  activeUsers: 0,
  isPreviewMode: false,
  canvasMode: 'paint',

  setPixel: (x: number, y: number, color: string) => {
    set((state) => {
      const newPixels = new Map(state.pixels);
      newPixels.set(`${x},${y}`, color);
      return { pixels: newPixels };
    });
  },

  loadCanvas: (pixels: Pixel[]) => {
    set(() => {
      const pixelMap = new Map<string, string>();
      pixels.forEach((p) => {
        pixelMap.set(`${p.x},${p.y}`, p.color);
      });
      return { pixels: pixelMap };
    });
  },

  setSelectedColor: (color: string) => set({ selectedColor: color }),

  setZoom: (zoom: number) => set({ zoom: Math.max(0.5, Math.min(10, zoom)) }),

  setOffset: (x: number, y: number) => set({ offset: { x, y } }),

  setUser: (user: User, token: string) => {
    localStorage.setItem('token', token);
    set({ user, token, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null, isAuthenticated: false });
  },

  setCooldown: (seconds: number) => set({ cooldown: seconds }),

  setIsPlacing: (isPlacing: boolean) => set({ isPlacing }),

  setActiveUsers: (count: number) => set({ activeUsers: count }),

  setIsPreviewMode: (isPreviewMode: boolean) => set({ isPreviewMode }),

  setCanvasMode: (mode: 'paint' | 'move') => set({ canvasMode: mode }),
}));
