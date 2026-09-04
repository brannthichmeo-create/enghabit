import { Router } from 'express';
import { UserRole, calendarRangeSchema, reportRangeSchema, statsRangeSchema } from '@enghabit/shared';
import { asyncHandler } from '../../common/middlewares/async-handler.js';
import { requireAuth, requireRole } from '../../common/middlewares/auth-guard.js';
import { validateQuery } from '../../common/middlewares/validate.js';
import * as controller from './statistics.controller.js';

export const statisticsRoutes: Router = Router();

// Chỉ người học. Quản trị viên vận hành hệ thống chứ không đi học (xem CLAUDE.md >
// Chức năng cho quản trị viên) — giao diện đã không hiện các màn hình này cho họ, nhưng
// chặn luôn ở API để gọi thẳng bằng token admin cũng không ăn được XP, xu hay streak.
statisticsRoutes.use(requireAuth, requireRole(UserRole.USER));

statisticsRoutes.get('/summary', validateQuery(statsRangeSchema), asyncHandler(controller.summary));
// Báo cáo theo khoảng ngày tự chọn — khác /summary ở chỗ nhận from/to thay vì
// ngày/tuần/tháng cố định, và đối chiếu luôn với mục tiêu người học đã đặt.
statisticsRoutes.get('/report', validateQuery(reportRangeSchema), asyncHandler(controller.report));
statisticsRoutes.get('/streak', asyncHandler(controller.streak));
statisticsRoutes.get('/level', asyncHandler(controller.level));
statisticsRoutes.get('/calendar', validateQuery(calendarRangeSchema), asyncHandler(controller.calendar));
