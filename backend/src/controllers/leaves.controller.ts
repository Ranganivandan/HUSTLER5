import type { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { applyLeaveSchema, listLeavesQuerySchema, decisionSchema } from '../dto/leaves.dto';
import { LeavesService } from '../services/leaves.service';

export async function apply(req: AuthRequest, res: Response) {
  try {
    const parsed = applyLeaveSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    const { type, startDate, endDate, reason } = parsed.data;
    const created = await LeavesService.apply({ userId: req.user!.sub, type, startDate, endDate, reason, ip: req.ip, userAgent: req.get('user-agent') || undefined });
    return res.status(201).json(created);
  } catch (e) {
    const err = e as any;
    return res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
  }
}

export async function list(req: AuthRequest, res: Response) {
  try {
    const parsed = listLeavesQuerySchema.safeParse(req.query);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    const data = await LeavesService.list({ actor: { id: req.user!.sub, role: req.user!.role }, ...parsed.data });
    return res.json(data);
  } catch (e) {
    const err = e as any;
    return res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
  }
}

export async function approve(req: AuthRequest, res: Response) {
  try {
    const id = req.params.id;
    const updated = await LeavesService.approve(id, { id: req.user!.sub, role: req.user!.role }, req.ip, req.get('user-agent') || undefined);
    return res.json(updated);
  } catch (e) {
    const err = e as any;
    return res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
  }
}

export async function reject(req: AuthRequest, res: Response) {
  try {
    const id = req.params.id;
    const parsed = decisionSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    const updated = await LeavesService.reject(id, { id: req.user!.sub, role: req.user!.role }, parsed.data.reason, req.ip, req.get('user-agent') || undefined);
    return res.json(updated);
  } catch (e) {
    const err = e as any;
    return res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
  }
}
