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
  upsertByUserId: async (userId: string, data: { phone?: string; designation?: string; workLocation?: string; photoPublicId?: string }) => {
    // Get user name for employee code generation if creating new profile
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
    const userName = user?.name || 'Unknown User';
    
    const year = new Date().getFullYear().toString().slice(-2);
    const count = await prisma.employeeProfile.count();
    const sequence = String(count + 1).padStart(5, '0');
    const nameParts = userName.trim().split(/\s+/);
    let initials = '';
    if (nameParts.length >= 2) {
      initials = (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase();
    } else if (nameParts.length === 1 && nameParts[0].length >= 2) {
      initials = nameParts[0].slice(0, 2).toUpperCase();
    } else {
      initials = nameParts[0] ? (nameParts[0][0] + nameParts[0][0]).toUpperCase() : 'XX';
    }
    const employeeCode = `OI${initials}${year}${sequence}`;
    
    return prisma.employeeProfile.upsert({
      where: { userId },
      create: { userId, phone: data.phone, designation: data.designation, metadata: { workLocation: data.workLocation, photoPublicId: data.photoPublicId } as any, employeeCode },
      update: { phone: data.phone, designation: data.designation, metadata: { workLocation: data.workLocation, photoPublicId: data.photoPublicId } as any },
    });
  },
  setParsedResume: (userId: string, parsed: unknown) =>
    prisma.employeeProfile.update({ where: { userId }, data: { parsed_resume: parsed as any } }),
};
