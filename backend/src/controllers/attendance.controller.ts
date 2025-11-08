import type { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { AttendanceService } from '../services/attendance.service';
import { checkinSchema, listAttendanceQuery } from '../dto/attendance.dto';

export async function checkin(req: AuthRequest, res: Response) {
  const parsed = checkinSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { method, publicId } = parsed.data;
  const result = await AttendanceService.checkin(req.user!.sub, method, publicId);
  return res.status(201).json(result);
}

export async function checkout(req: AuthRequest, res: Response) {
  const rec = await AttendanceService.checkout(req.user!.sub);
  return res.json(rec);
}

export async function list(req: AuthRequest, res: Response) {
  const parsed = listAttendanceQuery.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const items = await AttendanceService.list({ id: req.user!.sub, role: req.user!.role }, parsed.data);
  return res.json(items);
}

export async function stats(req: AuthRequest, res: Response) {
  const parsed = listAttendanceQuery.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const s = await AttendanceService.stats({ id: req.user!.sub, role: req.user!.role }, parsed.data);
  return res.json(s);
}

export async function summary(req: AuthRequest, res: Response) {
  const month = req.query.month as string | undefined;
  const department = req.query.department as string | undefined;
  const result = await AttendanceService.summary({ role: req.user!.role }, { month, department });
  return res.json(result);
}
