-- r/place Database Schema
-- PostgreSQL 15+

-- Drop existing tables (for clean reinstall)
DROP TABLE IF EXISTS admin_logs CASCADE;
DROP TABLE IF EXISTS pixel_history CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    email_verified BOOLEAN DEFAULT FALSE,
    verification_token TEXT,
    verification_expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total_pixels_placed INTEGER DEFAULT 0,

    -- Constraints
    CONSTRAINT check_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@usc\.edu\.ph$')
);

-- Index for fast email lookups
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_last_seen ON users(last_seen DESC);
CREATE INDEX idx_users_verification_token ON users(verification_token) WHERE verification_token IS NOT NULL;

-- Pixel history (for moderation and audit trail)
CREATE TABLE pixel_history (
    id BIGSERIAL PRIMARY KEY,
    x INTEGER NOT NULL,
    y INTEGER NOT NULL,
    color VARCHAR(7) NOT NULL,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    placed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    CHECK (x >= 0 AND x < 1000),
    CHECK (y >= 0 AND y < 1000),
    CHECK (color ~ '^#[0-9A-F]{6}$')
);

-- Indexes for efficient queries
CREATE INDEX idx_pixel_history_coords ON pixel_history(x, y);
CREATE INDEX idx_pixel_history_user_id ON pixel_history(user_id);
CREATE INDEX idx_pixel_history_placed_at ON pixel_history(placed_at DESC);
CREATE INDEX idx_pixel_history_user_recent ON pixel_history(user_id, placed_at DESC);

-- Sessions (backup storage, primary is Redis)
CREATE TABLE sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    CHECK (expires_at > created_at)
);

-- Indexes for token lookups and cleanup
CREATE INDEX idx_sessions_token ON sessions(token);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);

-- Admin actions log
CREATE TABLE admin_logs (
    id SERIAL PRIMARY KEY,
    admin_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL,
    target_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    details JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for admin activity tracking
CREATE INDEX idx_admin_logs_admin ON admin_logs(admin_user_id, created_at DESC);
CREATE INDEX idx_admin_logs_created_at ON admin_logs(created_at DESC);

-- Function to automatically update user's last_seen timestamp
CREATE OR REPLACE FUNCTION update_user_last_seen()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE users
    SET last_seen = NEW.placed_at
    WHERE id = NEW.user_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update last_seen on pixel placement
CREATE TRIGGER trigger_update_user_last_seen
AFTER INSERT ON pixel_history
FOR EACH ROW
EXECUTE FUNCTION update_user_last_seen();

-- Function to automatically increment user's pixel count
CREATE OR REPLACE FUNCTION increment_pixel_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE users
    SET total_pixels_placed = total_pixels_placed + 1
    WHERE id = NEW.user_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to increment pixel count
CREATE TRIGGER trigger_increment_pixel_count
AFTER INSERT ON pixel_history
FOR EACH ROW
EXECUTE FUNCTION increment_pixel_count();

-- Function to clean up expired sessions (call periodically)
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM sessions
    WHERE expires_at < CURRENT_TIMESTAMP;

    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Create a view for canvas statistics
CREATE OR REPLACE VIEW canvas_stats AS
SELECT
    COUNT(DISTINCT user_id) as total_users,
    COUNT(*) as total_pixels_placed,
    COUNT(DISTINCT CONCAT(x, ',', y)) as unique_pixels_filled,
    ROUND((COUNT(DISTINCT CONCAT(x, ',', y))::NUMERIC / 1000000) * 100, 2) as fill_percentage
FROM pixel_history;

-- Create a view for user leaderboard
CREATE OR REPLACE VIEW user_leaderboard AS
SELECT
    u.email,
    u.total_pixels_placed,
    u.created_at,
    u.last_seen,
    RANK() OVER (ORDER BY u.total_pixels_placed DESC) as rank
FROM users u
WHERE u.total_pixels_placed > 0
ORDER BY u.total_pixels_placed DESC
LIMIT 100;

-- Grant permissions to placeuser
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO placeuser;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO placeuser;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO placeuser;

-- Display success message
DO $$
BEGIN
    RAISE NOTICE '✓ Database schema created successfully!';
    RAISE NOTICE '✓ Tables: users, pixel_history, sessions, admin_logs';
    RAISE NOTICE '✓ Views: canvas_stats, user_leaderboard';
    RAISE NOTICE '✓ Triggers and functions configured';
END $$;
