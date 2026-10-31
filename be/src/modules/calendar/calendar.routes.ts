import { Router } from 'express';
import {
  UserRole,
  calendarDetailQuerySchema,
  calendarQuerySchema,
  createCalendarSchema,
  deleteCalendarSchema,
  updateCalendarSchema,
} from '@enghabit/shared';
import { asyncHandler } from '../../common/middlewares/async-handler.js';
import { requireAuth, requireRole } from '../../common/middlewares/auth-guard.js';
import { validateBody, validateQuery } from '../../common/middlewares/validate.js';
import * as controller from './calendar.controller.js';

export const calendarRoutes: Router = Router();
calendarRoutes.use(requireAuth, requireRole(UserRole.USER));

calendarRoutes.get('/', validateQuery(calendarQuerySchema), asyncHandler(controller.list));
calendarRoutes.post('/', validateBody(createCalendarSchema), asyncHandler(controller.create));
calendarRoutes.get('/:id', validateQuery(calendarDetailQuerySchema), asyncHandler(controller.detail));
calendarRoutes.patch('/:id', validateBody(updateCalendarSchema), asyncHandler(controller.update));
calendarRoutes.delete('/:id', validateBody(deleteCalendarSchema), asyncHandler(controller.remove));
