import { z } from 'zod';

const locationSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  address: z.string().optional(),
}).optional();

export const checkinSchema = z.object({
  method: z.enum(['manual','face','mobile']),
  publicId: z.string().min(1).optional(),
  location: locationSchema,
});
export type CheckinDto = z.infer<typeof checkinSchema>;

export const checkoutSchema = z.object({
  location: locationSchema,
});

export const listAttendanceQuery = z.object({
  userId: z.string().optional(),
  month: z.string().regex(/^\d{4}-\d{2}$/).optional(),
});
export type ListAttendanceQuery = z.infer<typeof listAttendanceQuery>;
