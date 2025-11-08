import { Request, Response, NextFunction } from 'express';
import { ReportsService } from '../services/reports.service';
import { AuthRequest } from '../middlewares/auth.middleware';

// Helper to parse date range
const parseDateRange = (range: string) => {
  const now = new Date();
  let startDate: Date, endDate: Date;

  switch (range) {
    case 'current-month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      break;
    case 'last-month':
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      endDate = new Date(now.getFullYear(), now.getMonth(), 0);
      break;
    case 'quarter':
      const quarter = Math.floor(now.getMonth() / 3);
      startDate = new Date(now.getFullYear(), quarter * 3, 1);
      endDate = new Date(now.getFullYear(), (quarter + 1) * 3, 0);
      break;
    case 'year':
      startDate = new Date(now.getFullYear(), 0, 1);
      endDate = new Date(now.getFullYear(), 11, 31);
      break;
    default:
      // Default to current month
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  }

  return { startDate, endDate };
};

export const companyOverview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const range = (req.query.range as string) || 'current-month';
    const department = req.query.department as string | undefined;
    const { startDate, endDate } = parseDateRange(range);
    
    const report = await ReportsService.companyOverview(startDate, endDate, department);
    res.json(report);
  } catch (error) {
    next(error);
  }
};

export const departmentPerformance = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const range = (req.query.range as string) || 'current-month';
    const { startDate, endDate } = parseDateRange(range);
    
    const report = await ReportsService.departmentPerformance(startDate, endDate);
    res.json(report);
  } catch (error) {
    next(error);
  }
};

export const payrollSummary = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const range = (req.query.range as string) || 'current-month';
    const department = req.query.department as string | undefined;
    const { startDate, endDate } = parseDateRange(range);
    
    const report = await ReportsService.payrollSummary(startDate, endDate, department);
    res.json(report);
  } catch (error) {
    next(error);
  }
};

export const leaveUtilization = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const range = (req.query.range as string) || 'current-month';
    const department = req.query.department as string | undefined;
    const { startDate, endDate } = parseDateRange(range);
    
    const report = await ReportsService.leaveUtilization(startDate, endDate, department);
    res.json(report);
  } catch (error) {
    next(error);
  }
};

export const attendanceAnalytics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const range = (req.query.range as string) || 'current-month';
    const department = req.query.department as string | undefined;
    const { startDate, endDate } = parseDateRange(range);
    
    const report = await ReportsService.attendanceAnalytics(startDate, endDate, department);
    res.json(report);
  } catch (error) {
    next(error);
  }
};

export const employeeGrowth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const range = (req.query.range as string) || 'year';
    const { startDate, endDate } = parseDateRange(range);
    
    const report = await ReportsService.employeeGrowth(startDate, endDate);
    res.json(report);
  } catch (error) {
    next(error);
  }
};
