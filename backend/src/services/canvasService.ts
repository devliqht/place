import { redisClient } from '@/config/redis';
import { REDIS_KEYS, CANVAS_WIDTH, CANVAS_HEIGHT } from '@/config/constants';
import { Pixel, CanvasState } from '@/types';

export async function getCanvasState(): Promise<CanvasState> {
  const canvasData = await redisClient.hGetAll(REDIS_KEYS.CANVAS_STATE);

  const pixels: Pixel[] = Object.entries(canvasData).map(([key, color]) => {
    const parts = key.split(',');
    const x = Number(parts[0]);
    const y = Number(parts[1]);
    return { x, y, color };
  });

  return {
    width: CANVAS_WIDTH,
    height: CANVAS_HEIGHT,
    pixels,
    totalPixels: pixels.length,
    timestamp: new Date(),
  };
}

export async function getPixelColor(
  x: number,
  y: number
): Promise<string | null> {
  const key = `${x},${y}`;
  return await redisClient.hGet(REDIS_KEYS.CANVAS_STATE, key);
}

export async function setPixelColor(
  x: number,
  y: number,
  color: string
): Promise<void> {
  const key = `${x},${y}`;
  await redisClient.hSet(REDIS_KEYS.CANVAS_STATE, key, color.toUpperCase());
}

export async function getFilledPixelCount(): Promise<number> {
  return await redisClient.hLen(REDIS_KEYS.CANVAS_STATE);
}

export async function getCanvasFillPercentage(): Promise<number> {
  const filledPixels = await getFilledPixelCount();
  const totalPixels = CANVAS_WIDTH * CANVAS_HEIGHT;
  return (filledPixels / totalPixels) * 100;
}
