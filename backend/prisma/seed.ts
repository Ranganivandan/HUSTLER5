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

  // Initialize default settings
  const settingsCount = await prisma.companySettings.count();
  if (settingsCount === 0) {
    const defaultSettings = [
      // Company
      { key: 'company.companyName', category: 'company', value: 'WorkZen Technologies' },
      { key: 'company.fiscalYearStart', category: 'company', value: '2025-04' },
      { key: 'company.currency', category: 'company', value: 'INR' },
      { key: 'company.timezone', category: 'company', value: 'Asia/Kolkata' },
      { key: 'company.address', category: 'company', value: '123 Tech Park, Bangalore, Karnataka' },
      // Attendance
      { key: 'attendance.minHoursPerDay', category: 'attendance', value: 8 },
      { key: 'attendance.graceTimeMinutes', category: 'attendance', value: 15 },
      { key: 'attendance.workingDays', category: 'attendance', value: 'Monday - Saturday' },
      { key: 'attendance.autoMarkAbsentAfterDays', category: 'attendance', value: 3 },
      // Leaves
      { key: 'leaves.casualLeavesYearly', category: 'leaves', value: 12 },
      { key: 'leaves.sickLeavesYearly', category: 'leaves', value: 12 },
      { key: 'leaves.privilegeLeavesYearly', category: 'leaves', value: 15 },
      { key: 'leaves.maxConsecutiveDays', category: 'leaves', value: 5 },
      { key: 'leaves.allowCarryForward', category: 'leaves', value: true },
      // Payroll
      { key: 'payroll.pfPercentage', category: 'payroll', value: 12 },
      { key: 'payroll.esiPercentage', category: 'payroll', value: 1.75 },
      { key: 'payroll.professionalTax', category: 'payroll', value: 200 },
      { key: 'payroll.defaultBonusPercentage', category: 'payroll', value: 10 },
      // Notifications
      { key: 'notifications.emailAlerts', category: 'notifications', value: true },
      { key: 'notifications.attendanceReminders', category: 'notifications', value: true },
      { key: 'notifications.leaveApprovalNotifications', category: 'notifications', value: true },
    ];

    await prisma.companySettings.createMany({
      data: defaultSettings,
      skipDuplicates: true,
    });
    console.log('Default settings initialized');
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
