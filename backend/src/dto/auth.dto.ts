import { z } from 'zod';

// Email validation with strict rules
const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email('Invalid email format')
  .max(255, 'Email too long')
  .refine(
    (email) => {
      // Additional email validation
      const parts = email.split('@');
      if (parts.length !== 2) return false;
      const [local, domain] = parts;
      // Local part should not be empty and max 64 chars
      if (!local || local.length > 64) return false;
      // Domain should have at least one dot and valid chars
      if (!domain || !/^[a-z0-9.-]+\.[a-z]{2,}$/.test(domain)) return false;
      return true;
    },
    { message: 'Invalid email format' }
  );

// Password validation with security requirements
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(100, 'Password too long')
  .refine(
    (password) => {
      // Must contain at least one letter and one number
      return /[a-zA-Z]/.test(password) && /[0-9]/.test(password);
    },
    { message: 'Password must contain at least one letter and one number' }
  );

// Name validation
const nameSchema = z
  .string()
  .trim()
  .min(2, 'Name must be at least 2 characters')
  .max(100, 'Name too long')
  .refine(
    (name) => /^[a-zA-Z\s'-]+$/.test(name),
    { message: 'Name can only contain letters, spaces, hyphens, and apostrophes' }
  );

export const signupSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  fullName: nameSchema,
});

export type SignupDto = z.infer<typeof signupSchema>;

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required').max(100),
});

export type LoginDto = z.infer<typeof loginSchema>;

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required').max(100),
  newPassword: passwordSchema,
});

export type ChangePasswordDto = z.infer<typeof changePasswordSchema>;
