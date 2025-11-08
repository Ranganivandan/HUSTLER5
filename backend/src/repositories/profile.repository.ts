import { prisma } from '../services/prisma.service';

export const ProfileRepository = {
  getByUserId: (userId: string) =>
    prisma.employeeProfile.findUnique({ where: { userId }, include: { user: { include: { role: true } } } }),
  list: async (page: number, limit: number, search?: string) => {
    const skip = (page - 1) * limit;
    const where = search ? {
      OR: [
        { user: { name: { contains: search, mode: 'insensitive' as any } } },
        { user: { email: { contains: search, mode: 'insensitive' as any } } },
        { employeeCode: { contains: search, mode: 'insensitive' as any } },
        { designation: { contains: search, mode: 'insensitive' as any } },
      ],
    } : {};
    const [items, total] = await Promise.all([
      prisma.employeeProfile.findMany({ where, skip, take: limit, include: { user: { include: { role: true } } }, orderBy: { createdAt: 'desc' } }),
      prisma.employeeProfile.count({ where }),
    ]);
    return { items, total, page, limit };
  },
  upsertByUserId: (userId: string, data: { phone?: string; designation?: string; workLocation?: string; photoPublicId?: string }) =>
    prisma.employeeProfile.upsert({
      where: { userId },
      create: { userId, phone: data.phone, designation: data.designation, metadata: { workLocation: data.workLocation, photoPublicId: data.photoPublicId } as any, employeeCode: `WZ-${userId.slice(0,8)}` },
      update: { phone: data.phone, designation: data.designation, metadata: { workLocation: data.workLocation, photoPublicId: data.photoPublicId } as any },
    }),
  setParsedResume: (userId: string, parsed: unknown) =>
    prisma.employeeProfile.update({ where: { userId }, data: { parsed_resume: parsed as any } }),
};
