import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { apply, list, approve, reject } from '../controllers/leaves.controller';

export const leavesRouter = Router();

leavesRouter.use(authenticate);

// Employees apply
leavesRouter.post('/apply', apply);

// List: employees see own; admin/hr/payroll can see all via query
leavesRouter.get('/', list);

// Decisions: hr/payroll/admin
leavesRouter.put('/:id/approve', authorize(['admin','hr','payroll']), approve);
leavesRouter.put('/:id/reject', authorize(['admin','hr','payroll']), reject);
