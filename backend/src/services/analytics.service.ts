import { prisma } from '../services/prisma.service';
import { cacheGet, cacheSet, cacheInvalidatePrefix } from './cache.service';

function startEndOfMonth(month?: string) {
  const now = new Date();
  let y = now.getFullYear();
  let m = now.getMonth();
  if (month && /^\d{4}-\d{2}$/.test(month)) { const [yy, mm] = month.split('-').map(Number); y = yy; m = mm - 1; }
  const from = new Date(y, m, 1);
  const to = new Date(y, m + 1, 1);
  return { from, to };
}

export const AnalyticsService = {
  async overview() {
    const key = 'analytics:overview';
    const cached = cacheGet<any>(key);
    if (cached) return cached;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const { from, to } = startEndOfMonth(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2,'0')}`);

    const [totalEmployees, attendanceToday, attendanceMonth, onLeaveToday, pendingLeaveRequests] = await Promise.all([
      prisma.employeeProfile.count().catch(() => 0),
      prisma.attendance.count({ where: { date: today, checkIn: { not: null } } }).catch(() => 0),
      prisma.attendance.findMany({ where: { date: { gte: from, lt: to } } }).catch(() => []),
      prisma.leaveRequest.count({ where: { status: 'APPROVED', startDate: { lte: today }, endDate: { gte: today } } }).catch(() => 0),
      prisma.leaveRequest.count({ where: { status: 'PENDING' } }).catch(() => 0),
    ]);

    const presentToday = attendanceToday;
    const workingDays = Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
    const totalPossibleAttendance = totalEmployees * workingDays;
    const actualAttendance = attendanceMonth.filter(a => a.checkIn).length;
    const avgAttendance = totalPossibleAttendance > 0 ? Number(((actualAttendance / totalPossibleAttendance) * 100).toFixed(1)) : 0;

    const data = { totalEmployees, presentToday, onLeaveToday, pendingLeaveRequests, avgAttendance };
    cacheSet(key, data, 30_000);
    return data;
  },

  async attendanceByDay(month: string) {
    const key = `analytics:attendance:${month}`;
    const cached = cacheGet<any>(key);
    if (cached) return cached;
    const { from, to } = startEndOfMonth(month);
    const items = await prisma.attendance.groupBy({ by: ['date'], where: { date: { gte: from, lt: to } }, _count: true, orderBy: { date: 'asc' } }).catch(async () => {
      const rows = await prisma.attendance.findMany({ where: { date: { gte: from, lt: to } }, orderBy: { date: 'asc' } });
      const map = new Map<string, number>();
      for (const r of rows) { const k = r.date.toISOString().slice(0,10); map.set(k, (map.get(k) || 0) + 1); }
      return Array.from(map.entries()).map(([k, v]) => ({ date: new Date(k), _count: v }));
    });
    const data = items.map((r: any) => ({ date: r.date, presentCount: r._count }));
    cacheSet(key, data, 60_000);
    return data;
  },

  async payrollTotals(periodStart: Date, periodEnd: Date) {
    const key = `analytics:payroll:${periodStart.toISOString().slice(0,10)}:${periodEnd.toISOString().slice(0,10)}`;
    const cached = cacheGet<any>(key);
    if (cached) return cached;
    // If the requested period falls within a single calendar month,
    // prefer filtering by Payrun.year/month to avoid depending on createdAt timing.
    const singleMonth = periodStart.getFullYear() === periodEnd.getFullYear() && periodStart.getMonth() === periodEnd.getMonth();
    let payslips;
    if (singleMonth) {
      const y = periodStart.getFullYear();
      const m = periodStart.getMonth() + 1; // Prisma schema stores month as 1-12
      payslips = await prisma.payslip.findMany({ where: { payrun: { year: y, month: m } } });
    } else {
      // Fallback for multi-month ranges
      payslips = await prisma.payslip.findMany({ where: { payrun: { createdAt: { gte: periodStart, lte: periodEnd } } } });
    }
    const totals = payslips.reduce((acc, p) => ({ gross: acc.gross + Number(p.gross), net: acc.net + Number(p.net) }), { gross: 0, net: 0 });
    cacheSet(key, totals, 60_000);
    return totals;
  },

  invalidateAttendanceCache() { cacheInvalidatePrefix('analytics:attendance:'); },
  invalidateOverview() { cacheInvalidatePrefix('analytics:overview'); },
};
