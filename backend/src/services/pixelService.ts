import { query } from '@/config/database';
import { redisClient } from '@/config/redis';
import { REDIS_KEYS, PIXEL_COOLDOWN } from '@/config/constants';
import { setPixelColor } from './canvasService';
import { PixelWithUser, CooldownInfo } from '@/types';
import { validatePixelPlacement } from '@/utils/validators';
import { logPixelPlacement } from '@/utils/logger';

export async function checkCooldown(userId: number): Promise<CooldownInfo> {
  const cooldownKey = REDIS_KEYS.COOLDOWN(userId);
  const ttl = await redisClient.ttl(cooldownKey);

  if (ttl > 0) {
    return {
      active: true,
      remainingSeconds: ttl
    };
  }

  return {
    active: false,
    remainingSeconds: 0
  };
}

export async function setCooldown(userId: number): Promise<void> {
  const cooldownKey = REDIS_KEYS.COOLDOWN(userId);
  await redisClient.setEx(cooldownKey, PIXEL_COOLDOWN, Date.now().toString());
}

export async function placePixel(
  userId: number,
  email: string,
  x: number,
  y: number,
  color: string
): Promise<PixelWithUser> {
  const validationError = validatePixelPlacement(x, y, color);
  if (validationError) {
    throw new Error(validationError.message);
  }

  const cooldown = await checkCooldown(userId);
  if (cooldown.active) {
    throw new Error(`Cooldown active. Wait ${cooldown.remainingSeconds} seconds.`);
  }

  const upperColor = color.toUpperCase();

  await setPixelColor(x, y, upperColor);

  await query(
    'INSERT INTO pixel_history (x, y, color, user_id) VALUES ($1, $2, $3, $4)',
    [x, y, upperColor, userId]
  );

  await setCooldown(userId);

  logPixelPlacement(userId, email, x, y, upperColor);

  return {
    x,
    y,
    color: upperColor,
    userId,
    placedAt: new Date()
  };
}

export async function getPixelHistory(x: number, y: number, limit = 50) {
  const result = await query(
    `SELECT
      ph.color,
      u.email as "placedBy",
      ph.placed_at as "placedAt"
    FROM pixel_history ph
    JOIN users u ON ph.user_id = u.id
    WHERE ph.x = $1 AND ph.y = $2
    ORDER BY ph.placed_at DESC
    LIMIT $3`,
    [x, y, limit]
  );

  return result.rows;
}
