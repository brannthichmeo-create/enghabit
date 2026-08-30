import { Router } from 'express';
import { practiceMistakesSchema, submitLessonSchema, type SubmitLessonInput } from '@enghabit/shared';
import { asyncHandler } from '../../common/middlewares/async-handler.js';
import { currentUser, requireAuth } from '../../common/middlewares/auth-guard.js';
import { getValidatedQuery, validateBody, validateQuery } from '../../common/middlewares/validate.js';
import { BadRequestError } from '../../common/errors/app-error.js';
import * as lessonService from './lesson.service.js';

export const lessonRoutes: Router = Router();

lessonRoutes.use(requireAuth);

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
