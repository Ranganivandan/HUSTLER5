import { z } from 'zod';

export const listUsersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(10).optional(),
  role: z.string().optional(),
  active: z.coerce.boolean().optional(),
});
export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;

export const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  password: z.string().min(8).optional(), // Optional - will auto-generate if not provided
  role: z.enum(['employee','hr','payroll','admin']).default('employee').optional(),
  department: z.string().optional(),
  sendCredentials: z.coerce.boolean().default(true).optional(), // Send credentials email
});
export type CreateUserDto = z.infer<typeof createUserSchema>;

export const updateUserSchema = z.object({
  role: z.enum(['employee','hr','payroll','admin']).optional(),
  isActive: z.boolean().optional(),
});
export type UpdateUserDto = z.infer<typeof updateUserSchema>;
