import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { requireInternalKey } from '../middlewares/internal-key.middleware';
import { list, getMe, updateMe, getByUserId, postParsedResume } from '../controllers/profile.controller';

export const profileRouter = Router();

profileRouter.use(authenticate);

// HR/Admin list all profiles
profileRouter.get('/', authorize(['admin','hr']), list);

// Employee self endpoints
profileRouter.get('/me', getMe);
profileRouter.put('/me', updateMe);

// HR/Admin view single profile
profileRouter.get('/:userId', authorize(['admin','hr']), getByUserId);

// Internal ML worker endpoint
profileRouter.post('/:userId/parsed-resume', requireInternalKey, postParsedResume);
