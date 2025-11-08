import { prisma } from './prisma.service';
import { AuditRepository } from '../repositories/audit.repository';

export const AdminService = {
  async getAuditLogs(requestorRole: string, page: number, limit: number, filters: { entity?: string; action?: string; userId?: string }) {
    if (requestorRole !== 'admin') {
      const err: any = new Error('Forbidden');
      err.status = 403;
      throw err;
    }
    return AuditRepository.list(page, limit, filters);
  },

  async getAnomalies(requestorRole: string) {
    if (requestorRole !== 'admin') {
      const err: any = new Error('Forbidden');
      err.status = 403;
      throw err;
    }

    // Detect attendance anomalies: late check-ins (after 9:30 AM)
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const lateCheckIns = await prisma.attendance.findMany({
      where: {
        date: { gte: monthStart, lt: monthEnd },
        checkIn: { not: null },
      },
      include: { user: { include: { profile: true } } },
    });

    const anomalies = lateCheckIns
      .filter((a) => {
        if (!a.checkIn) return false;
        const hour = a.checkIn.getHours();
        const minute = a.checkIn.getMinutes();
        return hour > 9 || (hour === 9 && minute > 30);
      })
      .map((a) => ({
        userId: a.userId,
        userName: (a.user as any)?.name || 'Unknown',
        employeeCode: (a.user as any)?.profile?.employeeCode || a.userId.slice(0, 8),
        date: a.date.toISOString().slice(0, 10),
        checkInTime: a.checkIn?.toISOString() || '',
        type: 'late_checkin',
      }));

    // Group by user and count
    const byUser: Record<string, { userId: string; userName: string; employeeCode: string; lateCount: number; dates: string[] }> = {};
    anomalies.forEach((a) => {
      if (!byUser[a.userId]) {
        byUser[a.userId] = { userId: a.userId, userName: a.userName, employeeCode: a.employeeCode, lateCount: 0, dates: [] };
      }
      byUser[a.userId].lateCount++;
      byUser[a.userId].dates.push(a.date);
    });

    return Object.values(byUser).filter((u) => u.lateCount > 3); // Only show users with >3 late check-ins
  },

  async deleteUser(requestorId: string, requestorRole: string, userId: string) {
    if (requestorRole !== 'admin') {
      const err: any = new Error('Forbidden');
      err.status = 403;
      throw err;
    }

    // Soft delete: set isActive to false
    const user = await prisma.user.update({
      where: { id: userId },
      data: { isActive: false },
    });

    // Log audit
    await AuditRepository.create({
      userId: requestorId,
      action: 'DELETE',
      entity: 'User',
      entityId: userId,
      meta: { soft: true },
    });

    // TODO: Enqueue user_cleanup job with pg-boss (not implemented yet)
    // await jobQueue.send('user_cleanup', { userId });

    return user;
  },
};
