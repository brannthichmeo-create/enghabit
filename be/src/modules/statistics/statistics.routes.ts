import { Router } from 'express';
import { statsRangeSchema } from '@enghabit/shared';
import { asyncHandler } from '../../common/middlewares/async-handler.js';
import { requireAuth } from '../../common/middlewares/auth-guard.js';
import { validateQuery } from '../../common/middlewares/validate.js';
import * as controller from './statistics.controller.js';

export const statisticsRoutes: Router = Router();

statisticsRoutes.use(requireAuth);

statisticsRoutes.get('/summary', validateQuery(statsRangeSchema), asyncHandler(controller.summary));
statisticsRoutes.get('/streak', asyncHandler(controller.streak));
