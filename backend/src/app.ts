import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { router as apiRouter } from './routes';
import { requestLogger } from './middlewares/request-logger.middleware';
import { errorHandler } from './middlewares/error-handler.middleware';
import { sanitizeInput } from './middlewares/sanitize.middleware';
import cookieParser from 'cookie-parser';

export function createApp() {
  const app = express();

  // Security headers
  app.use(helmet());
  
  // CORS configuration
  app.use(cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Content-Length'],
    maxAge: 86400,
  }));
  app.options('*', cors());
  
  // Body parsing with size limits
  app.use(express.json({ 
    limit: '2mb',
    strict: true, // Only accept arrays and objects
  }));
  app.use(express.urlencoded({ 
    extended: true,
    limit: '2mb',
    parameterLimit: 100, // Limit number of parameters
  }));
  
  app.use(cookieParser());
  app.use(requestLogger);
  
  // Input sanitization (must be after body parsing)
  app.use(sanitizeInput);

  app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok' });
  });

  app.use(apiRouter);

  // 404 handler
  app.use((_req: Request, res: Response) => {
    res.status(404).json({ error: 'Not Found' });
  });

  // Centralized error handler (must be last)
  app.use(errorHandler);

  return app;
}
