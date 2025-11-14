import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { run, getById, listUserPayslips, getMyPayslips, getInputs } from '../controllers/payroll.controller';
import { getTemplates, saveTemplates, deleteTemplate } from '../controllers/payroll.templates.controller';

export const payrollRouter = Router();

payrollRouter.use(authenticate);

payrollRouter.post('/run', authorize(['admin','payroll']), run);

// Employee self-service
payrollRouter.get('/payslips/me', getMyPayslips);

// Admin/payroll view any user
payrollRouter.get('/payslips/:userId', authorize(['admin','payroll','hr']), listUserPayslips);

// Compute per-employee inputs for a period (no persistence)
payrollRouter.get('/inputs', authorize(['admin','payroll','hr']), getInputs);

// Payroll templates CRUD via settings
payrollRouter.get('/templates', authorize(['admin','payroll']), getTemplates);
payrollRouter.post('/templates', authorize(['admin','payroll']), saveTemplates);
payrollRouter.delete('/templates/:id', authorize(['admin','payroll']), deleteTemplate);

// Get payrun by ID must be registered after specific routes to avoid shadowing
payrollRouter.get('/:id', authorize(['admin','payroll']), getById);
