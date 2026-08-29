import { Router } from 'express';
import {
  changePasswordSchema,
  loginSchema,
  registerSchema,
  updateProfileSchema,
} from '@enghabit/shared';
import { asyncHandler } from '../../common/middlewares/async-handler.js';
import { requireAuth } from '../../common/middlewares/auth-guard.js';
import { validateBody } from '../../common/middlewares/validate.js';
import * as controller from './auth.controller.js';

export const authRoutes: Router = Router();

authRoutes.post('/register', validateBody(registerSchema), asyncHandler(controller.register));
authRoutes.post('/login', validateBody(loginSchema), asyncHandler(controller.login));
authRoutes.post('/refresh', asyncHandler(controller.refresh));
authRoutes.post('/logout', asyncHandler(controller.logout));

authRoutes.get('/me', requireAuth, asyncHandler(controller.getMe));
authRoutes.patch('/me', requireAuth, validateBody(updateProfileSchema), asyncHandler(controller.updateMe));
authRoutes.post(
  '/me/change-password',
  requireAuth,
  validateBody(changePasswordSchema),
  asyncHandler(controller.changePassword),
);
