import type { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { AnalyticsService } from '../services/analytics.service';

export async function overview(req: AuthRequest, res: Response) {
  const data = await AnalyticsService.overview();
  return res.json(data);
}

export async function attendance(req: AuthRequest, res: Response) {
  const month = (req.query.month as string) || new Date().toISOString().slice(0,7);
  const data = await AnalyticsService.attendanceByDay(month);
  return res.json(data);
}

export async function payroll(req: AuthRequest, res: Response) {
  const period = (req.query.period as string) || '';
  // Expect YYYY-MM-DD:YYYY-MM-DD
  const [startStr, endStr] = period.split(':');
  if (!startStr || !endStr) return res.status(400).json({ error: 'period must be YYYY-MM-DD:YYYY-MM-DD' });
  const start = new Date(startStr);
  const end = new Date(endStr);
  const data = await AnalyticsService.payrollTotals(start, end);
  return res.json(data);
}
