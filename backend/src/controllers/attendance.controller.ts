import type { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { AttendanceService } from '../services/attendance.service';
import { checkinSchema, checkoutSchema, listAttendanceQuery } from '../dto/attendance.dto';
import { asyncHandler } from '../middlewares/error-handler.middleware';

export const checkin = asyncHandler(async (req: AuthRequest, res: Response) => {
  const parsed = checkinSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid request data', details: parsed.error.flatten() });
  }
  const { method, publicId, location } = parsed.data;
  const result = await AttendanceService.checkin(req.user!.sub, method, publicId, location);
  return res.json(result);
});

export const checkout = asyncHandler(async (req: AuthRequest, res: Response) => {
  const parsed = checkoutSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid request data', details: parsed.error.flatten() });
  }
  const { location } = parsed.data;
  const record = await AttendanceService.checkout(req.user!.sub, location);
  return res.json({ record });
});

export const list = asyncHandler(async (req: AuthRequest, res: Response) => {
  const parsed = listAttendanceQuery.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const items = await AttendanceService.list({ id: req.user!.sub, role: req.user!.role }, parsed.data);
  return res.json(items);
});

export const stats = asyncHandler(async (req: AuthRequest, res: Response) => {
  const parsed = listAttendanceQuery.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const s = await AttendanceService.stats({ id: req.user!.sub, role: req.user!.role }, parsed.data);
  return res.json(s);
});

export const summary = asyncHandler(async (req: AuthRequest, res: Response) => {
  const month = req.query.month as string | undefined;
  const department = req.query.department as string | undefined;
  const result = await AttendanceService.summary({ role: req.user!.role }, { month, department });
  return res.json(result);
});

export const listAll = asyncHandler(async (req: AuthRequest, res: Response) => {
  const month = req.query.month as string | undefined;
  const userId = req.query.userId as string | undefined;
  const result = await AttendanceService.listAll({ role: req.user!.role }, { month, userId });
  return res.json(result);
});
