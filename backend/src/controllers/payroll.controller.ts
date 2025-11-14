import type { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { PayrollService } from '../services/payroll.service';
import { asyncHandler } from '../middlewares/error-handler.middleware';
import { z } from 'zod';

const runSchema = z.object({
  periodStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  periodEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const run = asyncHandler(async (req: AuthRequest, res: Response) => {
  const parsed = runSchema.safeParse(req.body || {});
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() });
  }
  const start = new Date(parsed.data.periodStart);
  const end = new Date(parsed.data.periodEnd);
  const pr = await PayrollService.run({ id: req.user!.sub, role: req.user!.role }, start, end);
  return res.status(201).json(pr);
});

export const getById = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await PayrollService.getById({ id: req.user!.sub, role: req.user!.role }, req.params.id);
    return res.json(data);
  } catch (e) {
    const err = e as any;
    return res.status(err.status || 500).json({ error: err.message || 'Error' });
  }
});

export const listUserPayslips = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await PayrollService.getPayslips({ id: req.user!.sub, role: req.user!.role }, req.params.userId);
    return res.json(data);
  } catch (e) {
    const err = e as any;
    return res.status(err.status || 500).json({ error: err.message || 'Error' });
  }
});

export const getMyPayslips = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await PayrollService.getPayslips({ id: req.user!.sub, role: req.user!.role }, req.user!.sub);
    return res.json(data);
  } catch (e) {
    const err = e as any;
    return res.status(err.status || 500).json({ error: err.message || 'Error' });
  }
});

const inputsSchema = z.object({
  periodStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  periodEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  department: z.string().optional(),
});

export const getInputs = asyncHandler(async (req: AuthRequest, res: Response) => {
  const parsed = inputsSchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid query', details: parsed.error.flatten() });
  }
  const start = new Date(parsed.data.periodStart);
  const end = new Date(parsed.data.periodEnd);
  try {
    const data = await PayrollService.computeInputs({ id: req.user!.sub, role: req.user!.role }, start, end, String(parsed.data.department || 'all'));
    return res.json(data);
  } catch (e) {
    const err = e as any;
    return res.status(err.status || 500).json({ error: err.message || 'Error' });
  }
});