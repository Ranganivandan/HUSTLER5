import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { prisma } from '../lib/prisma';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { z } from 'zod';

export const authRouter = Router();

const ROLE_VALUES = ['employee', 'hr', 'payroll', 'admin'] as const;
type RoleName = (typeof ROLE_VALUES)[number];

const registerSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  password: z.string().min(6),
  role: z.enum(ROLE_VALUES).optional(),
});

authRouter.post('/register', async (req: Request, res: Response) => {
  const parse = registerSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: parse.error.flatten() });
  const { email, name, password, role } = parse.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return res.status(409).json({ error: 'Email already registered' });

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      email,
      name,
      passwordHash,
      role: {
        connect: { name: role ?? 'employee' },
      },
    },
    include: { role: true },
  });

  const roleName: RoleName = (user.role?.name as RoleName) ?? 'employee';

  const access = signAccessToken({ sub: user.id, role: roleName });
  const refresh = signRefreshToken({ sub: user.id, role: roleName });
  const refreshHash = await bcrypt.hash(refresh, 10);
  await prisma.user.update({ where: { id: user.id }, data: { refreshTokenHash: refreshHash } });

  res.status(201).json({
    accessToken: access,
    refreshToken: refresh,
    user: { id: user.id, email: user.email, name: user.name, role: roleName },
  });
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

authRouter.post('/login', async (req: Request, res: Response) => {
  const parse = loginSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: parse.error.flatten() });
  const { email, password } = parse.data;

  const user = await prisma.user.findUnique({
    where: { email },
    include: { role: true },
  });
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

  const roleName: RoleName = (user.role?.name as RoleName) ?? 'employee';

  const access = signAccessToken({ sub: user.id, role: roleName });
  const refresh = signRefreshToken({ sub: user.id, role: roleName });
  const refreshHash = await bcrypt.hash(refresh, 10);
  await prisma.user.update({ where: { id: user.id }, data: { refreshTokenHash: refreshHash } });

  res.json({
    accessToken: access,
    refreshToken: refresh,
    user: { id: user.id, email: user.email, name: user.name, role: roleName },
  });
});

const refreshSchema = z.object({ refreshToken: z.string().min(10) });

authRouter.post('/refresh', async (req: Request, res: Response) => {
  const parse = refreshSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: parse.error.flatten() });
  const { refreshToken } = parse.data;

  // Verify against stored hash
  let payload: { sub: string; role: string } | null = null;
  try {
    payload = verifyRefreshToken<{ sub: string; role: string }>(refreshToken);
  } catch {
    payload = null;
  }

  if (!payload) return res.status(401).json({ error: 'Invalid token' });
  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    include: { role: true },
  });
  if (!user || !user.refreshTokenHash) return res.status(401).json({ error: 'Invalid token' });
  const ok = await bcrypt.compare(refreshToken, user.refreshTokenHash);
  if (!ok) return res.status(401).json({ error: 'Invalid token' });

  const roleName: RoleName = (user.role?.name as RoleName) ?? 'employee';

  const access = signAccessToken({ sub: user.id, role: roleName });
  const nextRefresh = signRefreshToken({ sub: user.id, role: roleName });
  const nextRefreshHash = await bcrypt.hash(nextRefresh, 10);
  await prisma.user.update({ where: { id: user.id }, data: { refreshTokenHash: nextRefreshHash } });

  res.json({ accessToken: access, refreshToken: nextRefresh });
});
