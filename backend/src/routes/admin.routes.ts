import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { getAuditLogs, getAnomalies, deleteUser } from '../controllers/admin.controller';

export const adminRouter = Router();

adminRouter.use(authenticate);
adminRouter.use(authorize(['admin']));

adminRouter.get('/audit', getAuditLogs);
adminRouter.get('/anomalies', getAnomalies);
adminRouter.delete('/users/:id', deleteUser);
