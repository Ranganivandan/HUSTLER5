import request from 'supertest';
import { createApp } from '../src/app';
import { prisma } from '../src/services/prisma.service';
import { ProfileService } from '../src/services/profile.service';

let app: ReturnType<typeof createApp>;
let token: string;

beforeAll(async () => {
  app = createApp();
  // ensure roles
  const empRole = await prisma.role.upsert({ where: { name: 'employee' }, update: {}, create: { name: 'employee' } });
  const email = `prof_${Date.now()}@test.local`;
  const passHash = '$2b$10$6BBhQyFl1TClY0Kx9JbQLei9u4m1W0wHnhxxWz2rj08ZgJ9KXWZtC'; // Password123
  await prisma.user.create({ data: { email, name: 'Profile User', passwordHash: passHash, roleId: empRole.id } });
  const res = await request(app).post('/v1/auth/login').send({ email, password: 'Password123' });
  token = res.body.accessToken;
});

afterAll(async () => { await prisma.$disconnect(); });

it('sanitizeParsedResume removes scripts', () => {
  const input = { a: '<script>alert(1)</script>', b: [{ x: '<img onerror="x()">' }] };
  const out = ProfileService.sanitizeParsedResume(input) as any;
  expect(out.a).toBe('');
  expect(String(out.b[0].x)).not.toMatch(/onerror/);
});

it('GET /v1/profile/me returns profile', async () => {
  const res = await request(app).get('/v1/profile/me').set('Authorization', `Bearer ${token}`).expect(200);
  expect(res.body).toHaveProperty('userId');
});

it('PUT /v1/profile/me updates allowed fields', async () => {
  const res = await request(app)
    .put('/v1/profile/me')
    .set('Authorization', `Bearer ${token}`)
    .send({ phone: '+911234567890', jobTitle: 'Engineer', workLocation: 'Remote' })
    .expect(200);
  expect(res.body.phone).toBe('+911234567890');
});
