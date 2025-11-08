import { useQuery, useMutation } from '@tanstack/react-query';
import { queryKeys, invalidateQueries } from '@/lib/react-query';
import * as api from '@/lib/api';
import { toast } from 'sonner';

// ==================== ATTENDANCE HOOKS ====================

export function useAttendance(filters?: any) {
  return useQuery({
    queryKey: queryKeys.attendance.list(filters),
    queryFn: () => api.attendanceApi.getAll(),
    staleTime: 30 * 1000, // 30 seconds
  });
}

export function useAttendanceStats(period?: string) {
  return useQuery({
    queryKey: queryKeys.attendance.stats(period),
    queryFn: () => api.analyticsApi.getAttendance(period),
    staleTime: 60 * 1000, // 1 minute
  });
}

export function useCheckIn() {
  return useMutation({
    mutationFn: api.attendanceApi.checkIn,
    onSuccess: () => {
      invalidateQueries.attendance();
      toast.success('Checked in successfully');
    },
  });
}

export function useCheckOut() {
  return useMutation({
    mutationFn: api.attendanceApi.checkOut,
    onSuccess: () => {
      invalidateQueries.attendance();
      toast.success('Checked out successfully');
    },
  });
}

// ==================== LEAVES HOOKS ====================

export function useLeaves(filters?: any) {
  return useQuery({
    queryKey: queryKeys.leaves.list(filters),
    queryFn: () => api.leavesApi.getAll(),
    staleTime: 60 * 1000,
  });
}

export function useLeaveBalance(userId?: string) {
  return useQuery({
    queryKey: queryKeys.leaves.balance(userId),
    queryFn: () => api.leavesApi.getBalance(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useCreateLeave() {
  return useMutation({
    mutationFn: api.leavesApi.create,
    onSuccess: () => {
      invalidateQueries.leaves();
      toast.success('Leave request submitted');
    },
  });
}

export function useApproveLeave() {
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      api.leavesApi.approve(id, data),
    onSuccess: () => {
      invalidateQueries.leaves();
      toast.success('Leave approved');
    },
  });
}

export function useRejectLeave() {
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      api.leavesApi.reject(id, reason),
    onSuccess: () => {
      invalidateQueries.leaves();
      toast.success('Leave rejected');
    },
  });
}

// ==================== PAYROLL HOOKS ====================

export function usePayslips(filters?: any) {
  return useQuery({
    queryKey: queryKeys.payroll.list(filters),
    queryFn: () => api.payrollApi.getAll(),
    staleTime: 5 * 60 * 1000,
  });
}

export function usePayrollStats(period?: string) {
  return useQuery({
    queryKey: queryKeys.payroll.stats(period),
    queryFn: () => api.analyticsApi.getPayroll(period),
    staleTime: 5 * 60 * 1000,
  });
}

export function useGeneratePayslip() {
  return useMutation({
    mutationFn: api.payrollApi.generate,
    onSuccess: () => {
      invalidateQueries.payroll();
      toast.success('Payslip generated');
    },
  });
}

// ==================== PROFILE HOOKS ====================

export function useProfile(userId?: string) {
  return useQuery({
    queryKey: queryKeys.profile(userId),
    queryFn: () => api.profileApi.get(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdateProfile() {
  return useMutation({
    mutationFn: api.profileApi.update,
    onSuccess: (_, variables) => {
      invalidateQueries.profile(variables.userId);
      toast.success('Profile updated');
    },
  });
}

// ==================== ANALYTICS HOOKS ====================

export function useDashboardAnalytics(role: string) {
  return useQuery({
    queryKey: queryKeys.analytics.dashboard(role),
    queryFn: () => {
      switch (role) {
        case 'employee':
          return api.analyticsApi.getEmployeeDashboard();
        case 'hr':
          return api.analyticsApi.getHRDashboard();
        case 'payroll':
          return api.analyticsApi.getPayrollDashboard();
        case 'admin':
          return api.analyticsApi.getAdminDashboard();
        default:
          throw new Error('Invalid role');
      }
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function usePerformanceAnalytics(period?: string) {
  return useQuery({
    queryKey: queryKeys.analytics.performance(period),
    queryFn: () => api.analyticsApi.getPerformance(period),
    staleTime: 5 * 60 * 1000,
  });
}

// ==================== ADMIN HOOKS ====================

export function useUsers(filters?: any) {
  return useQuery({
    queryKey: queryKeys.admin.users(filters),
    queryFn: () => api.usersApi.getAll(),
    staleTime: 60 * 1000,
  });
}

export function useAuditLogs(filters?: any) {
  return useQuery({
    queryKey: queryKeys.admin.auditLogs(filters),
    queryFn: () => api.adminApi.getAuditLogs(),
    staleTime: 30 * 1000,
  });
}

export function useSettings() {
  return useQuery({
    queryKey: queryKeys.admin.settings,
    queryFn: () => api.settingsApi.get(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useUpdateSettings() {
  return useMutation({
    mutationFn: ({ category, data }: { category: string; data: any }) =>
      api.settingsApi.updateByCategory(category, data),
    onSuccess: () => {
      invalidateQueries.all();
      toast.success('Settings updated');
    },
  });
}

export function useCreateUser() {
  return useMutation({
    mutationFn: api.usersApi.create,
    onSuccess: () => {
      invalidateQueries.all();
      toast.success('User created');
    },
  });
}

export function useUpdateUser() {
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      api.usersApi.update(id, data),
    onSuccess: () => {
      invalidateQueries.all();
      toast.success('User updated');
    },
  });
}

export function useDeleteUser() {
  return useMutation({
    mutationFn: (id: string) => api.usersApi.delete(id),
    onSuccess: () => {
      invalidateQueries.all();
      toast.success('User deleted');
    },
  });
}

// ==================== REPORTS HOOKS ====================

export function useReport(type: string, params?: any) {
  return useQuery({
    queryKey: queryKeys.admin.reports(type, params),
    queryFn: () => {
      switch (type) {
        case 'company-overview':
          return api.reportsApi.companyOverview(params);
        case 'department-performance':
          return api.reportsApi.departmentPerformance(params);
        case 'payroll-summary':
          return api.reportsApi.payrollSummary(params);
        case 'leave-utilization':
          return api.reportsApi.leaveUtilization(params);
        case 'attendance-analytics':
          return api.reportsApi.attendanceAnalytics(params);
        case 'employee-growth':
          return api.reportsApi.employeeGrowth(params);
        default:
          throw new Error('Invalid report type');
      }
    },
    enabled: false, // Only fetch when explicitly called
    staleTime: 0, // Always fresh
  });
}

// ==================== HR HOOKS ====================

export function useEmployees(filters?: any) {
  return useQuery({
    queryKey: queryKeys.hr.employees(filters),
    queryFn: () => api.usersApi.getAll(),
    staleTime: 2 * 60 * 1000,
  });
}

export function useDepartments() {
  return useQuery({
    queryKey: queryKeys.hr.departments,
    queryFn: () => api.profileApi.getDepartments?.() || Promise.resolve([]),
    staleTime: 10 * 60 * 1000,
  });
}
