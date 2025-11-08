/**
 * Office Location Controller
 * Handles office location management endpoints
 */

import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { OfficeLocationService } from '../services/office-location.service';
import { z } from 'zod';

const officeLocationSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  address: z.string().optional(),
  radius: z.number().min(1).max(10000), // 1m to 10km
  name: z.string().optional(),
});

/**
 * Get office location
 */
export async function getOfficeLocation(req: AuthRequest, res: Response) {
  const location = await OfficeLocationService.get();
  return res.json(location);
}

/**
 * Set/Update office location (Admin only)
 */
export async function setOfficeLocation(req: AuthRequest, res: Response) {
  const parsed = officeLocationSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid location data', details: parsed.error });
  }

  const location = await OfficeLocationService.set(parsed.data, req.user!.sub);
  return res.json({ message: 'Office location updated successfully', location });
}

/**
 * Delete office location (Admin only)
 */
export async function deleteOfficeLocation(req: AuthRequest, res: Response) {
  await OfficeLocationService.delete();
  return res.json({ message: 'Office location deleted successfully' });
}

/**
 * Check if office location is configured
 */
export async function checkOfficeLocation(req: AuthRequest, res: Response) {
  const isConfigured = await OfficeLocationService.isConfigured();
  return res.json({ configured: isConfigured });
}
