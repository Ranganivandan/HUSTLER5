import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { run, getById, listUserPayslips, getMyPayslips } from '../controllers/payroll.controller';

export const payrollRouter = Router();

payrollRouter.use(authenticate);

payrollRouter.post('/run', authorize(['admin','payroll']), run);
payrollRouter.get('/:id', authorize(['admin','payroll']), getById);

// Employee self-service
payrollRouter.get('/payslips/me', getMyPayslips);

// Admin/payroll view any user
payrollRouter.get('/payslips/:userId', authorize(['admin','payroll','hr']), listUserPayslips);
