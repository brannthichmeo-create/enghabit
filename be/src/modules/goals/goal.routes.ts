import { Router } from 'express';
import { createGoalSchema, updateGoalSchema, type CreateGoalInput, type UpdateGoalInput } from '@enghabit/shared';
import { asyncHandler } from '../../common/middlewares/async-handler.js';
import { currentUser, requireAuth } from '../../common/middlewares/auth-guard.js';
import { validateBody } from '../../common/middlewares/validate.js';
import { BadRequestError } from '../../common/errors/app-error.js';
import * as goalService from './goal.service.js';

export const goalRoutes: Router = Router();

goalRoutes.use(requireAuth);

goalRoutes.get(
  '/',
  asyncHandler(async (req, res) => {
    res.json(await goalService.listGoals(currentUser(req).id));
  }),
);

goalRoutes.get(
  '/progress',
  asyncHandler(async (req, res) => {
    const user = currentUser(req);
    res.json(await goalService.getProgress(user.id, user.timezone));
  }),
);

goalRoutes.post(
  '/',
  validateBody(createGoalSchema),
  asyncHandler(async (req, res) => {
    res.status(201).json(await goalService.createGoal(currentUser(req).id, req.body as CreateGoalInput));
  }),
);

goalRoutes.patch(
  '/:id',
  validateBody(updateGoalSchema),
  asyncHandler(async (req, res) => {
    res.json(
      await goalService.updateGoal(currentUser(req).id, parseId(req.params.id), req.body as UpdateGoalInput),
    );
  }),
);

goalRoutes.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    await goalService.deleteGoal(currentUser(req).id, parseId(req.params.id));
    res.status(204).send();
  }),
);

function parseId(value: string | undefined): number {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) throw new BadRequestError('ID không hợp lệ');
  return id;
}
