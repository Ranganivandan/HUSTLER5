import { z } from 'zod';

export const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(1),
});

export type SignupDto = z.infer<typeof signupSchema>;

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export type LoginDto = z.infer<typeof loginSchema>;

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(100),
});

export type ChangePasswordDto = z.infer<typeof changePasswordSchema>;
