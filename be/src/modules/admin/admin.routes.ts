import { Router } from 'express';
import {
  UserRole,
  accessLogQuerySchema,
  adminUserQuerySchema,
  createQuizQuestionSchema,
  createQuizSchema,
  createTopicSchema,
  createVocabularySchema,
  resetUserPasswordSchema,
  updateTopicSchema,
  updateUserRoleSchema,
  updateUserStatusSchema,
  updateVocabularySchema,
  type CreateQuizInput,
  type CreateQuizQuestionInput,
  type CreateTopicInput,
  type CreateVocabularyInput,
  type ResetUserPasswordInput,
  type UpdateTopicInput,
  type UpdateUserRoleInput,
  type UpdateUserStatusInput,
  type UpdateVocabularyInput,
} from '@enghabit/shared';
import { asyncHandler } from '../../common/middlewares/async-handler.js';
import { currentUser, requireAuth, requireRole } from '../../common/middlewares/auth-guard.js';
import { getValidatedQuery, validateBody, validateQuery } from '../../common/middlewares/validate.js';
import { BadRequestError } from '../../common/errors/app-error.js';
import * as topicService from '../topics/topic.service.js';
import * as adminService from './admin.service.js';

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

adminRoutes.post(
  '/users/:id/reset-password',
  validateBody(resetUserPasswordSchema),
  asyncHandler(async (req, res) => {
    const { newPassword } = req.body as ResetUserPasswordInput;
    await adminService.resetUserPassword(parseId(req.params.id), newPassword);
    res.status(204).send();
  }),
);

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
    res.json(await topicService.updateTopic(parseId(req.params.id), req.body as UpdateTopicInput));
  }),
);

adminRoutes.delete(
  '/topics/:id',
  asyncHandler(async (req, res) => {
    await topicService.deleteTopic(parseId(req.params.id));
    res.status(204).send();
  }),
);

// --- Từ vựng ---
adminRoutes.post(
  '/vocabulary',
  validateBody(createVocabularySchema),
  asyncHandler(async (req, res) => {
    res.status(201).json(await adminService.createVocabulary(req.body as CreateVocabularyInput));
  }),
);

adminRoutes.patch(
  '/vocabulary/:id',
  validateBody(updateVocabularySchema),
  asyncHandler(async (req, res) => {
    res.json(await adminService.updateVocabulary(parseId(req.params.id), req.body as UpdateVocabularyInput));
  }),
);

adminRoutes.delete(
  '/vocabulary/:id',
  asyncHandler(async (req, res) => {
    await adminService.deleteVocabulary(parseId(req.params.id));
    res.status(204).send();
  }),
);

// --- Quiz ---
adminRoutes.post(
  '/quizzes',
  validateBody(createQuizSchema),
  asyncHandler(async (req, res) => {
    res.status(201).json(await adminService.createQuiz(req.body as CreateQuizInput));
  }),
);

adminRoutes.post(
  '/quizzes/:id/questions',
  validateBody(createQuizQuestionSchema),
  asyncHandler(async (req, res) => {
    res
      .status(201)
      .json(await adminService.addQuizQuestion(parseId(req.params.id), req.body as CreateQuizQuestionInput));
  }),
);

adminRoutes.delete(
  '/questions/:id',
  asyncHandler(async (req, res) => {
    await adminService.deleteQuizQuestion(parseId(req.params.id));
    res.status(204).send();
  }),
);

function parseId(value: string | undefined): number {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) throw new BadRequestError('ID không hợp lệ');
  return id;
}
