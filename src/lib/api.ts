const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

interface ApiError {
  error: string | object;
}

class ApiClient {
  private baseURL: string;
  private accessToken: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    // Load token from memory (set after login)
    this.accessToken = null;
  }

  setAccessToken(token: string | null) {
    this.accessToken = token;
  }

  getAccessToken() {
    return this.accessToken;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers,
      credentials: 'include', // Important for cookies (refresh token)
    });

    if (!response.ok) {
      const error: ApiError = await response.json().catch(() => ({
        error: 'Request failed',
      }));
      throw new Error(
        typeof error.error === 'string' ? error.error : 'Request failed'
      );
    }

    return response.json();
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const apiClient = new ApiClient(API_URL);

// Auth API
export const authApi = {
  signup: (data: { email: string; password: string; fullName: string }) =>
    apiClient.post<{ user: { id: string; email: string; name: string }; accessToken: string }>(
      '/v1/auth/signup',
      data
    ),
  login: (data: { email: string; password: string }) =>
    apiClient.post<{ user: { id: string; email: string; name: string; role: string }; accessToken: string }>(
      '/v1/auth/login',
      data
    ),
  refresh: () =>
    apiClient.post<{ accessToken: string }>('/v1/auth/refresh'),
  logout: () => apiClient.post<void>('/v1/auth/logout'),
};

// Users API
export const usersApi = {
  list: (params: { page?: number; limit?: number; role?: string; active?: boolean } = {}) => {
    const query = new URLSearchParams();
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    if (params.role) query.set('role', params.role);
    if (typeof params.active === 'boolean') query.set('active', String(params.active));
    return apiClient.get<{ items: Array<{ id: string; name: string; email: string; role: { name: string }; isActive: boolean }>; total: number; page: number; limit: number; pages: number }>(
      `/v1/users${query.toString() ? `?${query.toString()}` : ''}`
    );
  },
  get: (id: string) => apiClient.get<{ id: string; name: string; email: string; role: { name: string }; isActive: boolean }>(`/v1/users/${id}`),
  create: (data: { email: string; name: string; password: string; role?: 'employee'|'hr'|'payroll'|'admin'; sendInvite?: boolean }) =>
    apiClient.post<{ id: string; name: string; email: string; roleId: string; isActive: boolean }>(`/v1/users`, data),
  update: (id: string, data: { role?: 'employee'|'hr'|'payroll'|'admin'; isActive?: boolean }) =>
    apiClient.put<{ id: string; name: string; email: string; roleId: string; isActive: boolean }>(`/v1/users/${id}`, data),
  remove: (id: string) => apiClient.delete<void>(`/v1/users/${id}`),
};

// Profile API
export const profileApi = {
  list: (params: { page?: number; limit?: number; search?: string } = {}) => {
    const q = new URLSearchParams();
    if (params.page) q.set('page', String(params.page));
    if (params.limit) q.set('limit', String(params.limit));
    if (params.search) q.set('search', params.search);
    return apiClient.get<{ items: Array<any>; total: number; page: number; limit: number }>(`/v1/profile${q.toString() ? `?${q.toString()}` : ''}`);
  },
  getMe: () => apiClient.get<unknown>('/v1/profile/me'),
  updateMe: (data: { phone?: string; jobTitle?: string; workLocation?: string; photoPublicId?: string }) =>
    apiClient.put<unknown>('/v1/profile/me', data),
  getByUserId: (userId: string) => apiClient.get<unknown>(`/v1/profile/${userId}`),
  postParsedResume: (userId: string, parsed: unknown, internalKey: string) =>
    fetch(`${API_URL}/v1/profile/${userId}/parsed-resume`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-internal-api-key': internalKey },
      body: JSON.stringify(parsed),
      credentials: 'include',
    }).then(async (r) => {
      if (!r.ok) throw new Error('Failed to upload parsed resume');
      return r.json();
    }),
};

// Attendance API
export const attendanceApi = {
  list: (params: { userId?: string; month?: string } = {}) => {
    const q = new URLSearchParams();
    if (params.userId) q.set('userId', params.userId);
    if (params.month) q.set('month', params.month);
    return apiClient.get<Array<{ id: string; userId: string; date: string; checkIn?: string; checkOut?: string; metadata?: any }>>(`/v1/attendance${q.toString() ? `?${q.toString()}` : ''}`);
  },
  stats: (params: { userId?: string; month?: string } = {}) => {
    const q = new URLSearchParams();
    if (params.userId) q.set('userId', params.userId);
    if (params.month) q.set('month', params.month);
    return apiClient.get<{ days: number; hours: number }>(`/v1/attendance/stats${q.toString() ? `?${q.toString()}` : ''}`);
  },
  summary: (params: { month?: string; department?: string } = {}) => {
    const q = new URLSearchParams();
    if (params.month) q.set('month', params.month);
    if (params.department) q.set('department', params.department);
    return apiClient.get<Array<{ userId: string; name: string; employeeCode: string; present: number; absent: number; leaves: number; percentage: number }>>(`/v1/attendance/summary${q.toString() ? `?${q.toString()}` : ''}`);
  },
  checkin: (data: { method: 'manual'|'face'|'mobile'; publicId?: string }) =>
    apiClient.post<{ record: any; faceVerified?: boolean; score?: number; reason?: string }>(`/v1/attendance/checkin`, data),
  checkout: () => apiClient.post(`/v1/attendance/checkout`),
};

// Leaves API
export const leavesApi = {
  apply: (data: { type: 'SICK'|'CASUAL'|'EARNED'|'UNPAID'; startDate: string; endDate: string; reason?: string }) =>
    apiClient.post(`/v1/leaves/apply`, data),
  list: (params: { page?: number; limit?: number; userId?: string; status?: 'PENDING'|'APPROVED'|'REJECTED'|'CANCELLED'; type?: 'SICK'|'CASUAL'|'EARNED'|'UNPAID'; start?: string; end?: string } = {}) => {
    const q = new URLSearchParams();
    if (params.page) q.set('page', String(params.page));
    if (params.limit) q.set('limit', String(params.limit));
    if (params.userId) q.set('userId', params.userId);
    if (params.status) q.set('status', params.status);
    if (params.type) q.set('type', params.type);
    if (params.start) q.set('start', params.start);
    if (params.end) q.set('end', params.end);
    return apiClient.get<{ items: Array<{ id: string; userId: string; type: 'SICK'|'CASUAL'|'EARNED'|'UNPAID'; status: 'PENDING'|'APPROVED'|'REJECTED'|'CANCELLED'; startDate: string; endDate: string; reason?: string; approvedById?: string; approvedAt?: string; createdAt: string; metadata?: any }>; total: number; page: number; limit: number }>(`/v1/leaves${q.toString() ? `?${q.toString()}` : ''}`);
  },
  approve: (id: string) => apiClient.put(`/v1/leaves/${id}/approve`, {}),
  reject: (id: string, reason?: string) => apiClient.put(`/v1/leaves/${id}/reject`, { reason }),
};

// Analytics API
export const analyticsApi = {
  overview: () => apiClient.get<{ totalEmployees: number; presentToday: number; onLeaveToday: number; pendingLeaveRequests: number; avgAttendance: number }>('/v1/analytics/overview'),
  attendance: (month: string) => apiClient.get<Array<{ date: string; present: number; absent: number }>>(`/v1/analytics/attendance?month=${month}`),
  payroll: (period: string) => apiClient.get<{ totalGross: number; totalDeductions: number; totalNet: number; employeeCount: number }>(`/v1/analytics/payroll?period=${period}`),
};

// Admin API
export const adminApi = {
  auditLogs: (params: { page?: number; limit?: number; entity?: string; action?: string; userId?: string } = {}) => {
    const q = new URLSearchParams();
    if (params.page) q.set('page', String(params.page));
    if (params.limit) q.set('limit', String(params.limit));
    if (params.entity) q.set('entity', params.entity);
    if (params.action) q.set('action', params.action);
    if (params.userId) q.set('userId', params.userId);
    return apiClient.get<{ items: Array<{ id: string; userId?: string; user?: any; action: string; entity?: string; entityId?: string; ip?: string; userAgent?: string; meta?: any; createdAt: string }>; total: number; page: number; limit: number }>(`/v1/admin/audit${q.toString() ? `?${q.toString()}` : ''}`);
  },
  anomalies: () => apiClient.get<Array<{ userId: string; userName: string; employeeCode: string; lateCount: number; dates: string[] }>>('/v1/admin/anomalies'),
  deleteUser: (id: string) => apiClient.delete<{ success: boolean; user: any }>(`/v1/admin/users/${id}`),
};

// Payroll API
export const payrollApi = {
  // Run payroll for a period
  run: (data: { periodStart: string; periodEnd: string }) =>
    apiClient.post<{ id: string; year: number; month: number; status: string; metadata?: any; createdAt: string }>('/v1/payroll/run', data),
  
  // Get payrun by ID with payslips
  getPayrun: (id: string) =>
    apiClient.get<{ id: string; year: number; month: number; status: string; metadata?: any; createdAt: string; payslips: Array<any>; totals: { gross: number; net: number } }>(`/v1/payroll/${id}`),
  
  // Get my payslips (employee self-service)
  getMyPayslips: () => apiClient.get<Array<{ id: string; payrunId: string; userId: string; gross: number; net: number; components?: any; createdAt: string; payrun?: any }>>('/v1/payroll/payslips/me'),
  
  // Get payslips by user ID (admin/payroll/hr)
  getPayslipsByUserId: (userId: string) => apiClient.get<Array<{ id: string; payrunId: string; userId: string; gross: number; net: number; components?: any; createdAt: string; payrun?: any }>>(`/v1/payroll/payslips/${userId}`),
};

// Settings API
export const settingsApi = {
  // Get all settings
  getAll: () => apiClient.get<{
    company: {
      companyName: string;
      fiscalYearStart: string;
      currency: string;
      timezone: string;
      address: string;
    };
    attendance: {
      minHoursPerDay: number;
      graceTimeMinutes: number;
      workingDays: string;
      autoMarkAbsentAfterDays: number;
    };
    leaves: {
      casualLeavesYearly: number;
      sickLeavesYearly: number;
      privilegeLeavesYearly: number;
      maxConsecutiveDays: number;
      allowCarryForward: boolean;
    };
    payroll: {
      pfPercentage: number;
      esiPercentage: number;
      professionalTax: number;
      defaultBonusPercentage: number;
    };
    notifications: {
      emailAlerts: boolean;
      attendanceReminders: boolean;
      leaveApprovalNotifications: boolean;
    };
  }>('/v1/settings'),
  
  // Get settings by category
  getByCategory: (category: string) => apiClient.get<any>(`/v1/settings/${category}`),
  
  // Update settings by category
  updateByCategory: (category: string, data: any) => apiClient.put<any>(`/v1/settings/${category}`, data),
};

// Reports API
export const reportsApi = {
  companyOverview: (params: { range?: string; department?: string } = {}) => {
    const q = new URLSearchParams();
    if (params.range) q.set('range', params.range);
    if (params.department && params.department !== 'all') q.set('department', params.department);
    return apiClient.get<any>(`/v1/reports/company-overview?${q.toString()}`);
  },
  departmentPerformance: (params: { range?: string } = {}) => {
    const q = new URLSearchParams();
    if (params.range) q.set('range', params.range);
    return apiClient.get<any>(`/v1/reports/department-performance?${q.toString()}`);
  },
  payrollSummary: (params: { range?: string; department?: string } = {}) => {
    const q = new URLSearchParams();
    if (params.range) q.set('range', params.range);
    if (params.department && params.department !== 'all') q.set('department', params.department);
    return apiClient.get<any>(`/v1/reports/payroll-summary?${q.toString()}`);
  },
  leaveUtilization: (params: { range?: string; department?: string } = {}) => {
    const q = new URLSearchParams();
    if (params.range) q.set('range', params.range);
    if (params.department && params.department !== 'all') q.set('department', params.department);
    return apiClient.get<any>(`/v1/reports/leave-utilization?${q.toString()}`);
  },
  attendanceAnalytics: (params: { range?: string; department?: string } = {}) => {
    const q = new URLSearchParams();
    if (params.range) q.set('range', params.range);
    if (params.department && params.department !== 'all') q.set('department', params.department);
    return apiClient.get<any>(`/v1/reports/attendance-analytics?${q.toString()}`);
  },
  employeeGrowth: (params: { range?: string } = {}) => {
    const q = new URLSearchParams();
    if (params.range) q.set('range', params.range);
    return apiClient.get<any>(`/v1/reports/employee-growth?${q.toString()}`);
  },
};
