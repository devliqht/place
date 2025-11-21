import axios from 'axios';
import {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  VerifyResponse,
  VerifyEmailResponse,
  CanvasStateResponse,
  PlacePixelRequest,
  PlacePixelResponse,
  OnlineStatsResponse,
  ApiError,
} from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authApi = {
  register: async (data: RegisterRequest): Promise<RegisterResponse | ApiError> => {
    try {
      const response = await api.post<RegisterResponse>('/api/auth/register', data);
      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        return error.response?.data || { success: false, error: 'Registration failed' };
      }
      return { success: false, error: 'Registration failed' };
    }
  },

  login: async (data: LoginRequest): Promise<LoginResponse | ApiError> => {
    try {
      const response = await api.post<LoginResponse>('/api/auth/login', data);
      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        return error.response?.data || { success: false, error: 'Login failed' };
      }
      return { success: false, error: 'Login failed' };
    }
  },

  verify: async (): Promise<VerifyResponse | ApiError> => {
    try {
      const response = await api.get<VerifyResponse>('/api/auth/verify');
      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        return error.response?.data || { success: false, error: 'Verification failed' };
      }
      return { success: false, error: 'Verification failed' };
    }
  },

  verifyEmail: async (token: string): Promise<VerifyEmailResponse | ApiError> => {
    try {
      const response = await api.get<VerifyEmailResponse>(`/api/auth/verify-email?token=${token}`);
      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        return error.response?.data || { success: false, error: 'Email verification failed' };
      }
      return { success: false, error: 'Email verification failed' };
    }
  },

  resendVerification: async (data: { email: string }): Promise<{ success: boolean; message: string } | ApiError> => {
    try {
      const response = await api.post<{ success: boolean; message: string }>('/api/auth/resend-verification', data);
      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        return error.response?.data || { success: false, error: 'Failed to resend verification' };
      }
      return { success: false, error: 'Failed to resend verification' };
    }
  },
};

export const canvasApi = {
  getState: async (): Promise<CanvasStateResponse | ApiError> => {
    try {
      const response = await api.get<CanvasStateResponse>('/api/canvas/state');
      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        return error.response?.data || { success: false, error: 'Failed to fetch canvas' };
      }
      return { success: false, error: 'Failed to fetch canvas' };
    }
  },
};

export const pixelApi = {
  place: async (data: PlacePixelRequest): Promise<PlacePixelResponse | ApiError> => {
    try {
      const response = await api.post<PlacePixelResponse>('/api/pixels/place', data);
      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        return error.response?.data || { success: false, error: 'Failed to place pixel' };
      }
      return { success: false, error: 'Failed to place pixel' };
    }
  },
};

export const statsApi = {
  getOnline: async (): Promise<OnlineStatsResponse | ApiError> => {
    try {
      const response = await api.get<OnlineStatsResponse>('/api/stats/online');
      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        return error.response?.data || { success: false, error: 'Failed to fetch stats' };
      }
      return { success: false, error: 'Failed to fetch stats' };
    }
  },
};

export const healthApi = {
  check: async (): Promise<{ success: boolean; status: string } | ApiError> => {
    try {
      const response = await api.get('/health');
      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        return error.response?.data || { success: false, error: 'Health check failed' };
      }
      return { success: false, error: 'Health check failed' };
    }
  },
};

export const adminApi = {
  getRecentPixels: async (limit = 50) => {
    try {
      const response = await api.get(`/api/admin/recent-pixels?limit=${limit}`);
      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        return error.response?.data || { success: false, error: 'Failed to fetch recent pixels' };
      }
      return { success: false, error: 'Failed to fetch recent pixels' };
    }
  },

  revertPixel: async (x: number, y: number) => {
    try {
      const response = await api.post('/api/admin/revert-pixel', { x, y });
      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        return error.response?.data || { success: false, error: 'Failed to revert pixel' };
      }
      return { success: false, error: 'Failed to revert pixel' };
    }
  },

  deleteUserPixels: async (email: string) => {
    try {
      const response = await api.post('/api/admin/delete-user-pixels', { email });
      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        return error.response?.data || { success: false, error: 'Failed to delete user pixels' };
      }
      return { success: false, error: 'Failed to delete user pixels' };
    }
  },

  getPixelInfo: async (x: number, y: number) => {
    try {
      const response = await api.get(`/api/admin/pixel-info?x=${x}&y=${y}`);
      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        return error.response?.data || { success: false, error: 'Failed to get pixel info' };
      }
      return { success: false, error: 'Failed to get pixel info' };
    }
  },
};
