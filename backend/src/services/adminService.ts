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
