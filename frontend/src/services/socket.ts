import { io, Socket } from 'socket.io-client';
import {
  ServerToClientEvents,
  ClientToServerEvents,
  SocketPixelUpdate,
  SocketUserCount,
  SocketCooldownUpdate,
  SocketError,
  PlacePixelRequest,
} from '../types';

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3000';

type SocketEventCallback = (data: unknown) => void;

class SocketService {
  private socket: Socket<ServerToClientEvents, ClientToServerEvents> | null =
    null;
  private listeners: Map<string, Set<SocketEventCallback>> = new Map();
  private currentToken?: string;

  connect(token?: string) {
    if (this.socket?.connected && this.currentToken === token) {
      return;
    }

    if (this.socket?.connected && this.currentToken !== token) {
      this.disconnect();
    }

    this.currentToken = token;

    this.socket = io(WS_URL, {
      auth: token ? { token } : {},
      transports: ['websocket', 'polling'],
    });

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
    });

    this.socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
    });

    this.socket.on('pixel-update', (data: SocketPixelUpdate) => {
      this.emit('pixel-update', data);
    });

    this.socket.on('pixel-batch', (data: SocketPixelUpdate[]) => {
      this.emit('pixel-batch', data);
    });

    this.socket.on('user-count', (data: SocketUserCount) => {
      this.emit('user-count', data);
    });

    this.socket.on('cooldown-update', (data: SocketCooldownUpdate) => {
      this.emit('cooldown-update', data);
    });

    this.socket.on('canvas-reload', () => {
      this.emit('canvas-reload', null);
    });

    this.socket.on('error', (data: SocketError) => {
      this.emit('error', data);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.currentToken = undefined;
    this.listeners.clear();
  }

  placePixel(data: PlacePixelRequest) {
    if (this.socket?.connected) {
      this.socket.emit('place-pixel', data);
    }
  }

  on(event: string, callback: SocketEventCallback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  off(event: string, callback: SocketEventCallback) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.delete(callback);
    }
  }

  private emit(event: string, data: unknown) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(callback => callback(data));
    }
  }
}

export const socketService = new SocketService();
