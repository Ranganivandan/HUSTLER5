import { prisma } from '../services/prisma.service';
import { ProfileRepository } from '../repositories/profile.repository';

function stripScripts(value: unknown): unknown {
  if (typeof value === 'string') {
    // Remove script tags and event handlers
    return value.replace(/<\/?script[^>]*>/gi, '').replace(/on[a-z]+\s*=\s*"[^"]*"/gi, '');
  }
  if (Array.isArray(value)) return value.map(stripScripts);
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (typeof v === 'function') continue;
      out[k] = stripScripts(v);
    }
    return out;
  }
  return value;
}

export const ProfileService = {
  sanitizeParsedResume(input: unknown): unknown {
    return stripScripts(input);
  },

  async list(requestorRole: string, page: number, limit: number, search?: string) {
    if (!['admin', 'hr'].includes(requestorRole)) {
      const err: any = new Error('Forbidden');
      err.status = 403;
      throw err;
    }
    return ProfileRepository.list(page, limit, search);
  },

  async generateEmployeeCode(): Promise<string> {
    // Generate unique employee code: WZ-YYYY-NNNN
    const year = new Date().getFullYear();
    const count = await prisma.employeeProfile.count();
    const sequence = String(count + 1).padStart(4, '0');
    return `WZ-${year}-${sequence}`;
  },

  async getMe(userId: string) {
    const profile = await ProfileRepository.getByUserId(userId);
    if (!profile) {
      // create shell profile to ensure existence with unique employee code
      const employeeCode = await this.generateEmployeeCode();
      await prisma.employeeProfile.create({ data: { userId, employeeCode } });
      return ProfileRepository.getByUserId(userId);
    }
    return profile;
  },

  async updateMe(userId: string, data: { phone?: string; jobTitle?: string; workLocation?: string; photoPublicId?: string }) {
    const designation = data.jobTitle;
    const updated = await ProfileRepository.upsertByUserId(userId, {
      phone: data.phone,
      designation,
      workLocation: data.workLocation,
      photoPublicId: data.photoPublicId,
    });
    return updated;
  },

  async getByUserId(requestorRole: string, userId: string) {
    if (!['admin', 'hr'].includes(requestorRole)) {
      const err: any = new Error('Forbidden');
      err.status = 403;
      throw err;
    }
    return ProfileRepository.getByUserId(userId);
  },

  async storeParsedResumeInternal(userId: string, parsed: unknown) {
    const clean = this.sanitizeParsedResume(parsed);
    // ensure profile exists
    await this.getMe(userId);
    return ProfileRepository.setParsedResume(userId, clean);
  },
};
