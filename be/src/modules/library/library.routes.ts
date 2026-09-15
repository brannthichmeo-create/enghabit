import { Router } from 'express';
import {
  UserRole,
  createStudySetSchema,
  importStudySetCardsSchema,
  reportStudySetSchema,
  studySetCardSchema,
  studySetSearchSchema,
  updateStudySetCardSchema,
  updateStudySetSchema,
} from '@enghabit/shared';
import { asyncHandler } from '../../common/middlewares/async-handler.js';
import { requireAuth, requireRole } from '../../common/middlewares/auth-guard.js';
import { validateBody, validateQuery } from '../../common/middlewares/validate.js';
import * as controller from './library.controller.js';

export const libraryRoutes: Router = Router();

// Chỉ người học. Quản trị viên không tạo bộ thẻ ở đây — họ soạn bộ "Hệ thống" qua
// /admin/content và kiểm duyệt qua /admin/study-sets.
libraryRoutes.use(requireAuth, requireRole(UserRole.USER));

libraryRoutes.get('/sets', validateQuery(studySetSearchSchema), asyncHandler(controller.search));
// Đặt TRƯỚC /sets/:id, nếu không "mine" bị hiểu là một id.
libraryRoutes.get('/sets/mine', asyncHandler(controller.mine));
libraryRoutes.get('/sets/:id', asyncHandler(controller.detail));
libraryRoutes.post('/sets', validateBody(createStudySetSchema), asyncHandler(controller.create));
libraryRoutes.patch('/sets/:id', validateBody(updateStudySetSchema), asyncHandler(controller.update));
libraryRoutes.delete('/sets/:id', asyncHandler(controller.remove));

libraryRoutes.post('/sets/:id/cards', validateBody(studySetCardSchema), asyncHandler(controller.addCard));
// Trần thân request riêng cho route này đặt ở app.ts.
libraryRoutes.post(
  '/sets/:id/cards/import',
  validateBody(importStudySetCardsSchema),
  asyncHandler(controller.importCards),
);
libraryRoutes.patch('/cards/:id', validateBody(updateStudySetCardSchema), asyncHandler(controller.updateCard));
libraryRoutes.delete('/cards/:id', asyncHandler(controller.removeCard));

libraryRoutes.post('/sets/:id/reports', validateBody(reportStudySetSchema), asyncHandler(controller.report));
