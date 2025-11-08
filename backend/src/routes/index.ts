import { Router } from 'express';
import { healthHandler } from '../controllers/health.controller';
import { authRouter } from './auth.routes';
import { usersRouter } from './users.routes';
import { profileRouter } from './profile.routes';
import { attendanceRouter } from './attendance.routes';
import { leavesRouter } from './leaves.routes';
import { payrollRouter } from './payroll.routes';
import { analyticsRouter } from './analytics.routes';
import { adminRouter } from './admin.routes';

export const router = Router();

// versioned API
const v1 = Router();

v1.get('/health', healthHandler);
v1.use('/auth', authRouter);
v1.use('/users', usersRouter);
v1.use('/profile', profileRouter);
v1.use('/attendance', attendanceRouter);
v1.use('/leaves', leavesRouter);
v1.use('/payroll', payrollRouter);
v1.use('/analytics', analyticsRouter);
v1.use('/admin', adminRouter);

router.use('/v1', v1);
