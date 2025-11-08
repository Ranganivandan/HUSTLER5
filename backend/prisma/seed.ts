import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // 1) Roles
  const roleNames = ['admin', 'hr', 'payroll', 'employee'] as const;
  const roles: Array<{ id: string; name: string }> = await Promise.all(
    roleNames.map((name) =>
      prisma.role.upsert({
        where: { name },
        update: {},
        create: { name },
      }),
    ),
  );

  const adminRole = roles.find((r) => r.name === 'admin');
  if (!adminRole) throw new Error('Admin role not created');

  // 2) Admin user (dev only password)
  const adminEmail = 'admin@workzen.test';
  const adminPassword = 'AdminPass123!'; // dev-only; rotate in production
  const adminHash = await bcrypt.hash(adminPassword, 10);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      name: 'Super Admin',
      passwordHash: adminHash,
      roleId: adminRole.id,
    },
  });

  // 2) Create demo users for each role
  const demoUsers = [
    { email: 'admin@workzen.com', name: 'Admin User', password: 'password', roleName: 'admin' },
    { email: 'hr@workzen.com', name: 'Rahul Sharma', password: 'password', roleName: 'hr' },
    { email: 'payroll@workzen.com', name: 'Priya Kumar', password: 'password', roleName: 'payroll' },
    { email: 'employee@workzen.com', name: 'Asha Patel', password: 'password', roleName: 'employee' },
  ];

  for (const demoUser of demoUsers) {
    const role = roles.find((r) => r.name === demoUser.roleName);
    if (!role) continue;

    const passwordHash = await bcrypt.hash(demoUser.password, 10);
    
    await prisma.user.upsert({
      where: { email: demoUser.email },
      update: {},
      create: {
        email: demoUser.email,
        name: demoUser.name,
        passwordHash,
        roleId: role.id,
      },
    });
  }

  console.log('Seed complete: roles and demo users created (password: "password" for all)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
