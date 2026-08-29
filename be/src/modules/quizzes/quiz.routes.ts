import { Router } from 'express';
import { submitQuizSchema, type SubmitQuizInput } from '@enghabit/shared';
import { asyncHandler } from '../../common/middlewares/async-handler.js';
import { currentUser, requireAuth } from '../../common/middlewares/auth-guard.js';
import { validateBody } from '../../common/middlewares/validate.js';
import { BadRequestError } from '../../common/errors/app-error.js';
import * as quizService from './quiz.service.js';

export const quizRoutes: Router = Router();

quizRoutes.use(requireAuth);

quizRoutes.get(
  '/',
  asyncHandler(async (req, res) => {
    const topicId = req.query.topicId ? Number(req.query.topicId) : undefined;
    res.json(await quizService.listQuizzes(topicId));
  }),
);

quizRoutes.get(
  '/attempts',
  asyncHandler(async (req, res) => {
    const quizId = req.query.quizId ? Number(req.query.quizId) : undefined;
    res.json(await quizService.listAttempts(currentUser(req).id, quizId));
  }),
);

quizRoutes.get(
  '/:id',
  asyncHandler(async (req, res) => {
    res.json(await quizService.getQuizForAttempt(parseId(req.params.id)));
  }),
);

quizRoutes.post(
  '/:id/submit',
  validateBody(submitQuizSchema),
  asyncHandler(async (req, res) => {
    const user = currentUser(req);
    const result = await quizService.submitQuiz(
      user.id,
      parseId(req.params.id),
      user.timezone,
      req.body as SubmitQuizInput,
    );
    res.status(201).json(result);
  }),
);

function parseId(value: string | undefined): number {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) throw new BadRequestError('ID không hợp lệ');
  return id;
}
