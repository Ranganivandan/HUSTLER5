import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { apply, list, approve, reject, getMyBalances, cancel } from '../controllers/leaves.controller';

export const leavesRouter = Router();

leavesRouter.use(authenticate);

// Balances (current user)
leavesRouter.get('/balances/me', getMyBalances);

// Employees apply
leavesRouter.post('/apply', apply);

// List: employees see own; admin/hr/payroll can see all via query
leavesRouter.get('/', list);

// Decisions: hr/payroll/admin
leavesRouter.put('/:id/approve', authorize(['admin','hr','payroll']), approve);
leavesRouter.put('/:id/reject', authorize(['admin','hr','payroll']), reject);

// Cancel pending leave (owner or privileged roles)
leavesRouter.put('/:id/cancel', cancel);
