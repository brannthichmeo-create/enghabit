import type { Request, Response } from 'express';
import type { LearnVocabularyInput, ReviewFlashcardInput } from '@enghabit/shared';
import { currentUser } from '../../common/middlewares/auth-guard.js';
import * as flashcardService from './flashcard.service.js';

export async function due(req: Request, res: Response): Promise<void> {
  const user = currentUser(req);
  res.json(await flashcardService.getDueCards(user.id, user.timezone));
}

export async function dueCount(req: Request, res: Response): Promise<void> {
  const user = currentUser(req);
  res.json({ count: await flashcardService.countDueCards(user.id, user.timezone) });
}

export async function review(req: Request, res: Response): Promise<void> {
  const user = currentUser(req);
  res.json(await flashcardService.submitReview(user.id, user.timezone, req.body as ReviewFlashcardInput));
}

export async function learn(req: Request, res: Response): Promise<void> {
  const user = currentUser(req);
  const { vocabularyId } = req.body as LearnVocabularyInput;
  res.status(201).json(await flashcardService.learnVocabulary(user.id, user.timezone, vocabularyId));
}
