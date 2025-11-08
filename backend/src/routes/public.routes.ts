import { Router } from 'express';
import * as publicController from '../controllers/public.controller';

const publicRouter = Router();

// Public statistics endpoint (no authentication required)
publicRouter.get('/stats', publicController.getPublicStats);

export default publicRouter;
