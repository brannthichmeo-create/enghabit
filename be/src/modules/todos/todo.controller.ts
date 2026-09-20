import type { Request, Response } from 'express';
import { todoQuerySchema, type CreateTodoInput, type UpdateTodoInput } from '@enghabit/shared';
import { BadRequestError } from '../../common/errors/app-error.js';
import { currentUser } from '../../common/middlewares/auth-guard.js';
import { getValidatedQuery } from '../../common/middlewares/validate.js';
import * as todoService from './todo.service.js';

export async function list(req: Request, res: Response): Promise<void> {
  const user = currentUser(req);
  const { date } = getValidatedQuery(req, todoQuerySchema);
  res.json(await todoService.listTodos(user.id, user.timezone, date));
}

export async function create(req: Request, res: Response): Promise<void> {
  const user = currentUser(req);
  const todo = await todoService.createTodo(user.id, user.timezone, req.body as CreateTodoInput);
  res.status(201).json(todo);
}

export async function update(req: Request, res: Response): Promise<void> {
  const todo = await todoService.updateTodo(
    currentUser(req).id,
    parseId(req.params.id),
    req.body as UpdateTodoInput,
  );
  res.json(todo);
}

export async function remove(req: Request, res: Response): Promise<void> {
  await todoService.deleteTodo(currentUser(req).id, parseId(req.params.id));
  res.status(204).send();
}

export async function clearDone(req: Request, res: Response): Promise<void> {
  const user = currentUser(req);
  const { date } = getValidatedQuery(req, todoQuerySchema);
  res.json(await todoService.clearDoneTodos(user.id, user.timezone, date));
}

function parseId(value: string | undefined): number {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) throw new BadRequestError('ID không hợp lệ');
  return id;
}
