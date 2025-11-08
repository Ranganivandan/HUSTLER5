import { prisma } from '../services/prisma.service';
import { formatAuditAction, formatAuditTime } from '../utils/audit-formatter';

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
    
    // Format audit logs with human-readable descriptions
    const formattedItems = items.map((item) => ({
      ...item,
      description: formatAuditAction({
        action: item.action,
        entity: item.entity || undefined,
        entityId: item.entityId || undefined,
        meta: item.meta,
        user: item.user ? { name: item.user.name, email: item.user.email } : undefined,
      }),
      timeAgo: formatAuditTime(item.createdAt),
    }));
    
    return { items: formattedItems, total, page, limit };
  },

  create: (data: { userId?: string; action: string; entity?: string; entityId?: string; ip?: string; userAgent?: string; meta?: unknown }) =>
    prisma.auditLog.create({ data: { ...data, meta: data.meta as any } }),
};
