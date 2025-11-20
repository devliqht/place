import { createClient } from 'redis';
import { redisConfig } from './env';

export const redisClient = createClient({
  socket: {
    host: redisConfig.host,
    port: redisConfig.port
  },
  password: redisConfig.password
});

redisClient.on('error', (err) => {
  console.error('Redis Client Error:', err);
});

redisClient.on('connect', () => {
  console.log('Redis client connected');
});

redisClient.on('ready', () => {
  console.log('Redis client ready');
});

export async function connectRedis(): Promise<void> {
  try {
    await redisClient.connect();
    console.log('Redis connected successfully');
  } catch (error) {
    console.error('Redis connection error:', error);
    throw error;
  }
}

export async function testRedisConnection(): Promise<boolean> {
  try {
    const pong = await redisClient.ping();
    console.log('Redis ping:', pong);
    return pong === 'PONG';
  } catch (error) {
    console.error('Redis test error:', error);
    return false;
  }
}
