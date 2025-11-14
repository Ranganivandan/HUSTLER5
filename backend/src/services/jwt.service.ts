import jwt, { SignOptions, Secret } from 'jsonwebtoken';
import { config } from '../config';

export interface JwtPayloadBase {
  sub: string;
  role: string;
}

const accessSecret: Secret = config.jwt.accessSecret;
const refreshSecret: Secret = config.jwt.refreshSecret;

export function signAccessToken(payload: JwtPayloadBase, expiresIn = '15m') {
  return jwt.sign(payload, accessSecret, { expiresIn: expiresIn as SignOptions['expiresIn'] });
}

export function signRefreshToken(payload: JwtPayloadBase, expiresIn = '7d') {
  return jwt.sign(payload, refreshSecret, { expiresIn: expiresIn as SignOptions['expiresIn'] });
}

export function verifyAccessToken<T extends object = JwtPayloadBase>(token: string): T {
  return jwt.verify(token, accessSecret) as T;
}

export function verifyRefreshToken<T extends object = JwtPayloadBase>(token: string): T {
  return jwt.verify(token, refreshSecret) as T;
}
