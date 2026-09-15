import type { Request, Response } from 'express';
import {
  reviewHistoryQuerySchema,
  type FinishSessionInput,
  type StudyQuestionsInput,
  type SubmitAnswerInput,
} from '@enghabit/shared';
import { currentUser } from '../../common/middlewares/auth-guard.js';
import { getValidatedQuery } from '../../common/middlewares/validate.js';
import * as studyService from './study.service.js';

export async function questions(req: Request, res: Response): Promise<void> {
  const user = currentUser(req);
  res.json(await studyService.getQuestions(user.id, user.timezone, req.body as StudyQuestionsInput));
}

export async function answer(req: Request, res: Response): Promise<void> {
  const user = currentUser(req);
  res.json(await studyService.submitAnswer(user.id, user.timezone, req.body as SubmitAnswerInput));
}

export async function finish(req: Request, res: Response): Promise<void> {
  const user = currentUser(req);
  const { sessionKey } = req.body as FinishSessionInput;
  res.json(await studyService.finishSession(user.id, user.timezone, sessionKey));
}

export async function overview(req: Request, res: Response): Promise<void> {
  const user = currentUser(req);
  res.json(await studyService.getOverview(user.id, user.timezone));
}

export async function dueCount(req: Request, res: Response): Promise<void> {
  const user = currentUser(req);
  res.json({ count: await studyService.getDueCount(user.id, user.timezone) });
}

export async function stats(req: Request, res: Response): Promise<void> {
  const user = currentUser(req);
  res.json(await studyService.getStats(user.id, user.timezone));
}

export async function history(req: Request, res: Response): Promise<void> {
  res.json(await studyService.listHistory(currentUser(req).id, getValidatedQuery(req, reviewHistoryQuerySchema)));
}
