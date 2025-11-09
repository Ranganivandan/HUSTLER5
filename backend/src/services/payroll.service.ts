import { prisma } from '../services/prisma.service';
import { PayrunRepository } from '../repositories/payrun.repository';
import { calculatePayslip, countWorkingDays, safe } from '../utils/payroll-calculator.util';

function normalizeDateOnly(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

/**
 * Calculate extra paid leave hours beyond allowance
 * This is a placeholder - implement based on your leave tracking logic
 */
async function calculateExtraPaidLeaveHours(
  tx: any,
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<number> {
  // Get approved paid leaves in the period
  const paidLeaves = await tx.leaveRequest.findMany({
    where: {
      userId,
      status: 'APPROVED',
      type: { in: ['SICK', 'CASUAL', 'EARNED'] }, // Paid leave types
      startDate: { lte: endDate },
      endDate: { gte: startDate },
    },
  });

  // Calculate total paid leave days taken
  let totalPaidLeaveDays = 0;
  for (const leave of paidLeaves) {
    const leaveStart = leave.startDate > startDate ? leave.startDate : startDate;
    const leaveEnd = leave.endDate < endDate ? leave.endDate : endDate;
    const days = Math.ceil((leaveEnd.getTime() - leaveStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    totalPaidLeaveDays += days;
  }

  // Get employee's leave balance from profile metadata
  const profile = await tx.employeeProfile.findUnique({ where: { userId } });
  const leaveBalance = (profile?.metadata as any)?.leaveBalance || {};
  const totalAllowedPaidLeaves = 
    (leaveBalance.SICK || 10) + 
    (leaveBalance.CASUAL || 12) + 
    (leaveBalance.EARNED || 15);

  // Calculate excess paid leave days (if any)
  const excessDays = Math.max(0, totalPaidLeaveDays - totalAllowedPaidLeaves);
  
  // Convert excess days to hours (8 hours per day)
  return excessDays * 8;
}

/**
 * Get office score for an employee
 * This is a placeholder - implement based on your performance tracking logic
 */
async function getOfficeScore(tx: any, userId: string, startDate: Date, endDate: Date): Promise<number> {
  // Default office score is 10 (perfect score)
  // You can implement logic to calculate based on:
  // - Attendance regularity
  // - Task completion
  // - Performance reviews
  // - etc.
  
  // For now, return default score
  return 10;
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
      const employees = await tx.user.findMany({ 
        where: { role: { name: 'employee' }, isActive: true } 
      });

      const workingDays = countWorkingDays(start, end);

      const payslips: Array<{
        userId: string;
        basic: number;
        hra: number;
        bonus: number;
        gross: number;
        pf: number;
        employerPf: number;
        tax: number;
        esi: number;
        totalDeductions: number;
        absentDays: number;
        dayDeduction: number;
        extraPaidLeaveHours: number;
        paidLeaveHourDeduction: number;
        net: number;
        ctc: number;
        officeScore: number;
        components: any;
      }> = [];

      for (const emp of employees) {
        try {
          // Get employee profile and salary
          const profile = await tx.employeeProfile.findUnique({ where: { userId: emp.id } });
          
          // Get salary with proper fallback chain
          let salary = 0;
          if (profile?.salary && Number(profile.salary) > 0) {
            salary = Number(profile.salary);
          } else if ((profile?.metadata as any)?.basicSalary) {
            salary = Number((profile.metadata as any).basicSalary);
          } else {
            salary = 30000; // Default minimum salary
          }
          
          // Ensure salary is never 0
          if (salary <= 0) {
            console.warn(`Employee ${emp.id} (${emp.name}) has invalid salary, using default 30000`);
            salary = 30000;
          }

          // Get attendance data
          const presentDays = await tx.attendance.count({ 
            where: { 
              userId: emp.id, 
              date: { gte: start, lte: end }, 
              NOT: { checkIn: null } 
            } 
          });

          // Calculate absent days
          const absentDays = Math.max(0, workingDays - presentDays);

          // Get extra paid leave hours
          const extraPaidLeaveHours = await calculateExtraPaidLeaveHours(tx, emp.id, start, end);

          // Get office score
          const officeScore = await getOfficeScore(tx, emp.id, start, end);

          // Calculate payslip using new comprehensive logic
          const payslip = calculatePayslip({
            salary,
            officeScore,
            absentDays,
            totalWorkingDays: workingDays,
            extraPaidLeaveHours,
            standardWorkHoursPerDay: 8,
          });

          // Log calculation for debugging
          console.log(`Payslip for ${emp.name} (${emp.id}):`, {
            salary,
            gross: payslip.gross,
            totalDeductions: payslip.totalDeductions,
            net: payslip.finalNet,
            ctc: payslip.ctc,
            presentDays,
            absentDays,
          });

          payslips.push({
            userId: emp.id,
            basic: payslip.basic,
            hra: payslip.hra,
            bonus: payslip.bonus,
            gross: payslip.gross,
            pf: payslip.pf,
            employerPf: payslip.employerPf,
            tax: payslip.tax,
            esi: payslip.esi,
            totalDeductions: payslip.totalDeductions,
            absentDays: payslip.absentDays,
            dayDeduction: payslip.dayDeduction,
            extraPaidLeaveHours: payslip.extraPaidLeaveHours,
            paidLeaveHourDeduction: payslip.paidLeaveHourDeduction,
            net: payslip.finalNet,
            ctc: payslip.ctc,
            officeScore,
            components: {
              salary,
              presentDays,
              workingDays,
              perDaySalary: payslip.perDaySalary,
              perHourSalary: payslip.perHourSalary,
            },
          });
        } catch (error) {
          console.error(`Error calculating payslip for employee ${emp.id}:`, error);
          // Continue with other employees even if one fails
        }
      }

      const payrun = await PayrunRepository.createPayrunWithPayslips(tx, {
        year,
        month,
        metadata: { periodStart: start, periodEnd: end, workingDays },
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
