import { prisma } from '../services/prisma.service';

export const AuditService = {
  create: (data: { userId?: string; action: string; entity?: string; entityId?: string; ip?: string; userAgent?: string; meta?: unknown }) =>
    prisma.auditLog.create({ data: { userId: data.userId, action: data.action, entity: data.entity, entityId: data.entityId, ip: data.ip, userAgent: data.userAgent, meta: data.meta as any } }),
};
