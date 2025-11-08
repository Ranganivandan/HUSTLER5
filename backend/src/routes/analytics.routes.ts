import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { overview, attendance, payroll } from '../controllers/analytics.controller';

export const analyticsRouter = Router();

analyticsRouter.use(authenticate);

// Overview for admin/hr/payroll
analyticsRouter.get('/overview', authorize(['admin','hr','payroll']), overview);

// Attendance chart (admin/hr)
analyticsRouter.get('/attendance', authorize(['admin','hr']), attendance);

// Payroll totals (admin/payroll)
analyticsRouter.get('/payroll', authorize(['admin','payroll']), payroll);
