import { useEffect } from 'react';
import { useStore } from './store';
import { authApi, canvasApi } from './services/api';
import { socketService } from './services/socket';
import { Canvas } from './components/Canvas';
import { Toolbar } from './components/Toolbar';
import { WelcomeBar } from './components/WelcomeBar';
import './styles/main.css';

export const App = () => {
  const isAuthenticated = useStore(state => state.isAuthenticated);
  const token = useStore(state => state.token);
  const setUser = useStore(state => state.setUser);
  const logout = useStore(state => state.logout);
  const loadCanvas = useStore(state => state.loadCanvas);
  const setPixel = useStore(state => state.setPixel);
  const setActiveUsers = useStore(state => state.setActiveUsers);
  const setCooldown = useStore(state => state.setCooldown);

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) return;

      const response = await authApi.verify();

      if (response.success === false || !response.valid) {
        logout();
        return;
      }

      if (response.user) {
        setUser(response.user, token);
      }
    };

    verifyToken();
  }, [token, logout, setUser]);

  useEffect(() => {
    const loadCanvasData = async () => {
      const response = await canvasApi.getState();
      if (response.success !== false && 'canvas' in response) {
        loadCanvas(response.canvas.pixels);
      }
    };

    loadCanvasData();
  }, [loadCanvas]);

  useEffect(() => {
    socketService.connect(token || undefined);

    const handlePixelUpdate = (data: unknown) => {
      const pixelData = data as { x: number; y: number; color: string };
      setPixel(pixelData.x, pixelData.y, pixelData.color);
    };

    const handlePixelBatch = (data: unknown) => {
      const batchData = data as Array<{ x: number; y: number; color: string }>;
      batchData.forEach(pixel => {
        setPixel(pixel.x, pixel.y, pixel.color);
      });
    };

    const handleUserCount = (data: unknown) => {
      const countData = data as { count: number };
      setActiveUsers(countData.count);
    };

    const handleCooldownUpdate = (data: unknown) => {
      const cooldownData = data as { remainingSeconds: number };
      setCooldown(cooldownData.remainingSeconds);
    };

    const handleError = (data: unknown) => {
      const errorData = data as { message: string };
      console.error('Socket error:', errorData.message);
    };

    socketService.on('pixel-update', handlePixelUpdate);
    socketService.on('pixel-batch', handlePixelBatch);
    socketService.on('user-count', handleUserCount);
    socketService.on('cooldown-update', handleCooldownUpdate);
    socketService.on('error', handleError);

    return () => {
      socketService.disconnect();
    };
  }, [token, setPixel, setActiveUsers, setCooldown]);

  return (
    <>
      <Canvas />
      <Toolbar />
      {!isAuthenticated && <WelcomeBar />}
    </>
  );
};
