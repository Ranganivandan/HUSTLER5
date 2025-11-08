import request from 'supertest';
import { createApp } from '../src/app';
import { prisma } from '../src/services/prisma.service';
import { computePayslip, computePF, computeProfessionalTax, computeUnpaidLeaveDeduction, countWorkingDays } from '../src/utils/payroll.util';

let app: ReturnType<typeof createApp>;
let payrollToken: string;

beforeAll(async () => {
  app = createApp();
  // Ensure payroll user exists from seed
  const res = await request(app)
    .post('/v1/auth/login')
    .send({ email: 'payroll@workzen.com', password: 'password' })
    .expect(200);
  payrollToken = res.body.accessToken;
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('Payroll util calculations', () => {
  it('computes PF at 12% and professional tax slab', () => {
    expect(computePF(30000)).toBe(3600);
    expect(computeProfessionalTax(14000)).toBe(150);
    expect(computeProfessionalTax(20000)).toBe(200);
    expect(computeProfessionalTax(26000)).toBe(250);
    expect(computeProfessionalTax(26000, 180)).toBe(180);
  });

  it('computes unpaid leave deduction and payslip net', () => {
    const workingDays = 22;
    const presentDays = 20;
    const basic = 30000;
    const ded = computeUnpaidLeaveDeduction(basic, workingDays, presentDays);
    expect(ded).toBeCloseTo((2 * (basic / workingDays)), 2);
    const slip = computePayslip({ basicSalary: basic, workingDays, presentDays });
    expect(slip.gross).toBe(30000);
    expect(slip.pf).toBe(3600);
    expect(slip.professionalTax).toBe(250);
    expect(slip.net).toBeCloseTo(30000 - 3600 - 250 - ded, 2);
  });

  it('counts working days excluding weekends', () => {
    const start = new Date('2025-01-01');
    const end = new Date('2025-01-31');
    const wd = countWorkingDays(start, end);
    expect(wd).toBeGreaterThan(0);
  });
});

describe('Payroll run transaction', () => {
  it('creates a payrun and payslips atomically, prevents duplicate for same month', async () => {
    const periodStart = new Date();
    const startStr = new Date(periodStart.getFullYear(), periodStart.getMonth(), 1).toISOString().slice(0,10);
    const endStr = new Date(periodStart.getFullYear(), periodStart.getMonth() + 1, 0).toISOString().slice(0,10);

    const res1 = await request(app)
      .post('/v1/payroll/run')
      .set('Authorization', `Bearer ${payrollToken}`)
      .send({ periodStart: startStr, periodEnd: endStr })
      .expect(201);

    expect(res1.body).toHaveProperty('id');
    const payrunId = res1.body.id as string;

    const pr = await prisma.payrun.findUnique({ where: { id: payrunId }, include: { payslips: true } });
    expect(pr).toBeTruthy();
    expect(pr!.payslips.length).toBeGreaterThan(0);

    // Second run same month should fail and not create extra payrun
    await request(app)
      .post('/v1/payroll/run')
      .set('Authorization', `Bearer ${payrollToken}`)
      .send({ periodStart: startStr, periodEnd: endStr })
      .expect(409);

    const count = await prisma.payrun.count({ where: { year: pr!.year, month: pr!.month } });
    expect(count).toBe(1);
  });
});
