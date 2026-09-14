import type { RequestHandler } from 'express';
import { UserRole, type FeatureKey } from '@enghabit/shared';
import { NotFoundError } from '../../common/errors/app-error.js';
import * as featureService from './feature.service.js';

/**
 * Khoá một nhánh API khi quản trị viên đã tắt tính năng tương ứng.
 *
 * Ẩn mục trên giao diện là CHƯA ĐỦ: token người học gọi thẳng API vẫn ghi ActivityLog,
 * vẫn nhận xu, và thống kê sẽ nói dối. Đây là cùng một bài học với chặn nhóm và với
 * việc chặn module học tập ở tầng router (xem CLAUDE.md).
 *
 * Trả 404 chứ không 403: với người học, tính năng đã tắt là KHÔNG TỒN TẠI, không phải
 * "có nhưng bạn không được phép" — câu sau chỉ làm họ đi hỏi tại sao mình bị cấm.
 */
export const requireFeature =
  (
    key: FeatureKey,
    opts: {
      /**
       * Cho quản trị viên đi qua. Dành cho nhánh dùng chung hai vai trò (/topics):
       * tắt Từ vựng không được làm quản trị viên mất khả năng soạn nội dung ở
       * /admin/content — đúng lúc họ cần soạn nhất.
       */
      adminBypass?: boolean;
    } = {},
  ): RequestHandler =>
  async (req, _res, next) => {
    try {
      if (opts.adminBypass && req.user?.role === UserRole.ADMIN) return next();
      if (await featureService.isEnabled(key)) return next();
      next(new NotFoundError());
    } catch (error) {
      next(error);
    }
  };
