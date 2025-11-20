import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { query } from '@/config/database';
import { redisClient } from '@/config/redis';
import { appConfig } from '@/config/env';
import { REDIS_KEYS, JWT_EXPIRY_SECONDS } from '@/config/constants';
import { User, JWTPayload, LoginResponse, RegisterResponse, VerifyEmailResponse } from '@/types';
import { validateEmail, validateRegistration } from '@/utils/validators';
import { sendVerificationEmail } from './emailService';

const SALT_ROUNDS = 12;

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export async function findUserByEmail(email: string): Promise<User | null> {
  const result = await query<User>(
    `SELECT id, email, password_hash as "passwordHash", email_verified as "emailVerified",
     verification_token as "verificationToken", verification_expires_at as "verificationExpiresAt",
     created_at as "createdAt", last_seen as "lastSeen", total_pixels_placed as "totalPixelsPlaced"
     FROM users WHERE LOWER(email) = LOWER($1)`,
    [email]
  );

  return result.rows[0] || null;
}

export async function register(email: string, password: string): Promise<RegisterResponse> {
  const validationError = validateRegistration(email, password);
  if (validationError) {
    throw new Error(validationError.message);
  }

  const existingUser = await findUserByEmail(email);
  if (existingUser) {
    throw new Error('Email already registered');
  }

  const passwordHash = await hashPassword(password);
  const verificationToken = generateVerificationToken();
  const verificationExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  const result = await query<User>(
    `INSERT INTO users (email, password_hash, verification_token, verification_expires_at)
     VALUES ($1, $2, $3, $4)
     RETURNING id, email, email_verified as "emailVerified", created_at as "createdAt"`,
    [email.toLowerCase(), passwordHash, verificationToken, verificationExpiresAt]
  );

  const newUser = result.rows[0];
  if (!newUser) {
    throw new Error('Failed to create user');
  }

  const emailSent = await sendVerificationEmail(email, verificationToken);
  if (!emailSent) {
    console.error(`Failed to send verification email to ${email}`);
  }

  return {
    success: true,
    message: 'Registration successful. Please check your email to verify your account.',
    email: newUser.email,
  };
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const emailError = validateEmail(email);
  if (emailError) {
    throw new Error(emailError.message);
  }

  if (!password) {
    throw new Error('Password is required');
  }

  const user = await findUserByEmail(email);
  if (!user) {
    throw new Error('Invalid email or password');
  }

  const isPasswordValid = await verifyPassword(password, user.passwordHash);
  if (!isPasswordValid) {
    throw new Error('Invalid email or password');
  }

  if (!user.emailVerified) {
    throw new Error('Email not verified. Please check your inbox for the verification link.');
  }

  await query('UPDATE users SET last_seen = NOW() WHERE id = $1', [user.id]);

  const token = generateToken(user.id, user.email);
  await storeSession(token, user.id);

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
    },
  };
}

export async function verifyEmail(token: string): Promise<VerifyEmailResponse> {
  if (!token) {
    throw new Error('Verification token is required');
  }

  const result = await query<User>(
    `SELECT id, email, verification_expires_at as "verificationExpiresAt", email_verified as "emailVerified"
     FROM users WHERE verification_token = $1`,
    [token]
  );

  const user = result.rows[0];
  if (!user) {
    throw new Error('Invalid verification token');
  }

  if (user.emailVerified) {
    return {
      success: true,
      message: 'Email already verified',
    };
  }

  if (!user.verificationExpiresAt || new Date() > user.verificationExpiresAt) {
    throw new Error('Verification token has expired. Please request a new verification email.');
  }

  await query(
    'UPDATE users SET email_verified = TRUE, verification_token = NULL, verification_expires_at = NULL WHERE id = $1',
    [user.id]
  );

  return {
    success: true,
    message: 'Email verified successfully. You can now log in.',
  };
}

export async function resendVerification(email: string): Promise<{ success: boolean; message: string }> {
  const emailError = validateEmail(email);
  if (emailError) {
    throw new Error(emailError.message);
  }

  const user = await findUserByEmail(email);
  if (!user) {
    throw new Error('Email not found');
  }

  if (user.emailVerified) {
    throw new Error('Email already verified');
  }

  const verificationToken = generateVerificationToken();
  const verificationExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await query(
    'UPDATE users SET verification_token = $1, verification_expires_at = $2 WHERE id = $3',
    [verificationToken, verificationExpiresAt, user.id]
  );

  const emailSent = await sendVerificationEmail(user.email, verificationToken);
  if (!emailSent) {
    throw new Error('Failed to send verification email. Please try again later.');
  }

  return {
    success: true,
    message: 'Verification email sent. Please check your inbox.',
  };
}

export function generateToken(userId: number, email: string): string {
  const payload: JWTPayload = {
    userId,
    email,
  };

  return jwt.sign(payload, appConfig.jwtSecret, {
    expiresIn: JWT_EXPIRY_SECONDS,
  });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, appConfig.jwtSecret) as JWTPayload;
    return decoded;
  } catch {
    return null;
  }
}

export async function storeSession(
  token: string,
  userId: number
): Promise<void> {
  await redisClient.setEx(
    REDIS_KEYS.SESSION(token),
    JWT_EXPIRY_SECONDS,
    userId.toString()
  );

  await query(
    "INSERT INTO sessions (user_id, token, expires_at) VALUES ($1, $2, NOW() + INTERVAL '7 days') ON CONFLICT (token) DO UPDATE SET last_activity = NOW()",
    [userId, token]
  );
}

export async function getSessionUserId(token: string): Promise<number | null> {
  const userId = await redisClient.get(REDIS_KEYS.SESSION(token));
  return userId ? parseInt(userId, 10) : null;
}
