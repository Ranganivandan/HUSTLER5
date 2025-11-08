import type { Request, Response, NextFunction } from 'express';
import { logger } from '../services/logger.service';

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  res.on('finish', () => {
    const ms = Date.now() - start;
    logger.info('http_request', {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      durationMs: ms,
    });
  });
  next();
}
