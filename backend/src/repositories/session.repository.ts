import { prisma } from '../services/prisma.service';

export const SessionRepository = {
  create: (data: { userId: string; tokenHash: string; expiresAt: Date; ip?: string; userAgent?: string }) =>
    prisma.session.create({ data: { userId: data.userId, token: data.tokenHash, expiresAt: data.expiresAt, ip: data.ip, userAgent: data.userAgent } }),
  findValidByUser: (userId: string) =>
    prisma.session.findMany({ where: { userId, revokedAt: null, expiresAt: { gt: new Date() } }, orderBy: { createdAt: 'desc' } }),
  findByTokenHash: (tokenHash: string) => prisma.session.findFirst({ where: { token: tokenHash, revokedAt: null, expiresAt: { gt: new Date() } } }),
  revokeById: (id: string) => prisma.session.update({ where: { id }, data: { revokedAt: new Date() } }),
  revokeAllForUser: (userId: string) => prisma.session.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } }),
};
