import { prisma } from '../services/prisma.service';

type RoleName = 'employee' | 'hr' | 'payroll' | 'admin';

export const UserRepository = {
  findByEmail: (email: string) => prisma.user.findUnique({ where: { email } }),
  findById: (id: string) => prisma.user.findUnique({ where: { id } }),
  create: (data: { email: string; name: string; passwordHash: string; role?: RoleName }) =>
    prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        passwordHash: data.passwordHash,
        role: {
          connect: { name: data.role ?? 'employee' },
        },
      },
    }),
  setRefreshHash: (id: string, refreshTokenHash: string) =>
    prisma.user.update({ where: { id }, data: { refreshTokenHash } }),
};
