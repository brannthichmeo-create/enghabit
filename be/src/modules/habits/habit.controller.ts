import type { Request, Response } from 'express';
import type { CheckInHabitInput, CreateHabitInput, UpdateHabitInput } from '@enghabit/shared';
import { BadRequestError } from '../../common/errors/app-error.js';
import { currentUser } from '../../common/middlewares/auth-guard.js';
import * as habitService from './habit.service.js';

export async function list(req: Request, res: Response): Promise<void> {
  const user = currentUser(req);
  res.json(await habitService.listHabits(user.id, user.timezone));
}

export async function create(req: Request, res: Response): Promise<void> {
  const habit = await habitService.createHabit(currentUser(req).id, req.body as CreateHabitInput);
  res.status(201).json(habit);
}

export async function update(req: Request, res: Response): Promise<void> {
  const habit = await habitService.updateHabit(
    currentUser(req).id,
    parseId(req.params.id),
    req.body as UpdateHabitInput,
  );
  res.json(habit);
}

export async function remove(req: Request, res: Response): Promise<void> {
  await habitService.deleteHabit(currentUser(req).id, parseId(req.params.id));
  res.status(204).send();
}

export async function checkIn(req: Request, res: Response): Promise<void> {
  const user = currentUser(req);
  const result = await habitService.checkIn(
    user.id,
    parseId(req.params.id),
    user.timezone,
    req.body as CheckInHabitInput,
  );
  res.status(201).json(result);
}

export async function listCheckIns(req: Request, res: Response): Promise<void> {
  const { from, to } = req.query as { from?: string; to?: string };
  res.json(await habitService.listCheckIns(currentUser(req).id, parseId(req.params.id), from, to));
}

export async function completionRate(req: Request, res: Response): Promise<void> {
  const { from, to } = req.query as { from?: string; to?: string };
  if (!from || !to) throw new BadRequestError('Cần truyền cả from và to (YYYY-MM-DD)');

  res.json(await habitService.getCompletionRate(currentUser(req).id, parseId(req.params.id), from, to));
}

function parseId(value: string | undefined): number {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) throw new BadRequestError('ID không hợp lệ');
  return id;
}
