import type { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { ProfileService } from '../services/profile.service';
import { updateMyProfileSchema, parsedResumeSchema } from '../dto/profile.dto';

export async function list(req: AuthRequest, res: Response) {
  const role = req.user!.role;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 50;
  const search = req.query.search as string | undefined;
  const data = await ProfileService.list(role, page, limit, search);
  return res.json(data);
}

export async function getMe(req: AuthRequest, res: Response) {
  const userId = req.user!.sub;
  const data = await ProfileService.getMe(userId);
  return res.json(data);
}

export async function updateMe(req: AuthRequest, res: Response) {
  const parsed = updateMyProfileSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const userId = req.user!.sub;
  const updated = await ProfileService.updateMe(userId, parsed.data);
  return res.json(updated);
}

export async function getByUserId(req: AuthRequest, res: Response) {
  const role = req.user!.role;
  const userId = req.params.userId;
  const data = await ProfileService.getByUserId(role, userId);
  if (!data) return res.status(404).json({ error: 'Profile not found' });
  return res.json(data);
}

export async function postParsedResume(req: AuthRequest, res: Response) {
  // body can be arbitrary JSON; sanitize inside service
  const userId = req.params.userId;
  // optional validation placeholder
  parsedResumeSchema.parse(req.body);
  const saved = await ProfileService.storeParsedResumeInternal(userId, req.body);
  return res.status(201).json({ ok: true, profileId: saved.userId });
}
