/**
 * Office Location Routes
 */

import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import {
  getOfficeLocation,
  setOfficeLocation,
  deleteOfficeLocation,
  checkOfficeLocation,
} from '../controllers/office-location.controller';

export const officeLocationRouter = Router();

officeLocationRouter.use(authenticate);

// All authenticated users can view office location
officeLocationRouter.get('/', getOfficeLocation);
officeLocationRouter.get('/check', checkOfficeLocation);

// Only admin can modify office location
officeLocationRouter.post('/', authorize(['admin']), setOfficeLocation);
officeLocationRouter.put('/', authorize(['admin']), setOfficeLocation);
officeLocationRouter.delete('/', authorize(['admin']), deleteOfficeLocation);
