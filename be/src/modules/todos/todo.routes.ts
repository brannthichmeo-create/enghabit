import { Router } from 'express';
import { UserRole, createTodoSchema, todoQuerySchema, updateTodoSchema } from '@enghabit/shared';
import { asyncHandler } from '../../common/middlewares/async-handler.js';
import { requireAuth, requireRole } from '../../common/middlewares/auth-guard.js';
import { validateBody, validateQuery } from '../../common/middlewares/validate.js';
import * as controller from './todo.controller.js';

export const todoRoutes: Router = Router();

// Chỉ người học, như mọi module học tập khác: quản trị viên vận hành hệ thống chứ không
// có việc cần làm trong ngày (xem CLAUDE.md > Chức năng cho quản trị viên).
todoRoutes.use(requireAuth, requireRole(UserRole.USER));

todoRoutes.get('/', validateQuery(todoQuerySchema), asyncHandler(controller.list));
todoRoutes.post('/', validateBody(createTodoSchema), asyncHandler(controller.create));

// Dọn các việc đã xong của một ngày. BẮT BUỘC khai TRƯỚC `/:id`: Express khớp theo thứ
// tự khai báo, đặt sau thì `DELETE /todos/done` rơi vào nhánh `/:id` với id = "done" và
// người dùng nhận lỗi "ID không hợp lệ" cho một nút hoàn toàn hợp lệ.
todoRoutes.delete('/done', validateQuery(todoQuerySchema), asyncHandler(controller.clearDone));

todoRoutes.patch('/:id', validateBody(updateTodoSchema), asyncHandler(controller.update));
todoRoutes.delete('/:id', asyncHandler(controller.remove));
