import { Request, Response } from 'express';
import { SettingsService } from '../services/settings.service';

type Template = {
  id: string;
  name: string;
  description?: string;
  highlights?: string[];
  config?: {
    hraPercent?: number;
    bonusPercent?: number;
    officeScoreWeight?: number;
    pfPercent?: number;
    professionalTax?: number;
    esiPercent?: number;
    tdsPercent?: number;
  };
};

const CATEGORY = 'payrollTemplates';
const KEY = 'templates';

export async function getTemplates(_req: Request, res: Response) {
  const data = await SettingsService.getByCategory(CATEGORY);
  const templates = (data?.[KEY] as Template[]) || [];
  return res.json({ templates });
}

export async function saveTemplates(req: Request, res: Response) {
  const templates = (req.body?.templates as Template[]) || [];
  if (!Array.isArray(templates)) {
    return res.status(400).json({ error: 'templates must be an array' });
  }
  const updated = await SettingsService.updateSettings(CATEGORY, { [KEY]: templates });
  return res.json({ templates: updated[KEY] || [] });
}

export async function deleteTemplate(req: Request, res: Response) {
  const id = req.params.id;
  const data = await SettingsService.getByCategory(CATEGORY);
  const current = (data?.[KEY] as Template[]) || [];
  const next = current.filter((t) => t.id !== id);
  const updated = await SettingsService.updateSettings(CATEGORY, { [KEY]: next });
  return res.json({ templates: updated[KEY] || [] });
}


