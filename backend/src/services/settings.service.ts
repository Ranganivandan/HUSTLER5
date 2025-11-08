import { prisma } from './prisma.service';
import { cacheGet, cacheSet, cacheInvalidatePrefix } from './cache.service';

// Default settings structure
const DEFAULT_SETTINGS = {
  company: {
    companyName: 'WorkZen Technologies',
    fiscalYearStart: '2025-04',
    currency: 'INR',
    timezone: 'Asia/Kolkata',
    address: '123 Tech Park, Bangalore, Karnataka',
  },
  attendance: {
    minHoursPerDay: 8,
    graceTimeMinutes: 15,
    workingDays: 'Monday - Saturday',
    autoMarkAbsentAfterDays: 3,
  },
  leaves: {
    casualLeavesYearly: 12,
    sickLeavesYearly: 12,
    privilegeLeavesYearly: 15,
    maxConsecutiveDays: 5,
    allowCarryForward: true,
  },
  payroll: {
    pfPercentage: 12,
    esiPercentage: 1.75,
    professionalTax: 200,
    defaultBonusPercentage: 10,
  },
  notifications: {
    emailAlerts: true,
    attendanceReminders: true,
    leaveApprovalNotifications: true,
  },
};

export const SettingsService = {
  async getAll() {
    const cacheKey = 'settings:all';
    const cached = cacheGet<any>(cacheKey);
    if (cached) return cached;

    const settings = await prisma.companySettings.findMany();
    
    // Build settings object from database
    const settingsMap: any = {
      company: {},
      attendance: {},
      leaves: {},
      payroll: {},
      notifications: {},
    };

    settings.forEach((setting) => {
      settingsMap[setting.category][setting.key] = setting.value;
    });

    // Merge with defaults for any missing settings
    const result = {
      company: { ...DEFAULT_SETTINGS.company, ...settingsMap.company },
      attendance: { ...DEFAULT_SETTINGS.attendance, ...settingsMap.attendance },
      leaves: { ...DEFAULT_SETTINGS.leaves, ...settingsMap.leaves },
      payroll: { ...DEFAULT_SETTINGS.payroll, ...settingsMap.payroll },
      notifications: { ...DEFAULT_SETTINGS.notifications, ...settingsMap.notifications },
    };

    cacheSet(cacheKey, result, 300_000); // Cache for 5 minutes
    return result;
  },

  async getByCategory(category: string) {
    const cacheKey = `settings:${category}`;
    const cached = cacheGet<any>(cacheKey);
    if (cached) return cached;

    const settings = await prisma.companySettings.findMany({
      where: { category },
    });

    const settingsMap: any = {};
    settings.forEach((setting) => {
      settingsMap[setting.key] = setting.value;
    });

    // Merge with defaults
    const defaults = (DEFAULT_SETTINGS as any)[category] || {};
    const result = { ...defaults, ...settingsMap };

    cacheSet(cacheKey, result, 300_000);
    return result;
  },

  async updateSettings(category: string, data: Record<string, any>) {
    // Update or create each setting
    const updates = Object.entries(data).map(([key, value]) =>
      prisma.companySettings.upsert({
        where: { key: `${category}.${key}` },
        create: {
          key: `${category}.${key}`,
          category,
          value: value as any,
        },
        update: {
          value: value as any,
        },
      })
    );

    await Promise.all(updates);

    // Invalidate cache
    cacheInvalidatePrefix('settings:');

    return this.getByCategory(category);
  },

  async initializeDefaults() {
    // Check if settings exist
    const count = await prisma.companySettings.count();
    if (count > 0) return; // Already initialized

    // Create default settings
    const settingsToCreate = [];
    for (const [category, settings] of Object.entries(DEFAULT_SETTINGS)) {
      for (const [key, value] of Object.entries(settings)) {
        settingsToCreate.push({
          key: `${category}.${key}`,
          category,
          value: value as any,
        });
      }
    }

    await prisma.companySettings.createMany({
      data: settingsToCreate,
      skipDuplicates: true,
    });
  },
};
