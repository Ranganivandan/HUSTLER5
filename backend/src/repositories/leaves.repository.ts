import { prisma } from '../services/prisma.service';
import { Prisma } from '@prisma/client';

export const LeavesRepository = {
  create: (data: { userId: string; type: 'SICK'|'CASUAL'|'EARNED'|'UNPAID'; startDate: Date; endDate: Date; reason?: string }) =>
    prisma.leaveRequest.create({ data }),

  list: async (params: { page?: number; limit?: number; userId?: string; status?: ('PENDING'|'APPROVED'|'REJECTED'|'CANCELLED'); type?: ('SICK'|'CASUAL'|'EARNED'|'UNPAID'); start?: Date; end?: Date; }) => {
    const where: Prisma.LeaveRequestWhereInput = {};
    if (params.userId) where.userId = params.userId;
    if (params.status) where.status = params.status as any;
    if (params.type) where.type = params.type as any;
    if (params.start || params.end) {
      where.AND = [
        params.start ? { endDate: { gte: params.start } } : {},
        params.end ? { startDate: { lte: params.end } } : {},
      ];
    }
    const page = params.page ?? 1;
    const limit = params.limit ?? 10;
    const [items, total] = await Promise.all([
      prisma.leaveRequest.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
      prisma.leaveRequest.count({ where }),
    ]);
    return { items, total, page, limit };
  },

  findById: (id: string) => prisma.leaveRequest.findUnique({ where: { id } }),

  overlapsApproved: (userId: string, start: Date, end: Date) =>
    prisma.leaveRequest.findFirst({
      where: {
        userId,
        status: 'APPROVED',
        AND: [ { endDate: { gte: start } }, { startDate: { lte: end } } ],
      },
    }),

  approve: (id: string, approverId: string) =>
    prisma.leaveRequest.update({ where: { id }, data: { status: 'APPROVED', approvedById: approverId, approvedAt: new Date() } }),

  reject: (id: string, approverId: string, reason?: string) =>
    prisma.leaveRequest.update({ where: { id }, data: { status: 'REJECTED', metadata: { reason } } }),

  cancel: (id: string) =>
    prisma.leaveRequest.update({ where: { id }, data: { status: 'CANCELLED' } }),
};
