import { z } from 'zod';

export const applyLeaveSchema = z.object({
  type: z.enum(['SICK','CASUAL','EARNED','UNPAID']),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  reason: z.string().max(500).optional(),
});
export type ApplyLeaveDto = z.infer<typeof applyLeaveSchema>;

export const listLeavesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(10).optional(),
  userId: z.string().optional(),
  status: z.enum(['PENDING','APPROVED','REJECTED','CANCELLED']).optional(),
  type: z.enum(['SICK','CASUAL','EARNED','UNPAID']).optional(),
  start: z.coerce.date().optional(),
  end: z.coerce.date().optional(),
});
export type ListLeavesQuery = z.infer<typeof listLeavesQuerySchema>;

export const decisionSchema = z.object({
  reason: z.string().max(500).optional(),
});
export type DecisionDto = z.infer<typeof decisionSchema>;
