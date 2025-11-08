import type { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { PayrollService } from '../services/payroll.service';

export async function run(req: AuthRequest, res: Response) {
  const { periodStart, periodEnd } = req.body || {};
  if (!periodStart || !periodEnd) return res.status(400).json({ error: 'periodStart and periodEnd are required (YYYY-MM-DD)' });
  const start = new Date(periodStart);
  const end = new Date(periodEnd);
  try {
    const pr = await PayrollService.run({ id: req.user!.sub, role: req.user!.role }, start, end);
    return res.status(201).json(pr);
  } catch (e) {
    const err = e as any;
    return res.status(err.status || 500).json({ error: err.message || 'Error' });
  }
}

export async function getById(req: AuthRequest, res: Response) {
  try {
    const data = await PayrollService.getById({ id: req.user!.sub, role: req.user!.role }, req.params.id);
    return res.json(data);
  } catch (e) {
    const err = e as any;
    return res.status(err.status || 500).json({ error: err.message || 'Error' });
  }
}

export async function listUserPayslips(req: AuthRequest, res: Response) {
  try {
    const data = await PayrollService.getPayslips({ id: req.user!.sub, role: req.user!.role }, req.params.userId);
    return res.json(data);
  } catch (e) {
    const err = e as any;
    return res.status(err.status || 500).json({ error: err.message || 'Error' });
  }
}

export async function getMyPayslips(req: AuthRequest, res: Response) {
  try {
    const data = await PayrollService.getPayslips({ id: req.user!.sub, role: req.user!.role }, req.user!.sub);
    return res.json(data);
  } catch (e) {
    const err = e as any;
    return res.status(err.status || 500).json({ error: err.message || 'Error' });
  }
}
