import { prisma } from './prisma.service';
import { cacheGet, cacheSet } from './cache.service';

export const ReportsService = {
  /**
   * Company Overview Report
   * Comprehensive report with attendance, payroll, and performance
   */
  async companyOverview(startDate: Date, endDate: Date, department?: string) {
    const cacheKey = `report:company:${startDate.toISOString()}:${endDate.toISOString()}:${department || 'all'}`;
    const cached = cacheGet<any>(cacheKey);
    if (cached) return cached;

    const where: any = {
      createdAt: { gte: startDate, lte: endDate },
    };

    // Employee stats
    const totalEmployees = await prisma.employeeProfile.count({
      where: department ? { department } : undefined,
    });

    const activeEmployees = await prisma.user.count({
      where: {
        isActive: true,
        profile: department ? { department } : undefined,
      },
    });

    // Attendance stats
    const attendanceRecords = await prisma.attendance.findMany({
      where: {
        date: { gte: startDate, lte: endDate },
        user: department ? { profile: { department } } : undefined,
      },
    });

    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const presentDays = attendanceRecords.filter(a => a.checkIn).length;
    const avgAttendance = totalEmployees > 0 ? ((presentDays / (totalEmployees * totalDays)) * 100).toFixed(2) : 0;

    // Payroll stats
    const payrollData = await prisma.payslip.aggregate({
      where: {
        createdAt: { gte: startDate, lte: endDate },
        user: department ? { profile: { department } } : undefined,
      },
      _sum: { gross: true, net: true },
      _avg: { gross: true, net: true },
    });

    // Leave stats
    const leaveRequests = await prisma.leaveRequest.findMany({
      where: {
        startDate: { gte: startDate },
        endDate: { lte: endDate },
        user: department ? { profile: { department } } : undefined,
      },
    });

    const approvedLeaves = leaveRequests.filter(l => l.status === 'APPROVED').length;
    const pendingLeaves = leaveRequests.filter(l => l.status === 'PENDING').length;
    const rejectedLeaves = leaveRequests.filter(l => l.status === 'REJECTED').length;

    const result = {
      period: { startDate, endDate },
      department: department || 'All Departments',
      employees: {
        total: totalEmployees,
        active: activeEmployees,
        inactive: totalEmployees - activeEmployees,
      },
      attendance: {
        avgAttendance: parseFloat(avgAttendance as string),
        totalRecords: attendanceRecords.length,
        presentDays,
        totalPossibleDays: totalEmployees * totalDays,
      },
      payroll: {
        totalGross: payrollData._sum.gross || 0,
        totalNet: payrollData._sum.net || 0,
        avgGross: payrollData._avg.gross || 0,
        avgNet: payrollData._avg.net || 0,
      },
      leaves: {
        total: leaveRequests.length,
        approved: approvedLeaves,
        pending: pendingLeaves,
        rejected: rejectedLeaves,
      },
    };

    cacheSet(cacheKey, result, 300_000); // 5 minutes
    return result;
  },

  /**
   * Department Performance Report
   */
  async departmentPerformance(startDate: Date, endDate: Date) {
    const departments = ['Engineering', 'Sales', 'Marketing', 'Operations', 'Finance', 'HR'];
    
    const performanceData = await Promise.all(
      departments.map(async (dept) => {
        const employeeCount = await prisma.employeeProfile.count({
          where: { department: dept },
        });

        const attendance = await prisma.attendance.count({
          where: {
            date: { gte: startDate, lte: endDate },
            checkIn: { not: null },
            user: { profile: { department: dept } },
          },
        });

        const payroll = await prisma.payslip.aggregate({
          where: {
            createdAt: { gte: startDate, lte: endDate },
            user: { profile: { department: dept } },
          },
          _sum: { gross: true },
        });

        const leaves = await prisma.leaveRequest.count({
          where: {
            startDate: { gte: startDate },
            status: 'APPROVED',
            user: { profile: { department: dept } },
          },
        });

        return {
          department: dept,
          employeeCount,
          attendanceRate: employeeCount > 0 ? ((attendance / employeeCount) * 100).toFixed(2) : 0,
          totalPayroll: payroll._sum.gross || 0,
          leavesApproved: leaves,
          performanceScore: Math.floor(Math.random() * 30) + 70, // Mock score 70-100
        };
      })
    );

    return {
      period: { startDate, endDate },
      departments: performanceData,
    };
  },

  /**
   * Payroll Summary Report
   */
  async payrollSummary(startDate: Date, endDate: Date, department?: string) {
    const payslips = await prisma.payslip.findMany({
      where: {
        createdAt: { gte: startDate, lte: endDate },
        user: department ? { profile: { department } } : undefined,
      },
      include: {
        user: {
          include: {
            profile: true,
          },
        },
      },
    });

    const summary = {
      period: { startDate, endDate },
      department: department || 'All Departments',
      totalEmployees: payslips.length,
      totalGross: payslips.reduce((sum, p) => sum + Number(p.gross), 0),
      totalNet: payslips.reduce((sum, p) => sum + Number(p.net), 0),
      totalDeductions: payslips.reduce((sum, p) => sum + (Number(p.gross) - Number(p.net)), 0),
      avgGross: payslips.length > 0 ? payslips.reduce((sum, p) => sum + Number(p.gross), 0) / payslips.length : 0,
      avgNet: payslips.length > 0 ? payslips.reduce((sum, p) => sum + Number(p.net), 0) / payslips.length : 0,
      breakdown: payslips.map(p => ({
        employeeId: p.userId,
        employeeName: p.user.name,
        department: p.user.profile?.department || 'Unassigned',
        gross: Number(p.gross),
        net: Number(p.net),
        deductions: Number(p.gross) - Number(p.net),
      })),
    };

    return summary;
  },

  /**
   * Leave Utilization Report
   */
  async leaveUtilization(startDate: Date, endDate: Date, department?: string) {
    const leaves = await prisma.leaveRequest.findMany({
      where: {
        startDate: { gte: startDate },
        endDate: { lte: endDate },
        user: department ? { profile: { department } } : undefined,
      },
      include: {
        user: {
          include: {
            profile: true,
          },
        },
      },
    });

    const byType = leaves.reduce((acc: any, leave) => {
      const type = leave.type || 'OTHER';
      if (!acc[type]) {
        acc[type] = { count: 0, days: 0 };
      }
      acc[type].count++;
      const days = Math.ceil((new Date(leave.endDate).getTime() - new Date(leave.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1;
      acc[type].days += days;
      return acc;
    }, {});

    const byStatus = leaves.reduce((acc: any, leave) => {
      const status = leave.status;
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    return {
      period: { startDate, endDate },
      department: department || 'All Departments',
      totalRequests: leaves.length,
      byType,
      byStatus,
      topUsers: leaves
        .reduce((acc: any[], leave) => {
          const existing = acc.find(u => u.userId === leave.userId);
          const days = Math.ceil((new Date(leave.endDate).getTime() - new Date(leave.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1;
          if (existing) {
            existing.count++;
            existing.days += days;
          } else {
            acc.push({
              userId: leave.userId,
              userName: leave.user.name,
              department: leave.user.profile?.department || 'Unassigned',
              count: 1,
              days,
            });
          }
          return acc;
        }, [])
        .sort((a, b) => b.days - a.days)
        .slice(0, 10),
    };
  },

  /**
   * Attendance Analytics Report
   */
  async attendanceAnalytics(startDate: Date, endDate: Date, department?: string) {
    const attendance = await prisma.attendance.findMany({
      where: {
        date: { gte: startDate, lte: endDate },
        user: department ? { profile: { department } } : undefined,
      },
      include: {
        user: {
          include: {
            profile: true,
          },
        },
      },
    });

    const totalRecords = attendance.length;
    const presentRecords = attendance.filter(a => a.checkIn).length;
    const absentRecords = totalRecords - presentRecords;

    // Late check-ins (after 9:30 AM)
    const lateCheckIns = attendance.filter(a => {
      if (!a.checkIn) return false;
      const hour = a.checkIn.getHours();
      const minute = a.checkIn.getMinutes();
      return hour > 9 || (hour === 9 && minute > 30);
    });

    // Early checkouts (before 5:30 PM)
    const earlyCheckouts = attendance.filter(a => {
      if (!a.checkOut) return false;
      const hour = a.checkOut.getHours();
      const minute = a.checkOut.getMinutes();
      return hour < 17 || (hour === 17 && minute < 30);
    });

    return {
      period: { startDate, endDate },
      department: department || 'All Departments',
      summary: {
        totalRecords,
        present: presentRecords,
        absent: absentRecords,
        attendanceRate: totalRecords > 0 ? ((presentRecords / totalRecords) * 100).toFixed(2) : 0,
      },
      patterns: {
        lateCheckIns: lateCheckIns.length,
        earlyCheckouts: earlyCheckouts.length,
        lateCheckInRate: presentRecords > 0 ? ((lateCheckIns.length / presentRecords) * 100).toFixed(2) : 0,
      },
      dailyTrend: attendance.reduce((acc: any[], record) => {
        const date = record.date.toISOString().split('T')[0];
        const existing = acc.find(d => d.date === date);
        if (existing) {
          existing.present += record.checkIn ? 1 : 0;
          existing.absent += record.checkIn ? 0 : 1;
        } else {
          acc.push({
            date,
            present: record.checkIn ? 1 : 0,
            absent: record.checkIn ? 0 : 1,
          });
        }
        return acc;
      }, []),
    };
  },

  /**
   * Employee Growth Report
   */
  async employeeGrowth(startDate: Date, endDate: Date) {
    const employees = await prisma.user.findMany({
      where: {
        createdAt: { gte: startDate, lte: endDate },
      },
      include: {
        profile: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    const monthlyGrowth = employees.reduce((acc: any[], emp) => {
      const month = emp.createdAt.toISOString().slice(0, 7); // YYYY-MM
      const existing = acc.find(m => m.month === month);
      if (existing) {
        existing.joined++;
      } else {
        acc.push({ month, joined: 1, left: 0 });
      }
      return acc;
    }, []);

    // Get inactive users (left)
    const inactiveUsers = await prisma.user.findMany({
      where: {
        isActive: false,
        updatedAt: { gte: startDate, lte: endDate },
      },
    });

    inactiveUsers.forEach(user => {
      const month = user.updatedAt.toISOString().slice(0, 7);
      const existing = monthlyGrowth.find(m => m.month === month);
      if (existing) {
        existing.left++;
      } else {
        monthlyGrowth.push({ month, joined: 0, left: 1 });
      }
    });

    // Calculate cumulative
    let cumulative = 0;
    monthlyGrowth.forEach(m => {
      cumulative += m.joined - m.left;
      m.total = cumulative;
    });

    const currentTotal = await prisma.user.count({ where: { isActive: true } });
    const attritionRate = currentTotal > 0 ? ((inactiveUsers.length / currentTotal) * 100).toFixed(2) : '0';

    return {
      period: { startDate, endDate },
      currentTotal,
      totalJoined: employees.length,
      totalLeft: inactiveUsers.length,
      attritionRate: parseFloat(attritionRate),
      monthlyGrowth,
      byDepartment: employees.reduce((acc: any, emp) => {
        const dept = emp.profile?.department || 'Unassigned';
        acc[dept] = (acc[dept] || 0) + 1;
        return acc;
      }, {}),
    };
  },
};
