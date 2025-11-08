import { prisma } from '../services/prisma.service';

export const AuditRepository = {
  list: async (page: number, limit: number, filters: { entity?: string; action?: string; userId?: string }) => {
    const skip = (page - 1) * limit;
    const where: any = {};
    if (filters.entity) where.entity = filters.entity;
    if (filters.action) where.action = filters.action;
    if (filters.userId) where.userId = filters.userId;

    const [items, total] = await Promise.all([
      prisma.auditLog.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' }, include: { user: true } }),
      prisma.auditLog.count({ where }),
    ]);
    return { items, total, page, limit };
  },

  create: (data: { userId?: string; action: string; entity?: string; entityId?: string; ip?: string; userAgent?: string; meta?: unknown }) =>
    prisma.auditLog.create({ data: { ...data, meta: data.meta as any } }),
};
