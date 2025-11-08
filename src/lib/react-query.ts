import { QueryClient, QueryClientProvider, useQuery, useMutation, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import { toast } from 'sonner';

// Create a client
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      gcTime: 5 * 60 * 1000, // 5 minutes (formerly cacheTime)
      refetchOnWindowFocus: false,
      retry: 1,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      onError: (error: any) => {
        toast.error(error?.message || 'An error occurred');
      },
    },
  },
});

// Query Keys
export const queryKeys = {
  // Auth
  currentUser: ['currentUser'] as const,
  
  // Profile
  profile: (userId?: string) => ['profile', userId] as const,
  
  // Attendance
  attendance: {
    all: ['attendance'] as const,
    list: (filters?: any) => ['attendance', 'list', filters] as const,
    detail: (id: string) => ['attendance', 'detail', id] as const,
    stats: (period?: string) => ['attendance', 'stats', period] as const,
  },
  
  // Leaves
  leaves: {
    all: ['leaves'] as const,
    list: (filters?: any) => ['leaves', 'list', filters] as const,
    detail: (id: string) => ['leaves', 'detail', id] as const,
    balance: (userId?: string) => ['leaves', 'balance', userId] as const,
  },
  
  // Payroll
  payroll: {
    all: ['payroll'] as const,
    list: (filters?: any) => ['payroll', 'list', filters] as const,
    detail: (id: string) => ['payroll', 'detail', id] as const,
    stats: (period?: string) => ['payroll', 'stats', period] as const,
  },
  
  // Analytics
  analytics: {
    dashboard: (role: string) => ['analytics', 'dashboard', role] as const,
    attendance: (period?: string) => ['analytics', 'attendance', period] as const,
    leaves: (period?: string) => ['analytics', 'leaves', period] as const,
    payroll: (period?: string) => ['analytics', 'payroll', period] as const,
    performance: (period?: string) => ['analytics', 'performance', period] as const,
  },
  
  // Admin
  admin: {
    users: (filters?: any) => ['admin', 'users', filters] as const,
    auditLogs: (filters?: any) => ['admin', 'auditLogs', filters] as const,
    settings: ['admin', 'settings'] as const,
    reports: (type: string, params?: any) => ['admin', 'reports', type, params] as const,
  },
  
  // HR
  hr: {
    employees: (filters?: any) => ['hr', 'employees', filters] as const,
    departments: ['hr', 'departments'] as const,
    positions: ['hr', 'positions'] as const,
  },
};

// Helper function to invalidate related queries
export const invalidateQueries = {
  attendance: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.attendance.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.analytics.attendance() });
  },
  leaves: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.leaves.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.analytics.leaves() });
  },
  payroll: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.payroll.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.analytics.payroll() });
  },
  profile: (userId?: string) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.profile(userId) });
  },
  all: () => {
    queryClient.invalidateQueries();
  },
};

// Prefetch helper
export const prefetchQuery = async <T>(
  queryKey: readonly unknown[],
  queryFn: () => Promise<T>
) => {
  await queryClient.prefetchQuery({
    queryKey,
    queryFn,
  });
};

// Export for use in components
export { useQuery, useMutation, QueryClientProvider };
export type { UseQueryOptions, UseMutationOptions };
