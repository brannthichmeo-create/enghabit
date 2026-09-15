import { Router } from 'express';
import { UserRole } from '@enghabit/shared';
import { asyncHandler } from '../../common/middlewares/async-handler.js';
import { requireAuth, requireRole } from '../../common/middlewares/auth-guard.js';
import { BadRequestError } from '../../common/errors/app-error.js';
import * as topicService from './topic.service.js';

/**
 * Đọc bộ thẻ "Hệ thống" cho màn Nội dung học tập của quản trị viên.
 *
 * Người học không dùng nhánh này nữa — họ đọc bộ thẻ qua /library, nơi áp quyền truy cập
 * theo chủ sở hữu và chế độ hiển thị. Thao tác ghi nằm ở module admin.
 */
export const topicRoutes: Router = Router();

topicRoutes.use(requireAuth, requireRole(UserRole.ADMIN));

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
    res.json(await topicService.listVocabularyByTopic(parseId(req.params.id)));
  }),
);

function parseId(value: string | undefined): number {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) throw new BadRequestError('ID không hợp lệ');
  return id;
}
