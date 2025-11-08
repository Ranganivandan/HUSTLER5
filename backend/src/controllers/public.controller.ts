import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';

/**
 * Get public statistics for signup page
 * Shows total companies (admin accounts) and total employees
 */
export const getPublicStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get admin role ID
    const adminRole = await prisma.role.findUnique({
      where: { name: 'admin' },
    });

    // Count total companies (users with admin role)
    const totalCompanies = adminRole
      ? await prisma.user.count({
          where: {
            roleId: adminRole.id,
            isActive: true,
          },
        })
      : 0;

    // Count total employees (all active users)
    const totalEmployees = await prisma.user.count({
      where: {
        isActive: true,
      },
    });

    // Get some additional stats
    const totalDepartments = await prisma.employeeProfile.groupBy({
      by: ['department'],
      where: {
        department: { not: null },
      },
    });

    res.json({
      success: true,
      data: {
        totalCompanies,
        totalEmployees,
        totalDepartments: totalDepartments.length,
      },
    });
  } catch (error) {
    next(error);
  }
};
