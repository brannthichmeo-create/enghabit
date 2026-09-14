import { Router } from 'express';
import { asyncHandler } from '../../common/middlewares/async-handler.js';
import { requireAuth } from '../../common/middlewares/auth-guard.js';
import * as featureService from './feature.service.js';

export const featureRoutes: Router = Router();

/**
 * Trạng thái bật/tắt cho client. Mở cho cả hai vai trò: sidebar của quản trị viên
 * không có mục học tập nên không cần, nhưng chặn ở đây chỉ tạo một nhánh lỗi không
 * ai được lợi.
 *
 * CỐ Ý chỉ trả khoá và trạng thái, không trả nhãn: chữ trên giao diện đi qua t() ở FE,
 * lấy nhãn từ BE là đưa một chuỗi không dịch được vào sidebar.
 *
 * Phần GHI nằm ở admin.routes.ts — mọi route /admin/* đã qua role-guard sẵn, không
 * dựng thêm một lối vào có quyền quản trị ở module khác.
 */
featureRoutes.get(
  '/',
  requireAuth,
  asyncHandler(async (_req, res) => {
    res.json(await featureService.getFlags());
  }),
);
