import { Router } from 'express';
import {
  UserRole,
  practiceMistakesSchema,
  submitExamSchema,
  submitLessonSchema,
  type SubmitExamInput,
  type SubmitLessonInput,
} from '@enghabit/shared';
import { asyncHandler } from '../../common/middlewares/async-handler.js';
import { currentUser, requireAuth, requireRole } from '../../common/middlewares/auth-guard.js';
import { getValidatedQuery, validateBody, validateQuery } from '../../common/middlewares/validate.js';
import { BadRequestError } from '../../common/errors/app-error.js';
import * as lessonService from './lesson.service.js';
import * as examService from './exam.service.js';

export const lessonRoutes: Router = Router();

// Chỉ người học. Quản trị viên vận hành hệ thống chứ không đi học (xem CLAUDE.md >
// Chức năng cho quản trị viên) — giao diện đã không hiện các màn hình này cho họ, nhưng
// chặn luôn ở API để gọi thẳng bằng token admin cũng không ăn được XP, xu hay streak.
lessonRoutes.use(requireAuth, requireRole(UserRole.USER));

/** Lộ trình: các chủ đề và trạng thái từng bài. */
lessonRoutes.get(
  '/path',
  asyncHandler(async (req, res) => {
    res.json(await lessonService.getPath(currentUser(req).id));
  }),
);

/** Số từ đang sai — dùng cho badge trên thanh điều hướng. */
lessonRoutes.get(
  '/mistakes/count',
  asyncHandler(async (req, res) => {
    res.json({ count: await lessonService.countMistakes(currentUser(req).id) });
  }),
);

/** Danh sách từ đang sai, để hiện trước khi vào luyện. */
lessonRoutes.get(
  '/mistakes',
  validateQuery(practiceMistakesSchema),
  asyncHandler(async (req, res) => {
    const { limit } = getValidatedQuery(req, practiceMistakesSchema);
    res.json(await lessonService.listMistakes(currentUser(req).id, limit));
  }),
);

/** Bài luyện tập sinh từ các từ đang sai. */
lessonRoutes.get(
  '/mistakes/practice',
  validateQuery(practiceMistakesSchema),
  asyncHandler(async (req, res) => {
    const { limit } = getValidatedQuery(req, practiceMistakesSchema);
    res.json(await lessonService.getMistakePractice(currentUser(req).id, limit));
  }),
);

/**
 * Chế độ "Kiểm tra": đề tự sinh từ CẢ chủ đề, ưu tiên từ đang sai (xem exam.service.ts).
 * Đặt TRƯỚC route bắt-tất-cả `/:topicId/:index` bên dưới — nếu không, Express sẽ khớp
 * nhầm "exam" vào tham số `:topicId` của route đó.
 */
lessonRoutes.get(
  '/exam/:topicId',
  asyncHandler(async (req, res) => {
    res.json(await examService.getTopicExam(currentUser(req).id, parseId(req.params.topicId)));
  }),
);

lessonRoutes.post(
  '/exam/submit',
  validateBody(submitExamSchema),
  asyncHandler(async (req, res) => {
    const user = currentUser(req);
    res.json(await examService.submitExam(user.id, user.timezone, req.body as SubmitExamInput));
  }),
);

/** Đề bài của một bài học cụ thể. */
lessonRoutes.get(
  '/:topicId/:index',
  asyncHandler(async (req, res) => {
    res.json(await lessonService.getLesson(parseId(req.params.topicId), parseIndex(req.params.index)));
  }),
);

lessonRoutes.post(
  '/submit',
  validateBody(submitLessonSchema),
  asyncHandler(async (req, res) => {
    const user = currentUser(req);
    res.json(await lessonService.submitLesson(user.id, user.timezone, req.body as SubmitLessonInput));
  }),
);

function parseId(value: string | undefined): number {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) throw new BadRequestError('ID không hợp lệ');
  return id;
}

function parseIndex(value: string | undefined): number {
  const index = Number(value);
  if (!Number.isInteger(index) || index < 0) throw new BadRequestError('Số thứ tự bài không hợp lệ');
  return index;
}
