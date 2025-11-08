import { Router } from 'express';
import { getSettings, getSettingsByCategory, updateSettings } from '../controllers/settings.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const settingsRouter = Router();

// Get all settings (admin only)
settingsRouter.get('/', authenticate, authorize(['admin']), getSettings);

// Get settings by category (admin only)
settingsRouter.get('/:category', authenticate, authorize(['admin']), getSettingsByCategory);

// Update settings by category (admin only)
settingsRouter.put('/:category', authenticate, authorize(['admin']), updateSettings);

export default settingsRouter;
