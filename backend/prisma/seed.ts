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
    
    const user = await prisma.user.upsert({
      where: { email: demoUser.email },
      update: {},
      create: {
        email: demoUser.email,
        name: demoUser.name,
        passwordHash,
        roleId: role.id,
      },
    });

    // Ensure profile exists with default leave balances, department, and salary for demo
    const existingProfile = await prisma.employeeProfile.findUnique({ where: { userId: user.id } });
    
    // Assign departments based on role
    const departments = ['Engineering', 'Product', 'Sales', 'HR', 'Finance'];
    const department = demoUser.roleName === 'employee' 
      ? departments[Math.floor(Math.random() * departments.length)]
      : demoUser.roleName === 'hr' ? 'HR' : 'Engineering';
    
    // Assign salary based on role
    const baseSalary = demoUser.roleName === 'admin' ? 80000 
      : demoUser.roleName === 'hr' ? 60000
      : demoUser.roleName === 'payroll' ? 55000
      : 30000 + Math.floor(Math.random() * 40000); // 30k-70k for employees
    
    if (!existingProfile) {
      await prisma.employeeProfile.create({
        data: {
          userId: user.id,
          employeeCode: `WZ-${user.id.slice(0, 8)}`,
          department,
          designation: demoUser.roleName === 'employee' ? 'Software Engineer' : demoUser.roleName.toUpperCase(),
          metadata: { 
            leaveBalance: { SICK: 5, CASUAL: 5, EARNED: 10, UNPAID: 9999 },
            basicSalary: baseSalary,
          },
        },
      });
    } else {
      const meta: any = existingProfile.metadata ?? {};
      if (!meta.leaveBalance) {
        meta.leaveBalance = { SICK: 5, CASUAL: 5, EARNED: 10, UNPAID: 9999 };
      }
      if (!meta.basicSalary) {
        meta.basicSalary = baseSalary;
      }
      await prisma.employeeProfile.update({ 
        where: { userId: user.id }, 
        data: { 
          metadata: meta,
          department: existingProfile.department || department,
          designation: existingProfile.designation || (demoUser.roleName === 'employee' ? 'Software Engineer' : demoUser.roleName.toUpperCase()),
        } 
      });
    }
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
