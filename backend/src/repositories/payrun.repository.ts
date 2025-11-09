import { prisma } from '../services/prisma.service';
import { Prisma } from '@prisma/client';

export const PayrunRepository = {
  createPayrunWithPayslips: async (
    tx: Prisma.TransactionClient,
    data: { 
      year: number; 
      month: number; 
      metadata?: any; 
      payslips: Array<{ 
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
      }> 
    },
  ) => {
    const payrun = await tx.payrun.create({
      data: { year: data.year, month: data.month, metadata: data.metadata ?? {} },
    });
    for (const p of data.payslips) {
      await tx.payslip.create({
        data: {
          userId: p.userId,
          payrunId: payrun.id,
          basic: new Prisma.Decimal(p.basic),
          hra: new Prisma.Decimal(p.hra),
          bonus: new Prisma.Decimal(p.bonus),
          gross: new Prisma.Decimal(p.gross),
          pf: new Prisma.Decimal(p.pf),
          employerPf: new Prisma.Decimal(p.employerPf),
          tax: new Prisma.Decimal(p.tax),
          esi: new Prisma.Decimal(p.esi),
          totalDeductions: new Prisma.Decimal(p.totalDeductions),
          absentDays: p.absentDays,
          dayDeduction: new Prisma.Decimal(p.dayDeduction),
          extraPaidLeaveHours: new Prisma.Decimal(p.extraPaidLeaveHours),
          paidLeaveHourDeduction: new Prisma.Decimal(p.paidLeaveHourDeduction),
          net: new Prisma.Decimal(p.net),
          ctc: new Prisma.Decimal(p.ctc),
          officeScore: p.officeScore,
          components: p.components,
        },
      });
    }
    return payrun;
  },

  getByIdWithPayslips: (id: string) =>
    prisma.payrun.findUnique({ where: { id }, include: { payslips: true } }),

  listPayslipsByUser: (userId: string) =>
    prisma.payslip.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, include: { payrun: true } }),
};
