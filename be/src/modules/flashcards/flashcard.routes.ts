import { Router } from 'express';
import { learnVocabularySchema, reviewFlashcardSchema } from '@enghabit/shared';
import { asyncHandler } from '../../common/middlewares/async-handler.js';
import { requireAuth } from '../../common/middlewares/auth-guard.js';
import { validateBody } from '../../common/middlewares/validate.js';
import * as controller from './flashcard.controller.js';

export const flashcardRoutes: Router = Router();

flashcardRoutes.use(requireAuth);

flashcardRoutes.get('/due', asyncHandler(controller.due));
flashcardRoutes.get('/due/count', asyncHandler(controller.dueCount));
flashcardRoutes.post('/review', validateBody(reviewFlashcardSchema), asyncHandler(controller.review));
flashcardRoutes.post('/learn', validateBody(learnVocabularySchema), asyncHandler(controller.learn));
