import * as bcrypt from 'bcrypt';
import { prisma } from '../services/prisma.service';
import { AuditService } from './audit.service';
import { ProfileService } from './profile.service';
import { getBoss } from '../jobs/boss';
import { generateMemorablePassword } from '../utils/password-generator';
import { sendEmployeeCredentials } from './mailer.service';

export async function listUsers(params: { page?: number; limit?: number; role?: string; active?: boolean }) {
  const page = params.page && params.page > 0 ? params.page : 1;
  const limit = params.limit && params.limit > 0 ? params.limit : 10;
  const where: any = {};
  if (params.role) {
    where.role = { name: params.role };
  }
  if (typeof params.active === 'boolean') {
    where.isActive = params.active;
  }
  const [items, total] = await Promise.all([
    prisma.user.findMany({
      where,
      include: { role: true },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.user.count({ where }),
  ]);
  return { items, total, page, limit, pages: Math.ceil(total / limit) };
}

export async function getUser(id: string) {
  return prisma.user.findUnique({ where: { id }, include: { role: true, profile: true } });
}

export async function createUser(data: { 
  email: string; 
  name: string; 
  password?: string; // Optional - will auto-generate if not provided
  role?: 'employee'|'hr'|'payroll'|'admin'; 
  department?: string;
  salary?: number; // Monthly salary
  actorId: string; 
  ip?: string; 
  userAgent?: string; 
  sendCredentials?: boolean; // Send credentials email
}) {
  const exists = await prisma.user.findUnique({ where: { email: data.email } });
  if (exists) throw Object.assign(new Error('Email already registered'), { status: 409 });

  const role = await prisma.role.findUnique({ where: { name: data.role ?? 'employee' } });
  if (!role) throw new Error('Role not found');

  // Auto-generate password if not provided
  const plainPassword = data.password || generateMemorablePassword();
  const passwordHash = await bcrypt.hash(plainPassword, 10);
  
  const user = await prisma.user.create({ 
    data: { 
      email: data.email, 
      name: data.name, 
      passwordHash, 
      roleId: role.id, 
      isActive: true 
    } 
  });

  // Auto-create employee profile with unique employee code
  try {
    const employeeCode = await ProfileService.generateEmployeeCode(user.name);
    await prisma.employeeProfile.create({ 
      data: { 
        userId: user.id, 
        employeeCode,
        department: data.department || null,
        salary: data.salary || null,
        metadata: { leaveBalance: { SICK: 10, CASUAL: 12, EARNED: 15, UNPAID: 0 } } as any
      } 
    });
  } catch (e) {
    // If profile creation fails, log but don't fail user creation
    console.error('Failed to create employee profile:', e);
  }

  await AuditService.create({ 
    userId: data.actorId, 
    action: 'USER_CREATE', 
    entity: 'User', 
    entityId: user.id, 
    ip: data.ip, 
    userAgent: data.userAgent, 
    meta: { email: user.email, role: data.role ?? 'employee', department: data.department } 
  });

  // Send credentials email if requested (default: true for auto-generated passwords)
  const shouldSendEmail = data.sendCredentials !== false && !data.password;
  if (shouldSendEmail) {
    try {
      await sendEmployeeCredentials({
        to: user.email,
        name: user.name,
        email: user.email,
        password: plainPassword,
        role: data.role ?? 'employee',
        department: data.department,
      });
      console.log(`✅ Credentials email sent to ${user.email}`);
    } catch (error) {
      console.error('Failed to send credentials email:', error);
      // Don't fail user creation if email fails
    }
  }

  return { user, generatedPassword: !data.password ? plainPassword : undefined };
}

export async function updateUser(id: string, data: { role?: 'employee'|'hr'|'payroll'|'admin'; isActive?: boolean; actorId: string; ip?: string; userAgent?: string; }) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id }, include: { role: true } });

  // Prevent demoting last admin
  if (typeof data.role !== 'undefined' && user.role.name === 'admin' && data.role !== 'admin') {
    const adminCount = await prisma.user.count({ where: { role: { name: 'admin' }, isActive: true } });
    if (adminCount <= 1) throw Object.assign(new Error('Cannot demote the last admin'), { status: 400 });
  }

  // Prevent deactivating last admin
  if (typeof data.isActive !== 'undefined' && user.role.name === 'admin' && data.isActive === false) {
    const adminCount = await prisma.user.count({ where: { role: { name: 'admin' }, isActive: true } });
    if (adminCount <= 1) throw Object.assign(new Error('Cannot deactivate the last admin'), { status: 400 });
  }

  let roleId: string | undefined = undefined;
  if (typeof data.role !== 'undefined') {
    const role = await prisma.role.findUnique({ where: { name: data.role } });
    if (!role) throw new Error('Role not found');
    roleId = role.id;
  }

  const updated = await prisma.user.update({ where: { id }, data: { roleId: roleId, isActive: data.isActive } });

  await AuditService.create({ userId: data.actorId, action: 'USER_UPDATE', entity: 'User', entityId: id, ip: data.ip, userAgent: data.userAgent, meta: { role: data.role, isActive: data.isActive } });

  return updated;
}

export async function deleteUser(id: string, actor: { id: string; ip?: string; userAgent?: string }) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id }, include: { role: true } });
  if (user.role.name === 'admin') {
    const adminCount = await prisma.user.count({ where: { role: { name: 'admin' }, isActive: true } });
    if (adminCount <= 1) throw Object.assign(new Error('Cannot delete the last admin'), { status: 400 });
  }

  const updated = await prisma.user.update({ where: { id }, data: { isActive: false } });

  await AuditService.create({ userId: actor.id, action: 'USER_DELETE', entity: 'User', entityId: id, ip: actor.ip, userAgent: actor.userAgent });

  try {
    await getBoss().send('user_cleanup', { userId: id });
  } catch {}

  return updated;
}
