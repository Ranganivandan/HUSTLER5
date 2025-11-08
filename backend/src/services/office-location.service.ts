/**
 * Office Location Service
 * Manages office location settings for geofencing
 */

import { prisma } from '../lib/prisma';

const OFFICE_LOCATION_KEY = 'office_location';
const OFFICE_LOCATION_CATEGORY = 'attendance';

interface OfficeLocation {
  lat: number;
  lng: number;
  address?: string;
  radius: number; // in meters
  name?: string;
  updatedBy?: string;
  updatedAt?: string;
}

export const OfficeLocationService = {
  /**
   * Get office location settings
   */
  async get(): Promise<OfficeLocation | null> {
    const setting = await prisma.companySettings.findUnique({
      where: { key: OFFICE_LOCATION_KEY },
    });

    if (!setting) {
      return null;
    }

    return setting.value as unknown as OfficeLocation;
  },

  /**
   * Set or update office location (Admin only)
   */
  async set(data: OfficeLocation, adminId: string): Promise<OfficeLocation> {
    const locationData: OfficeLocation = {
      ...data,
      updatedBy: adminId,
      updatedAt: new Date().toISOString(),
    };

    await prisma.companySettings.upsert({
      where: { key: OFFICE_LOCATION_KEY },
      create: {
        key: OFFICE_LOCATION_KEY,
        category: OFFICE_LOCATION_CATEGORY,
        value: locationData as any,
      },
      update: {
        value: locationData as any,
        updatedAt: new Date(),
      },
    });

    return locationData;
  },

  /**
   * Delete office location (disable geofencing)
   */
  async delete(): Promise<void> {
    await prisma.companySettings.deleteMany({
      where: { key: OFFICE_LOCATION_KEY },
    });
  },

  /**
   * Check if office location is configured
   */
  async isConfigured(): Promise<boolean> {
    const location = await this.get();
    return location !== null;
  },
};
