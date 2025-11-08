import { prisma } from '../services/prisma.service';

export const UserRepository = {
  findByEmail: (email: string) => prisma.user.findUnique({ where: { email } }),
  findById: (id: string) => prisma.user.findUnique({ where: { id } }),
  create: (data: { email: string; name: string; passwordHash: string; role?: 'employee'|'hr'|'payroll'|'admin' }) =>
    prisma.user.create({ data: { ...data, role: data.role ?? 'employee' } }),
  setRefreshHash: (id: string, refreshTokenHash: string) => prisma.user.update({ where: { id }, data: { refreshTokenHash } }),
};
