import { Router } from 'express';
import {
  registerDeviceSchema,
  updateNotificationSettingSchema,
  type RegisterDeviceInput,
  type UpdateNotificationSettingInput,
} from '@enghabit/shared';
import { asyncHandler } from '../../common/middlewares/async-handler.js';
import { currentUser, requireAuth } from '../../common/middlewares/auth-guard.js';
import { validateBody } from '../../common/middlewares/validate.js';
import * as notificationService from './notification.service.js';

export const notificationRoutes: Router = Router();

notificationRoutes.use(requireAuth);

notificationRoutes.get(
  '/settings',
  asyncHandler(async (req, res) => {
    res.json(await notificationService.getSetting(currentUser(req).id));
  }),
);

notificationRoutes.put(
  '/settings',
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
