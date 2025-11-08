import { Router } from 'express';
import { signup, login, refresh, logout } from '../controllers/auth.controller';

export const authRouter = Router();

authRouter.post('/signup', signup);
authRouter.post('/login', login);
authRouter.post('/refresh', refresh);
authRouter.post('/logout', logout);
