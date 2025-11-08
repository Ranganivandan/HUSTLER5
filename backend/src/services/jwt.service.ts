import jwt from 'jsonwebtoken';
import { config } from '../config';

export interface JwtPayloadBase {
  sub: string;
  role: string;
}

export function signAccessToken(payload: JwtPayloadBase, expiresIn = '15m') {
  return jwt.sign(payload, config.jwt.accessSecret, { expiresIn });
}

export function signRefreshToken(payload: JwtPayloadBase, expiresIn = '7d') {
  return jwt.sign(payload, config.jwt.refreshSecret, { expiresIn });
}

export function verifyAccessToken<T extends object = JwtPayloadBase>(token: string): T {
  return jwt.verify(token, config.jwt.accessSecret) as T;
}

export function verifyRefreshToken<T extends object = JwtPayloadBase>(token: string): T {
  return jwt.verify(token, config.jwt.refreshSecret) as T;
}
