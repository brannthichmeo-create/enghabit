import { Router } from 'express';
import { asyncHandler } from '../../common/middlewares/async-handler.js';
import { requireAuth, currentUser } from '../../common/middlewares/auth-guard.js';
import { BadRequestError } from '../../common/errors/app-error.js';
import * as topicService from './topic.service.js';

/** Route đọc dành cho người học. Thao tác quản trị nằm ở module admin. */
export const topicRoutes: Router = Router();

topicRoutes.use(requireAuth);

topicRoutes.get(
  '/',
  asyncHandler(async (_req, res) => {
    res.json(await topicService.listTopics());
  }),
);

topicRoutes.get(
  '/:id',
  asyncHandler(async (req, res) => {
    res.json(await topicService.getTopic(parseId(req.params.id)));
  }),
);

topicRoutes.get(
  '/:id/vocabulary',
  asyncHandler(async (req, res) => {
    res.json(await topicService.listVocabularyByTopic(parseId(req.params.id), currentUser(req).id));
  }),
);

function parseId(value: string | undefined): number {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) throw new BadRequestError('ID không hợp lệ');
  return id;
}
