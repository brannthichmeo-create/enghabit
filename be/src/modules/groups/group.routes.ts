import { Router } from 'express';
import {
  addMemberSchema,
  createGroupSchema,
  groupDocumentQuerySchema,
  groupSearchSchema,
  joinGroupSchema,
  rejectJoinRequestSchema,
  shareStudySetSchema,
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
// Yêu cầu vào nhóm của chính người gọi — tab "Chờ duyệt".
groupRoutes.get('/mine/requests', asyncHandler(controller.listMyRequests));
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
// Từ chối bắt buộc có lý do — người xin vào đọc nó ở tab "Chờ duyệt".
groupRoutes.post(
  '/:id/requests/:userId/reject',
  validateBody(rejectJoinRequestSchema),
  asyncHandler(controller.reject),
);

// --- Trưởng nhóm quản lý thành viên ---
groupRoutes.post('/:id/members', validateBody(addMemberSchema), asyncHandler(controller.addMember));
groupRoutes.patch(
  '/:id/members/:userId/role',
  validateBody(updateMemberRoleSchema),
  asyncHandler(controller.updateRole),
);
groupRoutes.delete('/:id/members/:userId', asyncHandler(controller.removeMember));

// --- Đề cập ---
// Danh sách người có thể nhắc bằng @. Chỉ thành viên gọi được, kiểm tra trong service.
groupRoutes.get('/:id/mentions', asyncHandler(controller.mentionTargets));

// --- Tài liệu nhóm ---
// Chỉ LIỆT KÊ. Tệp đi lên bằng bài đăng, tải về qua /community/attachments/:id — cả hai
// đã có sẵn ở module community, dựng thêm đường thứ hai là hai chỗ phải canh cùng một luật.
groupRoutes.get(
  '/:id/documents',
  validateQuery(groupDocumentQuerySchema),
  asyncHandler(controller.documents),
);

// --- Bộ thẻ chia sẻ trong nhóm ---
// Mọi thành viên xem được; chỉ trưởng nhóm thêm và gỡ (kiểm tra trong service).
groupRoutes.get('/:id/study-sets', asyncHandler(controller.studySets));
groupRoutes.post(
  '/:id/study-sets',
  validateBody(shareStudySetSchema),
  asyncHandler(controller.shareStudySet),
);
groupRoutes.delete('/:id/study-sets/:setId', asyncHandler(controller.unshareStudySet));
