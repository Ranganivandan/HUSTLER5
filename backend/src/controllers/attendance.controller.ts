import type { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { AttendanceService } from '../services/attendance.service';
import { checkinSchema, listAttendanceQuery } from '../dto/attendance.dto';

export async function checkin(req: AuthRequest, res: Response) {
  const { method, publicId, location } = req.body;
  const result = await AttendanceService.checkin(req.user!.sub, method, publicId, location);
  return res.json(result);
}

export async function checkout(req: AuthRequest, res: Response) {
  const { location } = req.body;
  const record = await AttendanceService.checkout(req.user!.sub, location);
  return res.json({ record });
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

export async function listAll(req: AuthRequest, res: Response) {
  const month = req.query.month as string | undefined;
  const userId = req.query.userId as string | undefined;
  const result = await AttendanceService.listAll({ role: req.user!.role }, { month, userId });
  return res.json(result);
}
