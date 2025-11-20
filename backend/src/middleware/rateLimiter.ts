import rateLimit from 'express-rate-limit';
import { RATE_LIMITS } from '@/config/constants';

export const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: RATE_LIMITS.GLOBAL_REQUESTS_PER_MINUTE,
  message: {
    success: false,
    error: 'Too many requests. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

export const loginLimiter = rateLimit({
  windowMs: RATE_LIMITS.LOGIN_WINDOW_SECONDS * 1000,
  max: RATE_LIMITS.LOGIN_PER_IP,
  message: {
    success: false,
    error: `Too many login attempts. Try again in ${RATE_LIMITS.LOGIN_WINDOW_SECONDS} seconds.`
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true
});
