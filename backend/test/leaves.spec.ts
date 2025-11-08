import request from 'supertest';
import { createApp } from '../src/app';
import { prisma } from '../src/services/prisma.service';

let app: ReturnType<typeof createApp>;
let employeeToken: string;
let hrToken: string;
let employeeId: string;

function formatDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

beforeAll(async () => {
  app = createApp();

  // Ensure seed users exist
  const employeeUser = await prisma.user.findFirst({ where: { email: 'employee@workzen.com' } });
  const hrUser = await prisma.user.findFirst({ where: { email: 'hr@workzen.com' } });
  expect(employeeUser).toBeTruthy();
  expect(hrUser).toBeTruthy();
  employeeId = employeeUser!.id;

  // Login
  const empRes = await request(app).post('/v1/auth/login').send({ email: 'employee@workzen.com', password: 'password' }).expect(200);
  employeeToken = empRes.body.accessToken;

  const hrRes = await request(app).post('/v1/auth/login').send({ email: 'hr@workzen.com', password: 'password' }).expect(200);
  hrToken = hrRes.body.accessToken;
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('Leaves apply → approve workflow', () => {
  it('Employee applies for leave and HR approves; balance decreases', async () => {
    // Ensure initial balance present
    const profileBefore = await prisma.employeeProfile.findUnique({ where: { userId: employeeId } });
    const beforeBalances = (profileBefore?.metadata as any)?.leaveBalance || { SICK: 5, CASUAL: 5, EARNED: 10 };
    const start = new Date(); start.setDate(start.getDate() + 1);
    const end = new Date(); end.setDate(end.getDate() + 2);

    // Apply
    const applyRes = await request(app)
      .post('/v1/leaves/apply')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({ type: 'CASUAL', startDate: formatDate(start), endDate: formatDate(end), reason: 'Family event' })
      .expect(201);

    expect(applyRes.body).toHaveProperty('id');
    const leaveId = applyRes.body.id as string;

    // HR approves
    const approveRes = await request(app)
      .put(`/v1/leaves/${leaveId}/approve`)
      .set('Authorization', `Bearer ${hrToken}`)
      .send({})
      .expect(200);

    expect(approveRes.body.status).toBe('APPROVED');

    // Balance decreased by 2 days for CASUAL (inclusive of start/end)
    const profileAfter = await prisma.employeeProfile.findUnique({ where: { userId: employeeId } });
    const afterBalances = (profileAfter?.metadata as any)?.leaveBalance;
    expect(afterBalances).toBeTruthy();
    const before = beforeBalances.CASUAL ?? 0;
    const after = afterBalances.CASUAL ?? 0;
    expect(before - after).toBeGreaterThanOrEqual(2);
  });

  it('Prevents overlapping approved leaves', async () => {
    // Create an approved leave for a fixed window
    const start = new Date(); start.setDate(start.getDate() + 5);
    const end = new Date(); end.setDate(end.getDate() + 6);

    const create = await prisma.leaveRequest.create({
      data: { userId: employeeId, type: 'SICK', startDate: start, endDate: end, status: 'APPROVED' },
    });
    expect(create.id).toBeTruthy();

    // Try to apply overlapping
    await request(app)
      .post('/v1/leaves/apply')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({ type: 'SICK', startDate: formatDate(start), endDate: formatDate(end), reason: 'Overlap test' })
      .expect(400);
  });
});
