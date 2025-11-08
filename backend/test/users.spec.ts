import request from 'supertest';
import { createApp } from '../src/app';
import { prisma } from '../src/services/prisma.service';

let app: ReturnType<typeof createApp>;
let adminToken: string;

beforeAll(async () => {
  app = createApp();
  // Ensure roles and admin exist (seed should have created them)
  const adminRole = await prisma.role.findFirst({ where: { name: 'admin' } });
  expect(adminRole).toBeTruthy();

  // Create an admin user if missing
  const email = 'admin@test.local';
  let admin = await prisma.user.findUnique({ where: { email } });
  if (!admin) {
    admin = await prisma.user.create({
      data: {
        email,
        name: 'Admin Test',
        passwordHash: '$2b$10$6BBhQyFl1TClY0Kx9JbQLei9u4m1W0wHnhxxWz2rj08ZgJ9KXWZtC', // "Password123" bcrypt
        roleId: adminRole!.id,
      },
    });
  }

  // Login to get access token
  const res = await request(app)
    .post('/v1/auth/login')
    .send({ email, password: 'Password123' })
    .expect(200);
  adminToken = res.body.accessToken;
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('Users RBAC and CRUD', () => {
  it('Admin can create user', async () => {
    const res = await request(app)
      .post('/v1/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ email: `user_${Date.now()}@test.local`, name: 'Test User', password: 'Password123', role: 'employee' })
      .expect(201);
    expect(res.body).toHaveProperty('id');
  });

  it('List users (admin/hr)', async () => {
    const res = await request(app)
      .get('/v1/users?limit=5&page=1')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect(res.body).toHaveProperty('items');
    expect(res.body).toHaveProperty('total');
  });

  it('Prevent demoting last admin', async () => {
    // Find an admin user
    const admin = await prisma.user.findFirst({ where: { role: { name: 'admin' }, isActive: true } });
    expect(admin).toBeTruthy();
    await request(app)
      .put(`/v1/users/${admin!.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: 'employee' })
      .expect(400);
  });

  it('Soft delete user and enqueue cleanup', async () => {
    const u = await prisma.user.create({
      data: {
        email: `delete_${Date.now()}@test.local`,
        name: 'Delete Me',
        passwordHash: '$2b$10$6BBhQyFl1TClY0Kx9JbQLei9u4m1W0wHnhxxWz2rj08ZgJ9KXWZtC',
        role: { connect: { name: 'employee' } },
      },
    });
    await request(app)
      .delete(`/v1/users/${u.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(204);
    const after = await prisma.user.findUnique({ where: { id: u.id } });
    expect(after?.isActive).toBe(false);
  });
});
