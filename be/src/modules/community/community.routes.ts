import { Router } from 'express';
import { createCommentSchema, createPostSchema, postQuerySchema } from '@enghabit/shared';
import { asyncHandler } from '../../common/middlewares/async-handler.js';
import { requireAuth } from '../../common/middlewares/auth-guard.js';
import { validateBody, validateQuery } from '../../common/middlewares/validate.js';
import * as controller from './community.controller.js';

export const communityRoutes: Router = Router();

/**
 * Diễn đàn Cộng đồng — mở cho CẢ HAI vai trò.
 *
 * Cố ý không có `requireRole` như các module học tập: đây là chỗ trao đổi chung, quản
 * trị viên cần vào được để trả lời và kiểm duyệt. Ranh giới quyền ở đây không theo vai
 * trò mà theo quyền sở hữu — ai viết thì người đó xoá được, riêng quản trị viên xoá
 * được của mọi người (xem `canDelete` trong community.service).
 */
communityRoutes.use(requireAuth);

communityRoutes.get('/posts', validateQuery(postQuerySchema), asyncHandler(controller.list));
communityRoutes.get('/posts/:id', asyncHandler(controller.detail));

// Giới hạn thân request lớn hơn cho route này được đặt ở app.ts, vì express.json toàn
// cục chạy TRƯỚC router nên nếu chỉ khai báo ở đây thì bài có tệp đã bị chặn từ ngoài.
communityRoutes.post('/posts', validateBody(createPostSchema), asyncHandler(controller.create));
communityRoutes.delete('/posts/:id', asyncHandler(controller.remove));

communityRoutes.post(
  '/posts/:id/comments',
  validateBody(createCommentSchema),
  asyncHandler(controller.comment),
);
communityRoutes.delete('/comments/:id', asyncHandler(controller.removeComment));

/** Đảo trạng thái tim. Một endpoint thay vì like/unlike — xem ghi chú ở service. */
communityRoutes.post('/posts/:id/like', asyncHandler(controller.like));

communityRoutes.get('/attachments/:id', asyncHandler(controller.attachment));
