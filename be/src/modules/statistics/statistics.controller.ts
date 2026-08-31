import type { Request, Response } from 'express';
import { calendarRangeSchema, statsRangeSchema } from '@enghabit/shared';
import { currentUser } from '../../common/middlewares/auth-guard.js';
import { getValidatedQuery } from '../../common/middlewares/validate.js';
import * as statisticsService from './statistics.service.js';

export async function summary(req: Request, res: Response): Promise<void> {
  const user = currentUser(req);
  const { range } = getValidatedQuery(req, statsRangeSchema);
  res.json(await statisticsService.getSummary(user.id, user.timezone, range));
}

export async function streak(req: Request, res: Response): Promise<void> {
  const user = currentUser(req);
  res.json(await statisticsService.getStreak(user.id, user.timezone));
}

export async function calendar(req: Request, res: Response): Promise<void> {
  const user = currentUser(req);
  const { months } = getValidatedQuery(req, calendarRangeSchema);
  res.json(await statisticsService.getActivityCalendar(user.id, user.timezone, months));
}

export async function level(req: Request, res: Response): Promise<void> {
  res.json(await statisticsService.getLevel(currentUser(req).id));
}
