import { Request, Response, NextFunction } from 'express';
import { SettingsService } from '../services/settings.service';

export const getSettings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const settings = await SettingsService.getAll();
    res.json(settings);
  } catch (error) {
    next(error);
  }
};

export const getSettingsByCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { category } = req.params;
    const settings = await SettingsService.getByCategory(category);
    res.json(settings);
  } catch (error) {
    next(error);
  }
};

export const updateSettings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { category } = req.params;
    const data = req.body;
    const settings = await SettingsService.updateSettings(category, data);
    res.json(settings);
  } catch (error) {
    next(error);
  }
};
