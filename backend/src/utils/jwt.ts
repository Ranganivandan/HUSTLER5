import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export interface JwtPayloadBase {
  sub: string;
  role: string;
}

export function signAccessToken(payload: JwtPayloadBase, expiresIn = '15m') {
  return jwt.sign(payload, env.jwtAccessSecret, { expiresIn });
}

export function signRefreshToken(payload: JwtPayloadBase, expiresIn = '7d') {
  return jwt.sign(payload, env.jwtRefreshSecret, { expiresIn });
}

export function verifyAccessToken<T extends object = JwtPayloadBase>(token: string): T {
  return jwt.verify(token, env.jwtAccessSecret) as T;
}

export function verifyRefreshToken<T extends object = JwtPayloadBase>(token: string): T {
  return jwt.verify(token, env.jwtRefreshSecret) as T;
}
