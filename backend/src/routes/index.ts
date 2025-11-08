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
import settingsRouter from './settings.routes';
import reportsRouter from './reports.routes';
import publicRouter from './public.routes';
import { officeLocationRouter } from './office-location.routes';

export const router = Router();

// versioned API
const v1 = Router();

v1.get('/health', healthHandler);
v1.use('/public', publicRouter);
v1.use('/auth', authRouter);
v1.use('/users', usersRouter);
v1.use('/profile', profileRouter);
v1.use('/attendance', attendanceRouter);
v1.use('/leaves', leavesRouter);
v1.use('/payroll', payrollRouter);
v1.use('/analytics', analyticsRouter);
v1.use('/admin', adminRouter);
v1.use('/settings', settingsRouter);
v1.use('/reports', reportsRouter);
v1.use('/office-location', officeLocationRouter);

router.use('/v1', v1);
