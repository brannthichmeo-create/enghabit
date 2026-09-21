import { Router } from 'express';
import {
  UserRole,
  accessLogQuerySchema,
  auditLogQuerySchema,
  adminGroupQuerySchema,
  adminUserQuerySchema,
  adminStudySetReportQuerySchema,
  blockGroupSchema,
  blockStudySetSchema,
  createAnnouncementSchema,
  createShopItemSchema,
  createShopTypeSchema,
  createTopicSchema,
  createVocabularySchema,
  featureKeyParamSchema,
  updateFeatureFlagSchema,
  type UpdateFeatureFlagInput,
  rejectResetRequestSchema,
  resetRequestQuerySchema,
  updateShopItemSchema,
  updateShopTypeSchema,
  updateTopicSchema,
  updateUserRoleSchema,
  updateUserStatusSchema,
  updateVocabularySchema,
  warnGroupSchema,
  type BlockGroupInput,
  type BlockStudySetInput,
  type CreateAnnouncementInput,
  type CreateShopItemInput,
  type CreateShopTypeInput,
  type CreateTopicInput,
  type CreateVocabularyInput,
  type RejectResetRequestInput,
  type UpdateShopItemInput,
  type UpdateShopTypeInput,
  type UpdateTopicInput,
  type UpdateUserRoleInput,
  type UpdateUserStatusInput,
  type UpdateVocabularyInput,
  type WarnGroupInput,
} from '@enghabit/shared';
import { asyncHandler } from '../../common/middlewares/async-handler.js';
import { currentUser, requireAuth, requireRole } from '../../common/middlewares/auth-guard.js';
import { getValidatedQuery, validateBody, validateQuery } from '../../common/middlewares/validate.js';
import { BadRequestError, NotFoundError } from '../../common/errors/app-error.js';
import * as featureService from '../feature-flags/feature.service.js';
import * as notificationService from '../notifications/notification.service.js';
import * as passwordResetService from '../auth/password-reset.service.js';
import * as topicService from '../topics/topic.service.js';
import * as adminService from './admin.service.js';
import * as adminGroupService from './admin-group.service.js';
import * as adminStudySetService from './admin-study-set.service.js';
import * as adminShopService from './admin-shop.service.js';
import * as adminAuditService from './admin-audit.service.js';

export const adminRoutes: Router = Router();

// Mọi route /admin/* bắt buộc qua role-guard (xem CLAUDE.md).
adminRoutes.use(requireAuth, requireRole(UserRole.ADMIN));

// --- Tổng quan hệ thống ---
adminRoutes.get(
  '/overview',
  asyncHandler(async (_req, res) => {
    res.json(await adminService.getSystemOverview());
  }),
);

// --- Người dùng ---
adminRoutes.get(
  '/users',
  validateQuery(adminUserQuerySchema),
  asyncHandler(async (req, res) => {
    res.json(await adminService.listUsers(getValidatedQuery(req, adminUserQuerySchema)));
  }),
);

adminRoutes.get(
  '/users/:id',
  asyncHandler(async (req, res) => {
    res.json(await adminService.getUserDetail(parseId(req.params.id)));
  }),
);

adminRoutes.patch(
  '/users/:id/role',
  validateBody(updateUserRoleSchema),
  asyncHandler(async (req, res) => {
    const { role } = req.body as UpdateUserRoleInput;
    res.json(await adminService.updateUserRole(parseId(req.params.id), role, currentUser(req).id));
  }),
);

adminRoutes.patch(
  '/users/:id/status',
  validateBody(updateUserStatusSchema),
  asyncHandler(async (req, res) => {
    const { status } = req.body as UpdateUserStatusInput;
    res.json(await adminService.updateUserStatus(parseId(req.params.id), status, currentUser(req).id));
  }),
);

// KHÔNG có endpoint đặt mật khẩu hộ người dùng — đã bỏ. Việc cấp lại mật khẩu đi qua
// `/admin/password-reset-requests/*` ở dưới: quản trị viên chỉ DUYỆT, còn mật khẩu mới
// do chính người dùng đặt. Đừng thêm lại đường tắt này: nó là cách thứ hai làm cùng một
// việc, và là cách duy nhất khiến quản trị viên biết mật khẩu của người dùng.

adminRoutes.delete(
  '/users/:id',
  asyncHandler(async (req, res) => {
    await adminService.deleteUser(parseId(req.params.id), currentUser(req).id);
    res.status(204).send();
  }),
);

// --- Lượt truy cập ---
adminRoutes.get(
  '/access/overview',
  asyncHandler(async (req, res) => {
    const days = Number(req.query.days ?? 30);
    if (!Number.isInteger(days) || days < 1 || days > 90) throw new BadRequestError('Số ngày phải từ 1 đến 90');
    res.json(await adminService.getAccessOverview(days));
  }),
);

adminRoutes.get(
  '/access/logs',
  validateQuery(accessLogQuerySchema),
  asyncHandler(async (req, res) => {
    res.json(await adminService.listLoginEvents(getValidatedQuery(req, accessLogQuerySchema)));
  }),
);

// --- Nhật ký thao tác ---
//
// CHỈ ĐỌC. Không có route sửa hay xoá nhật ký, kể cả cho quản trị viên: nhật ký mà người
// bị ghi tự xoá được thì không còn là nhật ký. Dòng mới do chính các service ghi, ngay
// trong thao tác của chúng (xem admin-audit.service).
adminRoutes.get(
  '/audit-logs',
  validateQuery(auditLogQuerySchema),
  asyncHandler(async (req, res) => {
    res.json(await adminAuditService.listAuditLogs(getValidatedQuery(req, auditLogQuerySchema)));
  }),
);

adminRoutes.get(
  '/audit-logs/actors',
  asyncHandler(async (_req, res) => {
    res.json(await adminAuditService.listAuditActors());
  }),
);

// --- Yêu cầu cấp lại mật khẩu (tái dùng password-reset.service của module auth) ---
//
// Toàn bộ nghiệp vụ nằm ở service bên auth, ở đây chỉ nối route. Hai nửa của cùng một
// luồng (người dùng gửi / quản trị viên duyệt) phải dùng chung một service, nếu không
// hai bên sẽ hiểu khác nhau về việc yêu cầu nào còn hiệu lực.
adminRoutes.get(
  '/password-reset-requests',
  validateQuery(resetRequestQuerySchema),
  asyncHandler(async (req, res) => {
    res.json(await passwordResetService.listRequests(getValidatedQuery(req, resetRequestQuerySchema)));
  }),
);

adminRoutes.post(
  '/password-reset-requests/:id/approve',
  asyncHandler(async (req, res) => {
    await passwordResetService.approveRequest(parseId(req.params.id), currentUser(req).id);
    res.status(204).send();
  }),
);

adminRoutes.post(
  '/password-reset-requests/:id/reject',
  validateBody(rejectResetRequestSchema),
  asyncHandler(async (req, res) => {
    await passwordResetService.rejectRequest(
      parseId(req.params.id),
      currentUser(req).id,
      req.body as RejectResetRequestInput,
    );
    res.status(204).send();
  }),
);

// --- Thông báo tới người dùng (tái dùng notification.service) ---
adminRoutes.get(
  '/announcements/audience',
  asyncHandler(async (req, res) => {
    const role = req.query.role === 'ADMIN' || req.query.role === 'USER' ? req.query.role : undefined;
    res.json({ count: await notificationService.countAudience(role) });
  }),
);

adminRoutes.post(
  '/announcements',
  validateBody(createAnnouncementSchema),
  asyncHandler(async (req, res) => {
    res.status(201).json(
      await notificationService.createAnnouncement(req.body as CreateAnnouncementInput, currentUser(req).id),
    );
  }),
);

// --- Nhóm lớp ---
//
// Quản trị viên KHÔNG tham gia nhóm: không đọc bài, không duyệt yêu cầu vào nhóm.
// Chỉ giám sát và xử lý vi phạm, nên chỉ có xem, cảnh báo và chặn/mở chặn.
adminRoutes.get(
  '/groups',
  validateQuery(adminGroupQuerySchema),
  asyncHandler(async (req, res) => {
    res.json(await adminGroupService.listGroups(getValidatedQuery(req, adminGroupQuerySchema)));
  }),
);

adminRoutes.get(
  '/groups/:id',
  asyncHandler(async (req, res) => {
    res.json(await adminGroupService.getGroupDetail(parseId(req.params.id)));
  }),
);

adminRoutes.post(
  '/groups/:id/warn',
  validateBody(warnGroupSchema),
  asyncHandler(async (req, res) => {
    const { message } = req.body as WarnGroupInput;
    res.json(await adminGroupService.warnGroup(parseId(req.params.id), message, currentUser(req).id));
  }),
);

adminRoutes.post(
  '/groups/:id/block',
  validateBody(blockGroupSchema),
  asyncHandler(async (req, res) => {
    const { reason } = req.body as BlockGroupInput;
    res.json(await adminGroupService.blockGroup(parseId(req.params.id), currentUser(req).id, reason));
  }),
);

adminRoutes.post(
  '/groups/:id/unblock',
  asyncHandler(async (req, res) => {
    res.json(await adminGroupService.unblockGroup(parseId(req.params.id), currentUser(req).id));
  }),
);

// --- Chủ đề (tái dùng topic.service) ---
adminRoutes.post(
  '/topics',
  validateBody(createTopicSchema),
  asyncHandler(async (req, res) => {
    res.status(201).json(await topicService.createTopic(req.body as CreateTopicInput, currentUser(req).id));
  }),
);

adminRoutes.patch(
  '/topics/:id',
  validateBody(updateTopicSchema),
  asyncHandler(async (req, res) => {
    res.json(await topicService.updateTopic(parseId(req.params.id), req.body as UpdateTopicInput, currentUser(req).id));
  }),
);

adminRoutes.delete(
  '/topics/:id',
  asyncHandler(async (req, res) => {
    await topicService.deleteTopic(parseId(req.params.id), currentUser(req).id);
    res.status(204).send();
  }),
);

// --- Từ vựng ---
adminRoutes.post(
  '/vocabulary',
  validateBody(createVocabularySchema),
  asyncHandler(async (req, res) => {
    res.status(201).json(await adminService.createVocabulary(req.body as CreateVocabularyInput, currentUser(req).id));
  }),
);

adminRoutes.patch(
  '/vocabulary/:id',
  validateBody(updateVocabularySchema),
  asyncHandler(async (req, res) => {
    res.json(
      await adminService.updateVocabulary(parseId(req.params.id), req.body as UpdateVocabularyInput, currentUser(req).id),
    );
  }),
);

adminRoutes.delete(
  '/vocabulary/:id',
  asyncHandler(async (req, res) => {
    await adminService.deleteVocabulary(parseId(req.params.id), currentUser(req).id);
    res.status(204).send();
  }),
);

// --- Kiểm duyệt bộ thẻ ---
//
// Như nhóm lớp: chỉ xem, bỏ qua báo cáo, chặn/mở chặn. Không có xoá bộ thẻ.
adminRoutes.get(
  '/study-set-reports',
  validateQuery(adminStudySetReportQuerySchema),
  asyncHandler(async (req, res) => {
    res.json(await adminStudySetService.listReports(getValidatedQuery(req, adminStudySetReportQuerySchema)));
  }),
);

adminRoutes.post(
  '/study-set-reports/:id/dismiss',
  asyncHandler(async (req, res) => {
    await adminStudySetService.dismissReport(parseId(req.params.id), currentUser(req).id);
    res.status(204).send();
  }),
);

adminRoutes.get(
  '/study-sets/:id',
  asyncHandler(async (req, res) => {
    res.json(await adminStudySetService.getStudySet(parseId(req.params.id)));
  }),
);

adminRoutes.post(
  '/study-sets/:id/block',
  validateBody(blockStudySetSchema),
  asyncHandler(async (req, res) => {
    const { reason } = req.body as BlockStudySetInput;
    res.json(await adminStudySetService.blockSet(parseId(req.params.id), currentUser(req).id, reason));
  }),
);

adminRoutes.post(
  '/study-sets/:id/unblock',
  asyncHandler(async (req, res) => {
    res.json(await adminStudySetService.unblockSet(parseId(req.params.id), currentUser(req).id));
  }),
);

// --- Quản lý tính năng ---
//
// Phần ĐỌC cho client nằm ở module features (GET /features). Phần ghi đặt ở đây vì mọi
// route /admin/* đã đi qua role-guard sẵn — không dựng thêm một lối vào có quyền quản
// trị ở module khác.
adminRoutes.get(
  '/features',
  asyncHandler(async (_req, res) => {
    res.json(await featureService.listForAdmin());
  }),
);

adminRoutes.patch(
  '/features/:key',
  validateBody(updateFeatureFlagSchema),
  asyncHandler(async (req, res) => {
    const parsed = featureKeyParamSchema.safeParse(req.params);
    // Khoá lạ là 404 chứ không 400: tính năng đó không tồn tại trong danh mục.
    if (!parsed.success) throw new NotFoundError('Không có tính năng này');

    const { isEnabled } = req.body as UpdateFeatureFlagInput;
    res.json(await featureService.setEnabled(parsed.data.key, isEnabled, currentUser(req).id));
  }),
);

// --- Cửa hàng vật phẩm ---
//
// Nhánh này KHÔNG chịu cờ tính năng SHOP: tắt cửa hàng phía người học không được làm
// quản trị viên mất chỗ soạn vật phẩm (cùng lý do với /topics). Cờ chỉ gắn ở /shop.
adminRoutes.get(
  '/shop/types',
  asyncHandler(async (_req, res) => {
    res.json(await adminShopService.listTypes());
  }),
);

adminRoutes.post(
  '/shop/types',
  validateBody(createShopTypeSchema),
  asyncHandler(async (req, res) => {
    res.status(201).json(await adminShopService.createType(req.body as CreateShopTypeInput, currentUser(req).id));
  }),
);

adminRoutes.patch(
  '/shop/types/:id',
  validateBody(updateShopTypeSchema),
  asyncHandler(async (req, res) => {
    res.json(
      await adminShopService.updateType(parseId(req.params.id), req.body as UpdateShopTypeInput, currentUser(req).id),
    );
  }),
);

adminRoutes.delete(
  '/shop/types/:id',
  asyncHandler(async (req, res) => {
    await adminShopService.deleteType(parseId(req.params.id), currentUser(req).id);
    res.status(204).send();
  }),
);

adminRoutes.get(
  '/shop/items',
  asyncHandler(async (req, res) => {
    const typeId = req.query.typeId ? parseId(String(req.query.typeId)) : undefined;
    res.json(await adminShopService.listItems(typeId));
  }),
);

adminRoutes.post(
  '/shop/items',
  validateBody(createShopItemSchema),
  asyncHandler(async (req, res) => {
    const item = await adminShopService.createItem(currentUser(req).id, req.body as CreateShopItemInput);
    res.status(201).json(item);
  }),
);

adminRoutes.patch(
  '/shop/items/:id',
  validateBody(updateShopItemSchema),
  asyncHandler(async (req, res) => {
    res.json(
      await adminShopService.updateItem(parseId(req.params.id), req.body as UpdateShopItemInput, currentUser(req).id),
    );
  }),
);

adminRoutes.delete(
  '/shop/items/:id',
  asyncHandler(async (req, res) => {
    await adminShopService.deleteItem(parseId(req.params.id), currentUser(req).id);
    res.status(204).send();
  }),
);

adminRoutes.delete(
  '/shop/items/:id/image',
  asyncHandler(async (req, res) => {
    res.json(await adminShopService.deleteItemImage(parseId(req.params.id), currentUser(req).id));
  }),
);

function parseId(value: string | undefined): number {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) throw new BadRequestError('ID không hợp lệ');
  return id;
}
