import * as bcrypt from 'bcrypt';
import crypto from 'crypto';
import { prisma } from './prisma.service';
import { config } from '../config';
import { signAccessToken } from './jwt.service';
import { SessionRepository } from '../repositories/session.repository';

// Simple in-memory rate limiter for dev (key: email)
const attempts = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 5 * 60 * 1000; // 5 min
const MAX_ATTEMPTS = 5;

function checkRateLimit(key: string) {
  const now = Date.now();
  const item = attempts.get(key);
  if (!item || item.resetAt < now) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return;
  }
  item.count += 1;
  if (item.count > MAX_ATTEMPTS) {
    throw Object.assign(new Error('Too many attempts, try again later'), { status: 429 });
  }
}

function hashRefreshToken(token: string) {
  // bcrypt hash to store; could also use HMAC
  return bcrypt.hash(token, config.bcryptRounds);
}

export async function signup(email: string, password: string, fullName: string) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw Object.assign(new Error('Email already registered'), { status: 409 });

  // find employee role
  const role = await prisma.role.findUnique({ where: { name: 'employee' } });
  if (!role) throw new Error('Employee role missing. Run seed.');

  const passwordHash = await bcrypt.hash(password, config.bcryptRounds);

  const user = await prisma.$transaction(async (tx) => {
    const created = await tx.user.create({ data: { email, name: fullName, passwordHash, roleId: role.id } });
    
    // Generate employee code based on name
    const year = new Date().getFullYear().toString().slice(-2);
    const count = await tx.employeeProfile.count();
    const sequence = String(count + 1).padStart(5, '0');
    const nameParts = fullName.trim().split(/\s+/);
    let initials = '';
    if (nameParts.length >= 2) {
      initials = (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase();
    } else if (nameParts.length === 1 && nameParts[0].length >= 2) {
      initials = nameParts[0].slice(0, 2).toUpperCase();
    } else {
      initials = nameParts[0] ? (nameParts[0][0] + nameParts[0][0]).toUpperCase() : 'XX';
    }
    const employeeCode = `OI${initials}${year}${sequence}`;
    
    await tx.employeeProfile.create({ data: { userId: created.id, employeeCode } });
    return created;
  });

  const accessToken = signAccessToken({ sub: user.id, role: 'employee' }, config.jwt.accessTtl);
  return { user, accessToken };
}

export async function login(email: string, password: string, ip?: string, userAgent?: string) {
  checkRateLimit(email.toLowerCase());

  const user = await prisma.user.findUnique({ where: { email }, include: { role: true } });
  if (!user) throw Object.assign(new Error('Invalid credentials'), { status: 401 });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) throw Object.assign(new Error('Invalid credentials'), { status: 401 });

  const roleName = user.role.name;
  const accessToken = signAccessToken({ sub: user.id, role: roleName }, config.jwt.accessTtl);

  // Issue a random refresh token
  const refreshToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = await hashRefreshToken(refreshToken);
  const expiresAt = new Date(Date.now() + parseTtlMs(config.jwt.refreshTtl));
  await SessionRepository.create({ userId: user.id, tokenHash, expiresAt, ip, userAgent });

  return { accessToken, refreshToken, user: { id: user.id, email: user.email, name: user.name, role: roleName } };
}

export async function refresh(refreshToken: string) {
  const sessions = await SessionRepository.findValidByUser; // not used here, we match by token
  const tokenHashCandidates = await prisma.session.findMany({ where: { revokedAt: null, expiresAt: { gt: new Date() } }, select: { id: true, userId: true, token: true } });

  // Check provided token matches any hash
  let matched: { id: string; userId: string } | null = null;
  for (const s of tokenHashCandidates) {
    const ok = await bcrypt.compare(refreshToken, s.token);
    if (ok) {
      matched = { id: s.id, userId: s.userId };
      break;
    }
  }
  if (!matched) throw Object.assign(new Error('Invalid token'), { status: 401 });

  const user = await prisma.user.findUniqueOrThrow({ where: { id: matched.userId } });
  const role = await prisma.role.findUniqueOrThrow({ where: { id: user.roleId } });
  const accessToken = signAccessToken({ sub: user.id, role: role.name }, config.jwt.accessTtl);

  // rotate refresh token
  const newRefresh = crypto.randomBytes(32).toString('hex');
  const newHash = await hashRefreshToken(newRefresh);
  const expiresAt = new Date(Date.now() + parseTtlMs(config.jwt.refreshTtl));
  await prisma.session.update({ where: { id: matched.id }, data: { token: newHash, expiresAt } });

  return { accessToken, refreshToken: newRefresh };
}

export async function logout(refreshToken?: string, userId?: string) {
  if (refreshToken) {
    const list = await prisma.session.findMany({ where: { revokedAt: null } });
    for (const s of list) {
      const ok = await bcrypt.compare(refreshToken, s.token);
      if (ok) {
        await prisma.session.update({ where: { id: s.id }, data: { revokedAt: new Date() } });
        return;
      }
    }
  }
  if (userId) {
    await SessionRepository.revokeAllForUser(userId);
  }
}

export async function changePassword(userId: string, currentPassword: string, newPassword: string) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  
  // Verify current password
  const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!isValid) {
    throw Object.assign(new Error('Current password is incorrect'), { status: 401 });
  }
  
  // Hash new password
  const newPasswordHash = await bcrypt.hash(newPassword, config.bcryptRounds);
  
  // Update password
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: newPasswordHash },
  });
  
  // Revoke all existing sessions for security (force re-login)
  await SessionRepository.revokeAllForUser(userId);
  
  return { success: true };
}

export function parseTtlMs(ttl: string): number {
  // simplistic parser: supports s, m, h, d
  const match = /^(\d+)(s|m|h|d)$/.exec(ttl);
  if (!match) return 15 * 60 * 1000;
  const n = Number(match[1]);
  const unit = match[2];
  switch (unit) {
    case 's':
      return n * 1000;
    case 'm':
      return n * 60 * 1000;
    case 'h':
      return n * 60 * 60 * 1000;
    case 'd':
      return n * 24 * 60 * 60 * 1000;
    default:
      return 15 * 60 * 1000;
  }
}
