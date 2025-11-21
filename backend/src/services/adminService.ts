import { query } from '@/config/database';
import { UserActivity, User, PixelHistory } from '@/types';

export async function getUserActivity(email: string): Promise<UserActivity> {
  const userResult = await query(
    `SELECT
      email,
      created_at as "createdAt",
      last_seen as "lastSeen",
      total_pixels_placed as "totalPixelsPlaced"
    FROM users
    WHERE LOWER(email) = LOWER($1)`,
    [email]
  );

  if (userResult.rows.length === 0) {
    throw new Error('User not found');
  }

  const activityResult = await query(
    `SELECT
      ph.x,
      ph.y,
      ph.color,
      ph.placed_at as "timestamp"
    FROM pixel_history ph
    JOIN users u ON ph.user_id = u.id
    WHERE LOWER(u.email) = LOWER($1)
    ORDER BY ph.placed_at DESC
    LIMIT 50`,
    [email]
  );

  return {
    user: userResult.rows[0] as User,
    recentActivity: activityResult.rows as PixelHistory[],
  };
}

export async function getCanvasStats() {
  const result = await query(
    `SELECT
      total_users as "totalUsers",
      total_pixels_placed as "totalPixelsPlaced",
      unique_pixels_filled as "uniquePixelsFilled",
      fill_percentage as "fillPercentage"
    FROM canvas_stats`
  );

  return (
    result.rows[0] || {
      totalUsers: 0,
      totalPixelsPlaced: 0,
      uniquePixelsFilled: 0,
      fillPercentage: 0,
    }
  );
}

export async function getLeaderboard(limit = 10) {
  const result = await query(
    `SELECT
      email,
      total_pixels_placed as "totalPixelsPlaced",
      rank
    FROM user_leaderboard
    LIMIT $1`,
    [limit]
  );

  return result.rows;
}

export async function logAdminAction(
  adminUserId: number,
  action: string,
  targetUserId?: number,
  details?: Record<string, unknown>
) {
  await query(
    'INSERT INTO admin_logs (admin_user_id, action, target_user_id, details) VALUES ($1, $2, $3, $4)',
    [
      adminUserId,
      action,
      targetUserId || null,
      details ? JSON.stringify(details) : null,
    ]
  );
}

export async function revertPixel(x: number, y: number): Promise<string | null> {
  const historyResult = await query(
    `SELECT color, user_id
     FROM pixel_history
     WHERE x = $1 AND y = $2
     ORDER BY placed_at DESC
     LIMIT 2`,
    [x, y]
  );

  if (historyResult.rows.length < 2) {
    await query(
      'DELETE FROM pixel_history WHERE x = $1 AND y = $2',
      [x, y]
    );

    const { redisClient } = await import('@/config/redis');
    const { REDIS_KEYS } = await import('@/config/constants');
    await redisClient.hDel(REDIS_KEYS.CANVAS_STATE, `${x},${y}`);

    return null;
  }

  const previousPixel = historyResult.rows[1];

  await query(
    'DELETE FROM pixel_history WHERE x = $1 AND y = $2 AND placed_at = (SELECT MAX(placed_at) FROM pixel_history WHERE x = $1 AND y = $2)',
    [x, y]
  );

  const { setPixelColor } = await import('@/services/canvasService');
  await setPixelColor(x, y, previousPixel.color);

  return previousPixel.color;
}

export async function deleteUserPixels(email: string): Promise<number> {
  const userResult = await query(
    'SELECT id FROM users WHERE LOWER(email) = LOWER($1)',
    [email]
  );

  if (userResult.rows.length === 0) {
    throw new Error('User not found');
  }

  const userId = userResult.rows[0].id;

  const pixelsResult = await query(
    `SELECT DISTINCT ON (x, y) x, y, color
     FROM pixel_history
     WHERE user_id = $1
     ORDER BY x, y, placed_at DESC`,
    [userId]
  );

  const deleteResult = await query(
    'DELETE FROM pixel_history WHERE user_id = $1',
    [userId]
  );

  const { setPixelColor } = await import('@/services/canvasService');
  const { redisClient } = await import('@/config/redis');
  const { REDIS_KEYS } = await import('@/config/constants');

  for (const pixel of pixelsResult.rows) {
    const priorPixel = await query(
      `SELECT color
       FROM pixel_history
       WHERE x = $1 AND y = $2 AND user_id != $3
       ORDER BY placed_at DESC
       LIMIT 1`,
      [pixel.x, pixel.y, userId]
    );

    if (priorPixel.rows.length > 0) {
      await setPixelColor(pixel.x, pixel.y, priorPixel.rows[0].color);
    } else {
      await redisClient.hDel(REDIS_KEYS.CANVAS_STATE, `${pixel.x},${pixel.y}`);
    }
  }

  return deleteResult.rowCount || 0;
}

export async function getRecentPixels(limit = 50) {
  const result = await query(
    `SELECT
      ph.x,
      ph.y,
      ph.color,
      u.email,
      ph.placed_at as "placedAt"
    FROM pixel_history ph
    JOIN users u ON ph.user_id = u.id
    ORDER BY ph.placed_at DESC
    LIMIT $1`,
    [limit]
  );

  return result.rows;
}

export async function getPixelInfo(x: number, y: number) {
  const result = await query(
    `SELECT
      ph.x,
      ph.y,
      ph.color,
      u.email,
      ph.placed_at as "placedAt"
    FROM pixel_history ph
    JOIN users u ON ph.user_id = u.id
    WHERE ph.x = $1 AND ph.y = $2
    ORDER BY ph.placed_at DESC
    LIMIT 1`,
    [x, y]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return result.rows[0];
}
