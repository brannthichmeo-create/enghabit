import { Router } from 'express';
import { UserRole, learnVocabularySchema, reviewFlashcardSchema } from '@enghabit/shared';
import { asyncHandler } from '../../common/middlewares/async-handler.js';
import { requireAuth, requireRole } from '../../common/middlewares/auth-guard.js';
import { validateBody } from '../../common/middlewares/validate.js';
import * as controller from './flashcard.controller.js';

export const flashcardRoutes: Router = Router();

// Chỉ người học. Quản trị viên vận hành hệ thống chứ không đi học (xem CLAUDE.md >
// Chức năng cho quản trị viên) — giao diện đã không hiện các màn hình này cho họ, nhưng
// chặn luôn ở API để gọi thẳng bằng token admin cũng không ăn được XP, xu hay streak.
flashcardRoutes.use(requireAuth, requireRole(UserRole.USER));

flashcardRoutes.get('/due', asyncHandler(controller.due));
flashcardRoutes.get('/due/count', asyncHandler(controller.dueCount));
flashcardRoutes.post('/review', validateBody(reviewFlashcardSchema), asyncHandler(controller.review));
flashcardRoutes.post('/learn', validateBody(learnVocabularySchema), asyncHandler(controller.learn));
