import type { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { listUsers, getUser, createUser, updateUser, deleteUser } from '../services/users.service';
import { listUsersQuerySchema, createUserSchema, updateUserSchema } from '../dto/user.dto';
import { asyncHandler } from '../middlewares/error-handler.middleware';
import { ValidationError, NotFoundError } from '../utils/errors';

export const listHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const parsed = listUsersQuerySchema.safeParse(req.query);
  if (!parsed.success) throw new ValidationError('Invalid query parameters');
  const result = await listUsers(parsed.data);
  return res.json(result);
});

export const getByIdHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const id = req.params.id;
  const user = await getUser(id);
  if (!user) throw new NotFoundError('User not found');
  return res.json(user);
});

export const createHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const parsed = createUserSchema.safeParse(req.body);
  if (!parsed.success) throw new ValidationError('Invalid user data');
  const actorId = req.user?.sub as string;
  const ip = req.ip;
  const userAgent = req.get('user-agent') || undefined;
  const result = await createUser({ ...parsed.data, actorId, ip, userAgent });
  
  // Return user with generated password if applicable
  return res.status(201).json({
    user: result.user,
    message: result.generatedPassword 
      ? 'User created successfully. Credentials have been sent to their email.' 
      : 'User created successfully.',
    generatedPassword: result.generatedPassword, // Only present if auto-generated
  });
});

export const updateHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const parsed = updateUserSchema.safeParse(req.body);
  if (!parsed.success) throw new ValidationError('Invalid update data');
  const actorId = req.user?.sub as string;
  const ip = req.ip;
  const userAgent = req.get('user-agent') || undefined;
  const user = await updateUser(req.params.id, { ...parsed.data, actorId, ip, userAgent });
  return res.json(user);
});

export const deleteHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const actorId = req.user?.sub as string;
  const ip = req.ip;
  const userAgent = req.get('user-agent') || undefined;
  await deleteUser(req.params.id, { id: actorId, ip, userAgent });
  return res.status(204).send();
});
