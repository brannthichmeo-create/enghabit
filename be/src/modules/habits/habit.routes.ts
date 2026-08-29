import { Router } from 'express';
import { checkInHabitSchema, createHabitSchema, updateHabitSchema } from '@enghabit/shared';
import { asyncHandler } from '../../common/middlewares/async-handler.js';
import { requireAuth } from '../../common/middlewares/auth-guard.js';
import { validateBody } from '../../common/middlewares/validate.js';
import * as controller from './habit.controller.js';

export const habitRoutes: Router = Router();

habitRoutes.use(requireAuth);

habitRoutes.get('/', asyncHandler(controller.list));
habitRoutes.post('/', validateBody(createHabitSchema), asyncHandler(controller.create));
habitRoutes.patch('/:id', validateBody(updateHabitSchema), asyncHandler(controller.update));
habitRoutes.delete('/:id', asyncHandler(controller.remove));

habitRoutes.post('/:id/check-in', validateBody(checkInHabitSchema), asyncHandler(controller.checkIn));
habitRoutes.get('/:id/check-ins', asyncHandler(controller.listCheckIns));
habitRoutes.get('/:id/completion-rate', asyncHandler(controller.completionRate));
