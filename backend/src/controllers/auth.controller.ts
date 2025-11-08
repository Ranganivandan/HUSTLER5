import type { Request, Response } from 'express';
import { login as svcLogin, signup as svcSignup, refresh as svcRefresh, logout as svcLogout } from '../services/auth.service';
import { signupSchema, loginSchema } from '../dto/auth.dto';

const REFRESH_COOKIE = 'refreshToken';

function cookieOpts() {
  return {
    httpOnly: true as const,
    sameSite: 'strict' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/v1/auth',
  };
}

export async function signup(req: Request, res: Response) {
  const parsed = signupSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { email, password, fullName } = parsed.data;

  const { user, accessToken } = await svcSignup(email, password, fullName);
  return res.status(201).json({ user: { id: user.id, email: user.email, name: user.name }, accessToken });
}

export async function login(req: Request, res: Response) {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { email, password } = parsed.data;

  const ip = req.ip;
  const userAgent = req.get('user-agent') || undefined;

  const { user, accessToken, refreshToken } = await svcLogin(email, password, ip, userAgent);
  res.cookie(REFRESH_COOKIE, refreshToken, cookieOpts());
  return res.json({ accessToken, user });
}

export async function refresh(req: Request, res: Response) {
  const token = req.cookies?.[REFRESH_COOKIE];
  if (!token) return res.status(401).json({ error: 'Missing token' });
  const { accessToken, refreshToken } = await svcRefresh(token);
  res.cookie(REFRESH_COOKIE, refreshToken, cookieOpts());
  return res.json({ accessToken });
}

export async function logout(req: Request, res: Response) {
  const token = req.cookies?.[REFRESH_COOKIE];
  await svcLogout(token);
  res.clearCookie(REFRESH_COOKIE, cookieOpts());
  return res.status(204).send();
}
