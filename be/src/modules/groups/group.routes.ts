import { Router } from 'express';
import {
  addMemberSchema,
  createGroupSchema,
  groupSearchSchema,
  joinGroupSchema,
  updateGroupSchema,
  updateMemberRoleSchema,
} from '@enghabit/shared';
import { asyncHandler } from '../../common/middlewares/async-handler.js';
import { requireAuth } from '../../common/middlewares/auth-guard.js';
import { validateBody, validateQuery } from '../../common/middlewares/validate.js';
import * as controller from './group.controller.js';

export const groupRoutes: Router = Router();

/**
 * Nhóm lớp — MỌI người dùng đều tạo và tham gia được, không phân biệt vai trò.
 *
 * Cố ý không có `requireRole`: quyền ở đây không theo vai trò hệ thống mà theo vai trò
 * TRONG TỪNG NHÓM (trưởng nhóm / thành viên), kiểm tra bên trong service ở từng thao tác.
 */
groupRoutes.use(requireAuth);

// Đặt TRƯỚC '/:id' — nếu không, "mine" và "search" sẽ bị coi là id nhóm và trả lỗi ID không hợp lệ.
groupRoutes.get('/mine', asyncHandler(controller.listMine));
groupRoutes.get('/search', validateQuery(groupSearchSchema), asyncHandler(controller.search));
groupRoutes.get('/code/:code', asyncHandler(controller.findByCode));

groupRoutes.post('/', validateBody(createGroupSchema), asyncHandler(controller.create));
groupRoutes.get('/:id', asyncHandler(controller.detail));
groupRoutes.patch('/:id', validateBody(updateGroupSchema), asyncHandler(controller.update));
groupRoutes.delete('/:id', asyncHandler(controller.remove));

// --- Tham gia ---
groupRoutes.post('/:id/join', validateBody(joinGroupSchema), asyncHandler(controller.join));
groupRoutes.post('/:id/leave', asyncHandler(controller.leave));

// --- Trưởng nhóm duyệt yêu cầu ---
groupRoutes.post('/:id/requests/:userId/approve', asyncHandler(controller.approve));
groupRoutes.post('/:id/requests/:userId/reject', asyncHandler(controller.reject));

// --- Trưởng nhóm quản lý thành viên ---
groupRoutes.post('/:id/members', validateBody(addMemberSchema), asyncHandler(controller.addMember));
groupRoutes.patch(
  '/:id/members/:userId/role',
  validateBody(updateMemberRoleSchema),
  asyncHandler(controller.updateRole),
);
groupRoutes.delete('/:id/members/:userId', asyncHandler(controller.removeMember));
