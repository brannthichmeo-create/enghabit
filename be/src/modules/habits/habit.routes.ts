import { Router } from 'express';
import { UserRole, checkInHabitSchema, createHabitSchema, updateHabitSchema } from '@enghabit/shared';
import { asyncHandler } from '../../common/middlewares/async-handler.js';
import { requireAuth, requireRole } from '../../common/middlewares/auth-guard.js';
import { validateBody } from '../../common/middlewares/validate.js';
import * as controller from './habit.controller.js';

export const habitRoutes: Router = Router();

// Chỉ người học. Quản trị viên vận hành hệ thống chứ không đi học (xem CLAUDE.md >
// Chức năng cho quản trị viên) — giao diện đã không hiện các màn hình này cho họ, nhưng
// chặn luôn ở API để gọi thẳng bằng token admin cũng không ăn được XP, xu hay streak.
habitRoutes.use(requireAuth, requireRole(UserRole.USER));

habitRoutes.get('/', asyncHandler(controller.list));
habitRoutes.post('/', validateBody(createHabitSchema), asyncHandler(controller.create));
habitRoutes.patch('/:id', validateBody(updateHabitSchema), asyncHandler(controller.update));
habitRoutes.delete('/:id', asyncHandler(controller.remove));

habitRoutes.post('/:id/check-in', validateBody(checkInHabitSchema), asyncHandler(controller.checkIn));
habitRoutes.get('/:id/check-ins', asyncHandler(controller.listCheckIns));
habitRoutes.get('/:id/completion-rate', asyncHandler(controller.completionRate));
