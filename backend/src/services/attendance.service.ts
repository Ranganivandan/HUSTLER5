import { AttendanceRepository } from '../repositories/attendance.repository';
import { MlService } from './ml.service';
import { AnalyticsService } from './analytics.service';
import { OfficeLocationService } from './office-location.service';
import { validateAttendanceLocation } from './geolocation.service';

function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function startEndOfMonth(month?: string) {
  const now = new Date();
  let y = now.getFullYear();
  let m = now.getMonth();
  if (month && /^\d{4}-\d{2}$/.test(month)) {
    const [yy, mm] = month.split('-').map((x) => Number(x));
    y = yy; m = mm - 1;
  }
  const from = new Date(y, m, 1, 0, 0, 0, 0);
  const to = new Date(y, m + 1, 1, 0, 0, 0, 0);
  return { from, to };
}

export const AttendanceService = {
  async checkin(userId: string, method: 'manual'|'face'|'mobile', publicId?: string, location?: { lat: number; lng: number; address?: string }) {
    const today = startOfDay(new Date());
    const existing = await AttendanceRepository.findByUserAndDate(userId, today);
    if (existing?.checkIn) {
      // Idempotent: return existing record instead of throwing
      return { record: existing, faceVerified: undefined as boolean | undefined, score: undefined as number | undefined, reason: undefined as string | undefined };
    }

    // Validate location if office location is configured
    const officeLocation = await OfficeLocationService.get();
    const locationValidation = validateAttendanceLocation(location, officeLocation);
    if (!locationValidation.valid) {
      const err: any = new Error(locationValidation.error || 'Location validation failed');
      err.status = 403;
      throw err;
    }

    let faceVerified: boolean | undefined = undefined;
    let score: number | undefined = undefined;
    let reason: string | undefined = undefined;

    let metadata: any = { method };

    if (method === 'face') {
      try {
        const result = await MlService.verifyFace(publicId);
        faceVerified = result.ok;
        score = result.score;
        reason = result.reason;
        metadata.face = { publicId, score, ok: faceVerified };
      } catch (e) {
        faceVerified = false;
        reason = 'verify_error';
        metadata.face = { publicId, ok: false, error: (e as Error).message };
      }
    }

    const checkIn = new Date();
    const record = await AttendanceRepository.createCheckin({ 
      userId, 
      date: today, 
      checkIn, 
      checkInLocation: location,
      metadata 
    });
    return { record, faceVerified, score, reason, distance: locationValidation.distance };
  },

  async checkout(userId: string, location?: { lat: number; lng: number; address?: string }) {
    const today = startOfDay(new Date());
    const existing = await AttendanceRepository.findByUserAndDate(userId, today);
    if (!existing) {
      const err: any = new Error('No check-in found for today'); err.status = 400; throw err;
    }
    if (existing.checkOut) {
      // Idempotent: return existing record instead of throwing error
      return existing;
    }

    // Validate location if office location is configured
    const officeLocation = await OfficeLocationService.get();
    const locationValidation = validateAttendanceLocation(location, officeLocation);
    if (!locationValidation.valid) {
      const err: any = new Error(locationValidation.error || 'Location validation failed');
      err.status = 403;
      throw err;
    }

    const checkOut = new Date();
    const record = await AttendanceRepository.setCheckout(userId, today, checkOut, location);
    return record;
  },

  async list(requestor: { id: string; role: string }, query: { userId?: string; month?: string }) {
    const { from, to } = startEndOfMonth(query.month);
    const userId = query.userId ?? requestor.id;
    // RBAC: non-admin/hr can only view themselves
    if (!['admin','hr'].includes(requestor.role) && userId !== requestor.id) {
      const err: any = new Error('Forbidden'); err.status = 403; throw err;
    }
    return AttendanceRepository.listByMonth(userId, from, to);
  },

  async stats(requestor: { id: string; role: string }, query: { userId?: string; month?: string }) {
    const { from, to } = startEndOfMonth(query.month);
    const userId = query.userId ?? requestor.id;
    if (!['admin','hr'].includes(requestor.role) && userId !== requestor.id) {
      const err: any = new Error('Forbidden'); err.status = 403; throw err;
    }
    return AttendanceRepository.statsByMonth(userId, from, to);
  },

  async summary(requestor: { role: string }, query: { month?: string; department?: string }) {
    if (!['admin','hr'].includes(requestor.role)) {
      const err: any = new Error('Forbidden'); err.status = 403; throw err;
    }
    const { from, to } = startEndOfMonth(query.month);
    return AttendanceRepository.summaryByMonth(from, to);
  },

  async listAll(requestor: { role: string }, query: { month?: string; userId?: string }) {
    // Only admin/hr can view all attendance
    if (!['admin','hr'].includes(requestor.role)) {
      const err: any = new Error('Forbidden'); err.status = 403; throw err;
    }
    const { from, to } = startEndOfMonth(query.month);
    
    // If userId is specified, filter by that user
    if (query.userId) {
      return AttendanceRepository.listByMonth(query.userId, from, to);
    }
    
    // Otherwise, return all attendance records for the month
    return AttendanceRepository.listAllByMonth(from, to);
  },
};
