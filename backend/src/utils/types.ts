export type Role = 'employee' | 'hr' | 'payroll' | 'admin';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string | object;
}
