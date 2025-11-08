import { prisma } from '../services/prisma.service';
import { LeavesRepository } from '../repositories/leaves.repository';
import { AuditService } from './audit.service';

function daysBetweenInclusive(start: Date, end: Date) {
  const ms = end.getTime() - start.getTime();
  const days = Math.floor(ms / (1000 * 60 * 60 * 24)) + 1;
  return days < 0 ? 0 : days;
}

async function getAvailableBalance(userId: string, type: 'SICK'|'CASUAL'|'EARNED'|'UNPAID') {
  const profile = await prisma.employeeProfile.findUnique({ where: { userId } });
  const balances = (profile?.metadata as any)?.leaveBalance as Record<string, number> | undefined;
  const available = balances?.[type] ?? (type === 'UNPAID' ? Number.MAX_SAFE_INTEGER : 0);
  return { available, balances, profileId: profile?.id };
}

export const LeavesService = {
  apply: async (data: { userId: string; type: 'SICK'|'CASUAL'|'EARNED'|'UNPAID'; startDate: Date; endDate: Date; reason?: string; ip?: string; userAgent?: string }) => {
    if (data.endDate < data.startDate) throw Object.assign(new Error('endDate must be after startDate'), { status: 400 });

    // overlap check with approved leaves
    const overlap = await LeavesRepository.overlapsApproved(data.userId, data.startDate, data.endDate);
    if (overlap) throw Object.assign(new Error('Overlapping with an approved leave'), { status: 400 });

    // compute days and check balance (simple)
    const days = daysBetweenInclusive(data.startDate, data.endDate);
    const { available } = await getAvailableBalance(data.userId, data.type);
    if (data.type !== 'UNPAID' && days > available) throw Object.assign(new Error('Insufficient leave balance'), { status: 400 });

    const created = await LeavesRepository.create({ userId: data.userId, type: data.type, startDate: data.startDate, endDate: data.endDate, reason: data.reason });

    await AuditService.create({ userId: data.userId, action: 'LEAVE_APPLY', entity: 'LeaveRequest', entityId: created.id, ip: data.ip, userAgent: data.userAgent, meta: { days } });
    // store days in metadata early for visibility
    await prisma.leaveRequest.update({ where: { id: created.id }, data: { metadata: { days } } });

    return await LeavesRepository.findById(created.id);
  },

  list: async (params: { actor: { id: string; role: string }; page?: number; limit?: number; userId?: string; status?: 'PENDING'|'APPROVED'|'REJECTED'|'CANCELLED'; type?: 'SICK'|'CASUAL'|'EARNED'|'UNPAID'; start?: Date; end?: Date; }) => {
    let userIdFilter = params.userId;
    if (!['admin','hr','payroll'].includes(params.actor.role)) {
      userIdFilter = params.actor.id; // employees only see their own
    }
    return LeavesRepository.list({ page: params.page, limit: params.limit, userId: userIdFilter, status: params.status, type: params.type, start: params.start, end: params.end });
  },

  approve: async (id: string, approver: { id: string; role: string }, ip?: string, userAgent?: string) => {
    if (!['admin','hr','payroll'].includes(approver.role)) throw Object.assign(new Error('Forbidden'), { status: 403 });
    const leave = await LeavesRepository.findById(id);
    if (!leave) throw Object.assign(new Error('Not found'), { status: 404 });
    if (leave.status !== 'PENDING') throw Object.assign(new Error('Leave is not pending'), { status: 400 });

    // compute days from dates (fallback to metadata.days if present)
    const daysMeta = (leave.metadata as any)?.days as number | undefined;
    const days = daysMeta ?? daysBetweenInclusive(leave.startDate, leave.endDate);

    // check overlap again just before approval
    const overlap = await LeavesRepository.overlapsApproved(leave.userId, leave.startDate, leave.endDate);
    if (overlap) throw Object.assign(new Error('Overlapping with an approved leave'), { status: 400 });

    // deduct balance on approval (except UNPAID)
    if (leave.type !== 'UNPAID') {
      const profile = await prisma.employeeProfile.findUnique({ where: { userId: leave.userId } });
      const meta = (profile?.metadata as any) ?? {};
      const balances = (meta.leaveBalance ?? {}) as Record<string, number>;
      const current = balances[leave.type] ?? 0;
      if (days > current) throw Object.assign(new Error('Insufficient leave balance'), { status: 400 });
      balances[leave.type] = current - days;
      await prisma.employeeProfile.update({ where: { userId: leave.userId }, data: { metadata: { ...meta, leaveBalance: balances } } });
    }

    const updated = await LeavesRepository.approve(id, approver.id);
    await AuditService.create({ userId: approver.id, action: 'LEAVE_APPROVE', entity: 'LeaveRequest', entityId: id, ip, userAgent, meta: { days } });
    return updated;
  },

  reject: async (id: string, approver: { id: string; role: string }, reason?: string, ip?: string, userAgent?: string) => {
    if (!['admin','hr','payroll'].includes(approver.role)) throw Object.assign(new Error('Forbidden'), { status: 403 });
    const leave = await LeavesRepository.findById(id);
    if (!leave) throw Object.assign(new Error('Not found'), { status: 404 });
    if (leave.status !== 'PENDING') throw Object.assign(new Error('Leave is not pending'), { status: 400 });

    const updated = await LeavesRepository.reject(id, approver.id, reason);
    await AuditService.create({ userId: approver.id, action: 'LEAVE_REJECT', entity: 'LeaveRequest', entityId: id, ip, userAgent, meta: { reason } });
    return updated;
  },
};
