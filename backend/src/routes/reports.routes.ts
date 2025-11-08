import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import * as reportsController from '../controllers/reports.controller';

const reportsRouter = Router();

// All routes require authentication and admin/hr role
reportsRouter.get('/company-overview', authenticate, authorize(['admin', 'hr']), reportsController.companyOverview);
reportsRouter.get('/department-performance', authenticate, authorize(['admin', 'hr']), reportsController.departmentPerformance);
reportsRouter.get('/payroll-summary', authenticate, authorize(['admin', 'hr', 'payroll']), reportsController.payrollSummary);
reportsRouter.get('/leave-utilization', authenticate, authorize(['admin', 'hr']), reportsController.leaveUtilization);
reportsRouter.get('/attendance-analytics', authenticate, authorize(['admin', 'hr']), reportsController.attendanceAnalytics);
reportsRouter.get('/employee-growth', authenticate, authorize(['admin', 'hr']), reportsController.employeeGrowth);

export default reportsRouter;
