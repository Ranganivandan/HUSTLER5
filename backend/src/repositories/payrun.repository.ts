import { prisma } from '../services/prisma.service';
import { Prisma } from '@prisma/client';

export const PayrunRepository = {
  createPayrunWithPayslips: async (
    tx: Prisma.TransactionClient,
    data: { year: number; month: number; metadata?: any; payslips: Array<{ userId: string; gross: number; net: number; components: any }> },
  ) => {
    const payrun = await tx.payrun.create({
      data: { year: data.year, month: data.month, metadata: data.metadata ?? {} },
    });
    for (const p of data.payslips) {
      await tx.payslip.create({
        data: {
          userId: p.userId,
          payrunId: payrun.id,
          gross: new Prisma.Decimal(p.gross),
          net: new Prisma.Decimal(p.net),
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
