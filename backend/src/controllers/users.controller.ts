import type { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { listUsers, getUser, createUser, updateUser, deleteUser } from '../services/users.service';
import { listUsersQuerySchema, createUserSchema, updateUserSchema } from '../dto/user.dto';

export async function listHandler(req: AuthRequest, res: Response) {
  const parsed = listUsersQuerySchema.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const result = await listUsers(parsed.data);
  return res.json(result);
}

export async function getByIdHandler(req: AuthRequest, res: Response) {
  const id = req.params.id;
  const user = await getUser(id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  return res.json(user);
}

export async function createHandler(req: AuthRequest, res: Response) {
  const parsed = createUserSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const actorId = req.user?.sub as string;
  const ip = req.ip;
  const userAgent = req.get('user-agent') || undefined;
  const user = await createUser({ ...parsed.data, actorId, ip, userAgent });
  return res.status(201).json(user);
}

export async function updateHandler(req: AuthRequest, res: Response) {
  const parsed = updateUserSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const actorId = req.user?.sub as string;
  const ip = req.ip;
  const userAgent = req.get('user-agent') || undefined;
  const user = await updateUser(req.params.id, { ...parsed.data, actorId, ip, userAgent });
  return res.json(user);
}

export async function deleteHandler(req: AuthRequest, res: Response) {
  const actorId = req.user?.sub as string;
  const ip = req.ip;
  const userAgent = req.get('user-agent') || undefined;
  await deleteUser(req.params.id, { id: actorId, ip, userAgent });
  return res.status(204).send();
}
