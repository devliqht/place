import { CANVAS_WIDTH, CANVAS_HEIGHT, PALETTE } from '@/config/constants';
import { ValidationError } from '@/types';

export function validateEmail(email: string): ValidationError | null {
  if (!email) {
    return { field: 'email', message: 'Email is required' };
  }

  if (typeof email !== 'string') {
    return { field: 'email', message: 'Email must be a string' };
  }

  const emailRegex = /^[A-Za-z0-9._%+-]+@usc\.edu\.ph$/i;
  if (!emailRegex.test(email)) {
    return { field: 'email', message: 'Email must be a valid @usc.edu.ph address' };
  }

  if (email.length > 255) {
    return { field: 'email', message: 'Email is too long' };
  }

  return null;
}

export function validatePassword(password: string): ValidationError | null {
  if (!password) {
    return { field: 'password', message: 'Password is required' };
  }

  if (typeof password !== 'string') {
    return { field: 'password', message: 'Password must be a string' };
  }

  if (password.length < 8) {
    return { field: 'password', message: 'Password must be at least 8 characters long' };
  }

  if (password.length > 128) {
    return { field: 'password', message: 'Password is too long (max 128 characters)' };
  }

  if (!/[A-Z]/.test(password)) {
    return { field: 'password', message: 'Password must contain at least one uppercase letter' };
  }

  if (!/[a-z]/.test(password)) {
    return { field: 'password', message: 'Password must contain at least one lowercase letter' };
  }

  if (!/[0-9]/.test(password)) {
    return { field: 'password', message: 'Password must contain at least one number' };
  }

  return null;
}

export function validateRegistration(email: string, password: string): ValidationError | null {
  const emailError = validateEmail(email);
  if (emailError) return emailError;

  const passwordError = validatePassword(password);
  if (passwordError) return passwordError;

  return null;
}

export function validateCoordinates(x: number, y: number): ValidationError | null {
  if (typeof x !== 'number' || typeof y !== 'number') {
    return { field: 'coordinates', message: 'Coordinates must be numbers' };
  }

  if (!Number.isInteger(x) || !Number.isInteger(y)) {
    return { field: 'coordinates', message: 'Coordinates must be integers' };
  }

  if (x < 0 || x >= CANVAS_WIDTH) {
    return { field: 'x', message: `X must be between 0 and ${CANVAS_WIDTH - 1}` };
  }

  if (y < 0 || y >= CANVAS_HEIGHT) {
    return { field: 'y', message: `Y must be between 0 and ${CANVAS_HEIGHT - 1}` };
  }

  return null;
}

export function validateColor(color: string): ValidationError | null {
  if (!color) {
    return { field: 'color', message: 'Color is required' };
  }

  if (typeof color !== 'string') {
    return { field: 'color', message: 'Color must be a string' };
  }

  const upperColor = color.toUpperCase();

  if (!/^#[0-9A-F]{6}$/.test(upperColor)) {
    return { field: 'color', message: 'Color must be a valid hex code (e.g., #FF0000)' };
  }

  if (!PALETTE.includes(upperColor)) {
    return { field: 'color', message: 'Color must be from the approved palette' };
  }

  return null;
}

export function validatePixelPlacement(x: number, y: number, color: string): ValidationError | null {
  const coordError = validateCoordinates(x, y);
  if (coordError) return coordError;

  const colorError = validateColor(color);
  if (colorError) return colorError;

  return null;
}

export function isAdmin(email: string, adminEmails: string[]): boolean {
  return adminEmails.includes(email.toLowerCase());
}
