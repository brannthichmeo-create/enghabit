import type { Request, Response } from 'express';
import {
  calendarDetailQuerySchema,
  calendarQuerySchema,
  type CreateCalendarInput,
  type UpdateCalendarInput,
  type DeleteCalendarInput,
} from '@enghabit/shared';
import { currentUser } from '../../common/middlewares/auth-guard.js';
import { getValidatedQuery } from '../../common/middlewares/validate.js';
import { BadRequestError } from '../../common/errors/app-error.js';
import * as service from './calendar.service.js';

export async function list(req: Request, res: Response): Promise<void> {
  const user = currentUser(req);
  const query = getValidatedQuery(req, calendarQuerySchema);
  res.json(await service.listCalendars(user.id, user.timezone, query));
}

export async function create(req: Request, res: Response): Promise<void> {
  const user = currentUser(req);
  res.status(201).json(await service.createCalendar(user.id, req.body as CreateCalendarInput));
}

export async function detail(req: Request, res: Response): Promise<void> {
  const user = currentUser(req);
  const query = getValidatedQuery(req, calendarDetailQuerySchema);
  res.json(await service.getCalendar(user.id, user.timezone, parseId(req.params.id), query));
}

export async function update(req: Request, res: Response): Promise<void> {
  const user = currentUser(req);
  res.json(await service.updateCalendar(user.id, user.timezone, parseId(req.params.id), req.body as UpdateCalendarInput));
}

export async function remove(req: Request, res: Response): Promise<void> {
  const user = currentUser(req);
  await service.deleteCalendar(user.id, user.timezone, parseId(req.params.id), req.body as DeleteCalendarInput);
  res.status(204).send();
}

function parseId(value: string | undefined): number {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) throw new BadRequestError('ID không hợp lệ');
  return id;
}
