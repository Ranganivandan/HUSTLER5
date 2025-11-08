import { Router } from 'express';
import { healthHandler } from '../controllers/health.controller';
import { authRouter } from './auth.routes';

export const router = Router();

// versioned API
const v1 = Router();

v1.get('/health', healthHandler);
v1.use('/auth', authRouter);

router.use('/v1', v1);
