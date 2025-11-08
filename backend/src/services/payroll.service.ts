import { prisma } from '../services/prisma.service';
import { PayrunRepository } from '../repositories/payrun.repository';
import { computePayslip, countWorkingDays } from '../utils/payroll.util';

function normalizeDateOnly(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export const PayrollService = {
  async run(actor: { id: string; role: string }, periodStart: Date, periodEnd: Date) {
    if (!['admin','payroll'].includes(actor.role)) {
      const err: any = new Error('Forbidden'); err.status = 403; throw err;
    }
    const start = normalizeDateOnly(periodStart);
    const end = normalizeDateOnly(periodEnd);
    if (end < start) { const err: any = new Error('Invalid period'); err.status = 400; throw err; }

    const year = start.getFullYear();
    const month = start.getMonth() + 1;

    return prisma.$transaction(async (tx) => {
      // Ensure payrun for year+month doesn't already exist
      const existing = await tx.payrun.findUnique({ where: { year_month: { year, month } } }).catch(() => null);
      if (existing) { const err: any = new Error('Payrun already exists for this month'); err.status = 409; throw err; }

      // Load employees by role (avoid tight type coupling in filters)
      const employees = await tx.user.findMany({ where: { role: { name: 'employee' } } });

      const workingDays = countWorkingDays(start, end);

      const payslips: Array<{ userId: string; gross: number; net: number; components: any }> = [];

      for (const emp of employees) {
        const profile = await tx.employeeProfile.findUnique({ where: { userId: emp.id } });
        const basicSalary = Number(((profile?.metadata as any)?.basicSalary ?? 30000));
        // Attendance present days (count rows with any check-in between period)
        const attendance = await tx.attendance.count({ where: { userId: emp.id, date: { gte: start, lte: end }, NOT: { checkIn: null } } });
        const breakup = computePayslip({ basicSalary, workingDays, presentDays: attendance });
        payslips.push({
          userId: emp.id,
          gross: breakup.gross,
          net: breakup.net,
          components: { pf: breakup.pf, professionalTax: breakup.professionalTax, unpaidLeaveDeduction: breakup.unpaidLeaveDeduction, presentDays: attendance, workingDays, basicSalary },
        });
      }

      const payrun = await PayrunRepository.createPayrunWithPayslips(tx, {
        year,
        month,
        metadata: { periodStart: start, periodEnd: end },
        payslips,
      });

      return payrun;
    });
  },

  async getById(actor: { id: string; role: string }, id: string) {
    if (!['admin','payroll'].includes(actor.role)) { const err: any = new Error('Forbidden'); err.status = 403; throw err; }
    const pr = await PayrunRepository.getByIdWithPayslips(id);
    if (!pr) { const err: any = new Error('Not found'); err.status = 404; throw err; }
    const totals = pr.payslips.reduce((acc, p) => ({ gross: acc.gross + Number(p.gross), net: acc.net + Number(p.net) }), { gross: 0, net: 0 });
    return { ...pr, totals };
  },

  async getPayslips(actor: { id: string; role: string }, userId: string) {
    if (!(actor.id === userId || ['admin','payroll'].includes(actor.role))) { const err: any = new Error('Forbidden'); err.status = 403; throw err; }
    return PayrunRepository.listPayslipsByUser(userId);
  },
};
