import { z } from 'zod';

export const updateMyProfileSchema = z.object({
  phone: z.string().min(7).max(20).optional(),
  jobTitle: z.string().min(1).max(120).optional(),
  workLocation: z.string().min(1).max(120).optional(),
  photoPublicId: z.string().min(1).max(256).optional(),
});
export type UpdateMyProfileDto = z.infer<typeof updateMyProfileSchema>;

export const parsedResumeSchema = z.unknown();
export type ParsedResumeDto = unknown;
