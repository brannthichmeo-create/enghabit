import { Router } from 'express';
import {
  UserRole,
  equipItemSchema,
  shopItemQuerySchema,
  toggleFavoriteSchema,
  walletQuerySchema,
} from '@enghabit/shared';
import { asyncHandler } from '../../common/middlewares/async-handler.js';
import { requireAuth, requireRole } from '../../common/middlewares/auth-guard.js';
import { validateBody, validateQuery } from '../../common/middlewares/validate.js';
import * as controller from './shop.controller.js';

/**
 * Ảnh vật phẩm — router CÔNG KHAI, mount TRƯỚC router có guard (xem app.ts).
 *
 * Thẻ `<img>` của trình duyệt không gửi được header `Authorization`, nên ảnh phải nằm
 * ngoài `requireAuth`. Đây là lý do kỹ thuật, nhưng cũng đúng về mặt nội dung: ảnh vật
 * phẩm là tranh minh hoạ của cửa hàng do quản trị viên soạn, không mang dữ liệu của bất
 * kỳ người dùng nào — khác hẳn tệp đính kèm của nhóm, thứ bắt buộc kiểm tra tư cách
 * thành viên và vì vậy phải tải bằng fetch kèm token.
 *
 * Đổi lại, ảnh dùng được `<img src>` và bộ nhớ đệm của trình duyệt: lưới cửa hàng vài
 * chục thẻ không phải tải lại ảnh sau mỗi lần chuyển trang.
 */
export const shopImageRoutes: Router = Router();

shopImageRoutes.get('/items/:id/image', asyncHandler(controller.getItemImage));

/**
 * Cửa hàng, kho vật phẩm và ví.
 *
 * Chỉ người học, chặn ngay ở tầng router như `rewards` và `habits`: quản trị viên vận
 * hành hệ thống chứ không đi học (xem CLAUDE.md). Ẩn trên giao diện là chưa đủ — token
 * quản trị gọi thẳng API vẫn mua được vật phẩm bằng xu mà họ không đáng có.
 */
export const shopRoutes: Router = Router();

shopRoutes.use(requireAuth, requireRole(UserRole.USER));

shopRoutes.get('/types', asyncHandler(controller.listTypes));
shopRoutes.get('/items', validateQuery(shopItemQuerySchema), asyncHandler(controller.listItems));
shopRoutes.post('/items/:id/buy', asyncHandler(controller.buyItem));
shopRoutes.put(
  '/items/:id/favorite',
  validateBody(toggleFavoriteSchema),
  asyncHandler(controller.setFavorite),
);

shopRoutes.get('/inventory', asyncHandler(controller.getInventory));
shopRoutes.put('/equipped/:typeId', validateBody(equipItemSchema), asyncHandler(controller.equipItem));
shopRoutes.delete('/equipped/:typeId', asyncHandler(controller.unequipItem));

shopRoutes.get('/wallet', validateQuery(walletQuerySchema), asyncHandler(controller.getWallet));
