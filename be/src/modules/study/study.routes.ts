import { Router } from 'express';
import {
  UserRole,
  finishSessionSchema,
  reviewHistoryQuerySchema,
  studyQuestionsSchema,
  submitAnswerSchema,
} from '@enghabit/shared';
import { asyncHandler } from '../../common/middlewares/async-handler.js';
import { requireAuth, requireRole } from '../../common/middlewares/auth-guard.js';
import { validateBody, validateQuery } from '../../common/middlewares/validate.js';
import * as controller from './study.controller.js';

export const studyRoutes: Router = Router();

// Chỉ người học — token quản trị viên gọi thẳng API cũng không ghi được ActivityLog.
// Cờ Học / Ôn tập kiểm tra trong service theo `source` của từng câu hỏi, vì hai tính
// năng dùng chung các endpoint này.
studyRoutes.use(requireAuth, requireRole(UserRole.USER));

studyRoutes.post('/questions', validateBody(studyQuestionsSchema), asyncHandler(controller.questions));
studyRoutes.post('/answers', validateBody(submitAnswerSchema), asyncHandler(controller.answer));
studyRoutes.post('/sessions/finish', validateBody(finishSessionSchema), asyncHandler(controller.finish));

studyRoutes.get('/overview', asyncHandler(controller.overview));
studyRoutes.get('/due-count', asyncHandler(controller.dueCount));
studyRoutes.get('/stats', asyncHandler(controller.stats));
studyRoutes.get('/history', validateQuery(reviewHistoryQuerySchema), asyncHandler(controller.history));
