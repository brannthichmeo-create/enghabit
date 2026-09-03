import { Router } from 'express';
import {
  UserRole,
  notificationQuerySchema,
  registerDeviceSchema,
  updateNotificationSettingSchema,
  type RegisterDeviceInput,
  type UpdateNotificationSettingInput,
} from '@enghabit/shared';
import { asyncHandler } from '../../common/middlewares/async-handler.js';
import { currentUser, requireAuth, requireRole } from '../../common/middlewares/auth-guard.js';
import { getValidatedQuery, validateBody, validateQuery } from '../../common/middlewares/validate.js';
import { BadRequestError } from '../../common/errors/app-error.js';
import * as notificationService from './notification.service.js';

export const notificationRoutes: Router = Router();

notificationRoutes.use(requireAuth);

// --- Thông báo trong ứng dụng ---

notificationRoutes.get(
  '/',
  validateQuery(notificationQuerySchema),
  asyncHandler(async (req, res) => {
    res.json(
      await notificationService.listNotifications(
        currentUser(req).id,
        getValidatedQuery(req, notificationQuerySchema),
      ),
    );
  }),
);

notificationRoutes.get(
  '/unread-count',
  asyncHandler(async (req, res) => {
    res.json({ count: await notificationService.countUnread(currentUser(req).id) });
  }),
);

notificationRoutes.patch(
  '/:id/read',
  asyncHandler(async (req, res) => {
    res.json(await notificationService.markRead(currentUser(req).id, parseId(req.params.id)));
  }),
);

notificationRoutes.post(
  '/read-all',
  asyncHandler(async (req, res) => {
    res.json(await notificationService.markAllRead(currentUser(req).id));
  }),
);

notificationRoutes.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    await notificationService.deleteNotification(currentUser(req).id, parseId(req.params.id));
    res.status(204).send();
  }),
);

// --- Cấu hình nhắc nhở ---
//
// Chỉ người học: nội dung nhắc là "hôm nay bạn chưa học", "chuỗi sắp đứt", "có thẻ tới
// hạn ôn" — cron cũng đã bỏ qua tài khoản quản trị (xem be/src/jobs/reminder.job.ts),
// nên để họ đặt được giờ nhắc chỉ tạo ra một cấu hình không bao giờ dùng tới.
//
// Danh sách thông báo phía trên thì KHÔNG chặn: quản trị viên vẫn nhận được thông báo
// hệ thống trong chuông.

notificationRoutes.get(
  '/settings',
  requireRole(UserRole.USER),
  asyncHandler(async (req, res) => {
    res.json(await notificationService.getSetting(currentUser(req).id));
  }),
);

notificationRoutes.put(
  '/settings',
  requireRole(UserRole.USER),
  validateBody(updateNotificationSettingSchema),
  asyncHandler(async (req, res) => {
    res.json(
      await notificationService.updateSetting(
        currentUser(req).id,
        req.body as UpdateNotificationSettingInput,
      ),
    );
  }),
);

// --- Thiết bị nhận push ---

notificationRoutes.post(
  '/devices',
  validateBody(registerDeviceSchema),
  asyncHandler(async (req, res) => {
    await notificationService.registerDevice(currentUser(req).id, req.body as RegisterDeviceInput);
    res.status(204).send();
  }),
);

notificationRoutes.delete(
  '/devices/:playerId',
  asyncHandler(async (req, res) => {
    await notificationService.unregisterDevice(currentUser(req).id, req.params.playerId ?? '');
    res.status(204).send();
  }),
);

function parseId(value: string | undefined): number {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) throw new BadRequestError('ID không hợp lệ');
  return id;
}
