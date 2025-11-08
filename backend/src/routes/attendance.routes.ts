import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { checkin, checkout, list, stats, summary } from '../controllers/attendance.controller';

export const attendanceRouter = Router();

attendanceRouter.use(authenticate);

attendanceRouter.post('/checkin', checkin);
attendanceRouter.post('/checkout', checkout);
attendanceRouter.get('/', list);
attendanceRouter.get('/stats', stats);
attendanceRouter.get('/summary', authorize(['admin','hr']), summary);
