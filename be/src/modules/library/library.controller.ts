import type { Request, Response } from 'express';
import {
  studySetSearchSchema,
  type CreateStudySetInput,
  type ImportStudySetCardsInput,
  type ReportStudySetInput,
  type StudySetCardInput,
  type UpdateStudySetCardInput,
  type UpdateStudySetInput,
} from '@enghabit/shared';
import { currentUser } from '../../common/middlewares/auth-guard.js';
import { getValidatedQuery } from '../../common/middlewares/validate.js';
import { BadRequestError } from '../../common/errors/app-error.js';
import * as libraryService from './library.service.js';

function parseId(value: string | undefined): number {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) throw new BadRequestError('ID không hợp lệ');
  return id;
}

export async function search(req: Request, res: Response): Promise<void> {
  res.json(await libraryService.searchPublicSets(currentUser(req).id, getValidatedQuery(req, studySetSearchSchema)));
}

export async function mine(req: Request, res: Response): Promise<void> {
  res.json(await libraryService.listMySets(currentUser(req).id));
}

export async function detail(req: Request, res: Response): Promise<void> {
  const user = currentUser(req);
  res.json(await libraryService.getSetDetail(user.id, user.timezone, parseId(req.params.id)));
}

export async function create(req: Request, res: Response): Promise<void> {
  res.status(201).json(await libraryService.createSet(currentUser(req).id, req.body as CreateStudySetInput));
}

export async function update(req: Request, res: Response): Promise<void> {
  res.json(
    await libraryService.updateSet(currentUser(req).id, parseId(req.params.id), req.body as UpdateStudySetInput),
  );
}

export async function remove(req: Request, res: Response): Promise<void> {
  await libraryService.deleteSet(currentUser(req).id, parseId(req.params.id));
  res.status(204).send();
}

export async function addCard(req: Request, res: Response): Promise<void> {
  res
    .status(201)
    .json(await libraryService.addCard(currentUser(req).id, parseId(req.params.id), req.body as StudySetCardInput));
}

export async function importCards(req: Request, res: Response): Promise<void> {
  res
    .status(201)
    .json(
      await libraryService.importCards(currentUser(req).id, parseId(req.params.id), req.body as ImportStudySetCardsInput),
    );
}

export async function updateCard(req: Request, res: Response): Promise<void> {
  res.json(
    await libraryService.updateCard(currentUser(req).id, parseId(req.params.id), req.body as UpdateStudySetCardInput),
  );
}

export async function removeCard(req: Request, res: Response): Promise<void> {
  await libraryService.deleteCard(currentUser(req).id, parseId(req.params.id));
  res.status(204).send();
}

export async function report(req: Request, res: Response): Promise<void> {
  await libraryService.reportSet(currentUser(req).id, parseId(req.params.id), req.body as ReportStudySetInput);
  res.status(201).send();
}
