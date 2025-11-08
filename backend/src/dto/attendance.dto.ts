import { z } from 'zod';

export const checkinSchema = z.object({
  method: z.enum(['manual','face','mobile']),
  publicId: z.string().min(1).optional(),
});
export type CheckinDto = z.infer<typeof checkinSchema>;

export const checkoutSchema = z.object({});

export const listAttendanceQuery = z.object({
  userId: z.string().optional(),
  month: z.string().regex(/^\d{4}-\d{2}$/).optional(),
});
export type ListAttendanceQuery = z.infer<typeof listAttendanceQuery>;
