import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import { appConfig } from './config/env';
import { testConnection } from './config/database';
import { connectRedis, testRedisConnection } from './config/redis';
import { initializeSocketIO } from './sockets';
import { initializeEmailService, testEmailConnection } from './services/emailService';
import { globalLimiter } from './middleware/rateLimiter';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/logger';
import { logger } from './utils/logger';

import authRoutes from './routes/auth';
import canvasRoutes from './routes/canvas';
import pixelRoutes from './routes/pixels';
import adminRoutes from './routes/admin';
import statsRoutes from './routes/stats';

const app = express();
const httpServer = createServer(app);

app.use(helmet());
app.use(
  cors({
    origin: appConfig.allowedOrigins,
    credentials: true,
  })
);
app.use(express.json());
app.use(requestLogger);
app.use(globalLimiter);

app.get('/health', (_req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/canvas', canvasRoutes);
app.use('/api/pixels', pixelRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/stats', statsRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

initializeSocketIO(httpServer);

async function startServer() {
  try {
    logger.info('Starting server...');

    const dbConnected = await testConnection();
    if (!dbConnected) {
      throw new Error('Failed to connect to PostgreSQL');
    }

    await connectRedis();
    const redisConnected = await testRedisConnection();
    if (!redisConnected) {
      throw new Error('Failed to connect to Redis');
    }

    const emailInitialized = initializeEmailService();
    if (emailInitialized) {
      const emailWorking = await testEmailConnection();
      if (emailWorking) {
        logger.info('Email service configured and working');
      } else {
        logger.warn('Email service configured but connection test failed');
      }
    } else {
      logger.warn('Email service not configured - email verification will not work');
    }

    httpServer.listen(appConfig.port, () => {
      logger.info(`Server running on port ${appConfig.port}`);
      logger.info(`Environment: ${appConfig.nodeEnv}`);
      logger.info(
        `Canvas size: ${appConfig.canvasWidth}x${appConfig.canvasHeight}`
      );
      logger.info(`Pixel cooldown: ${appConfig.pixelCooldown} seconds`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  httpServer.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

startServer();
