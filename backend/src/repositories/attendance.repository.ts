import { prisma } from '../services/prisma.service';

export const AttendanceRepository = {
  findByUserAndDate: (userId: string, date: Date) =>
    prisma.attendance.findUnique({ where: { userId_date: { userId, date } } }),
  createCheckin: (data: { userId: string; date: Date; checkIn: Date; metadata?: unknown }) =>
    prisma.attendance.create({ data: { userId: data.userId, date: data.date, checkIn: data.checkIn, metadata: data.metadata as any } }),
  setCheckout: (userId: string, date: Date, checkOut: Date) =>
    prisma.attendance.update({ where: { userId_date: { userId, date } }, data: { checkOut } }),
  listByMonth: (userId: string, from: Date, to: Date) =>
    prisma.attendance.findMany({ where: { userId, date: { gte: from, lt: to } }, orderBy: { date: 'asc' } }),
  statsByMonth: async (userId: string, from: Date, to: Date) => {
    const items = await prisma.attendance.findMany({ where: { userId, date: { gte: from, lt: to } } });
    const present = items.length;
    const hours = items.reduce((sum, a) => {
      if (a.checkIn && a.checkOut) {
        const ms = a.checkOut.getTime() - a.checkIn.getTime();
        return sum + ms / (1000 * 60 * 60);
      }
      return sum;
    }, 0);
    return { days: present, hours: Number(hours.toFixed(2)) };
  },
  summaryByMonth: async (from: Date, to: Date) => {
    const items = await prisma.attendance.findMany({
      where: { date: { gte: from, lt: to } },
      include: { user: { include: { profile: true } } },
    });
    const byUser: Record<string, { userId: string; name: string; employeeCode: string; present: number; absent: number; leaves: number }> = {};
    const workingDays = Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
    items.forEach((a) => {
      if (!byUser[a.userId]) {
        byUser[a.userId] = { userId: a.userId, name: (a.user as any).name || 'Unknown', employeeCode: (a.user as any).profile?.employeeCode || a.userId.slice(0,8), present: 0, absent: 0, leaves: 0 };
      }
      if (a.checkIn) byUser[a.userId].present++;
    });
    // Calculate absent and leaves (simplified: absent = workingDays - present - leaves)
    const result = Object.values(byUser).map((u) => {
      const absent = Math.max(0, workingDays - u.present - u.leaves);
      const percentage = workingDays > 0 ? ((u.present / workingDays) * 100).toFixed(1) : '0.0';
      return { ...u, absent, percentage: parseFloat(percentage) };
    });
    return result;
  },
};
