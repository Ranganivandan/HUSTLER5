import type { Request, Response } from 'express';
import { login as svcLogin, signup as svcSignup, refresh as svcRefresh, logout as svcLogout, changePassword as svcChangePassword } from '../services/auth.service';
import { signupSchema, loginSchema, changePasswordSchema } from '../dto/auth.dto';
import type { AuthRequest } from '../middlewares/auth.middleware';
import { asyncHandler } from '../middlewares/error-handler.middleware';
import { ValidationError, UnauthorizedError } from '../utils/errors';

const REFRESH_COOKIE = 'refreshToken';

function cookieOpts() {
  return {
    httpOnly: true as const,
    sameSite: 'strict' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/v1/auth',
  };
}

export const signup = asyncHandler(async (req: Request, res: Response) => {
  const parsed = signupSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ValidationError('Invalid signup data');
  }
  const { email, password, fullName } = parsed.data;

  const { user, accessToken } = await svcSignup(email, password, fullName);
  return res.status(201).json({ user: { id: user.id, email: user.email, name: user.name }, accessToken });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ValidationError('Invalid login credentials');
  }
  const { email, password } = parsed.data;

  const ip = req.ip;
  const userAgent = req.get('user-agent') || undefined;

  const { user, accessToken, refreshToken } = await svcLogin(email, password, ip, userAgent);
  res.cookie(REFRESH_COOKIE, refreshToken, cookieOpts());
  return res.json({ accessToken, user });
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const token = req.cookies?.[REFRESH_COOKIE];
  if (!token) {
    throw new UnauthorizedError('Missing refresh token');
  }
  const { accessToken, refreshToken } = await svcRefresh(token);
  res.cookie(REFRESH_COOKIE, refreshToken, cookieOpts());
  return res.json({ accessToken });
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const token = req.cookies?.[REFRESH_COOKIE];
  await svcLogout(token);
  res.clearCookie(REFRESH_COOKIE, cookieOpts());
  return res.status(204).send();
});

export const changePassword = asyncHandler(async (req: AuthRequest, res: Response) => {
  const parsed = changePasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ValidationError('Invalid password data');
  }
  
  const userId = req.user?.sub;
  if (!userId) {
    throw new UnauthorizedError();
  }
  
  const { currentPassword, newPassword } = parsed.data;
  await svcChangePassword(userId, currentPassword, newPassword);
  
  // Clear refresh token cookie to force re-login
  res.clearCookie(REFRESH_COOKIE, cookieOpts());
  
  return res.json({ 
    success: true, 
    message: 'Password changed successfully. Please login again with your new password.' 
  });
});
