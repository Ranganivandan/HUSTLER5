import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { listHandler, getByIdHandler, createHandler, updateHandler, deleteHandler } from '../controllers/users.controller';

export const usersRouter = Router();

usersRouter.use(authenticate);

usersRouter.get('/', authorize(['admin','hr']), listHandler);
usersRouter.get('/:id', authorize(['admin','hr']), getByIdHandler);
usersRouter.post('/', authorize(['admin','hr']), createHandler);
usersRouter.put('/:id', authorize(['admin','hr']), updateHandler);
usersRouter.delete('/:id', authorize(['admin']), deleteHandler);
