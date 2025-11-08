import type { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { AdminService } from '../services/admin.service';

export async function getAuditLogs(req: AuthRequest, res: Response) {
  const role = req.user!.role;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 50;
  const entity = req.query.entity as string | undefined;
  const action = req.query.action as string | undefined;
  const userId = req.query.userId as string | undefined;

  const data = await AdminService.getAuditLogs(role, page, limit, { entity, action, userId });
  return res.json(data);
}

export async function getAnomalies(req: AuthRequest, res: Response) {
  const role = req.user!.role;
  const data = await AdminService.getAnomalies(role);
  return res.json(data);
}

export async function deleteUser(req: AuthRequest, res: Response) {
  const role = req.user!.role;
  const userId = req.params.id;
  const user = await AdminService.deleteUser(role, userId);
  return res.json({ success: true, user });
}
