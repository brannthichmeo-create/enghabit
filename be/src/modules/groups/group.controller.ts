import type { Request, Response } from 'express';
import {
  GroupMemberRole,
  groupSearchSchema,
  type AddMemberInput,
  type CreateGroupInput,
  type JoinGroupInput,
  type UpdateGroupInput,
  type UpdateMemberRoleInput,
} from '@enghabit/shared';
import { currentUser } from '../../common/middlewares/auth-guard.js';
import { getValidatedQuery } from '../../common/middlewares/validate.js';
import { BadRequestError } from '../../common/errors/app-error.js';
import * as groupService from './group.service.js';

/** Controller chỉ nhận request / trả response — nghiệp vụ nằm ở service. */

export async function listMine(req: Request, res: Response): Promise<void> {
  res.json(await groupService.listMyGroups(currentUser(req).id));
}

export async function search(req: Request, res: Response): Promise<void> {
  res.json(
    await groupService.searchPublicGroups(currentUser(req).id, getValidatedQuery(req, groupSearchSchema)),
  );
}

export async function findByCode(req: Request, res: Response): Promise<void> {
  const code = req.params.code ?? '';
  if (!/^\d{8}$/.test(code)) throw new BadRequestError('Mã nhóm gồm đúng 8 chữ số');
  res.json(await groupService.findByCode(currentUser(req).id, code));
}

export async function detail(req: Request, res: Response): Promise<void> {
  res.json(await groupService.getGroupDetail(parseId(req.params.id), currentUser(req).id));
}

export async function create(req: Request, res: Response): Promise<void> {
  res.status(201).json(await groupService.createGroup(currentUser(req).id, req.body as CreateGroupInput));
}

export async function update(req: Request, res: Response): Promise<void> {
  res.json(
    await groupService.updateGroup(parseId(req.params.id), currentUser(req).id, req.body as UpdateGroupInput),
  );
}

export async function remove(req: Request, res: Response): Promise<void> {
  await groupService.deleteGroup(parseId(req.params.id), currentUser(req).id);
  res.status(204).send();
}

export async function join(req: Request, res: Response): Promise<void> {
  const { message } = (req.body ?? {}) as JoinGroupInput;
  res.json(await groupService.requestJoin(parseId(req.params.id), currentUser(req).id, message));
}

export async function leave(req: Request, res: Response): Promise<void> {
  await groupService.leaveGroup(parseId(req.params.id), currentUser(req).id);
  res.status(204).send();
}

export async function approve(req: Request, res: Response): Promise<void> {
  await groupService.decideRequest(
    parseId(req.params.id),
    parseId(req.params.userId),
    currentUser(req).id,
    true,
  );
  res.status(204).send();
}

export async function reject(req: Request, res: Response): Promise<void> {
  await groupService.decideRequest(
    parseId(req.params.id),
    parseId(req.params.userId),
    currentUser(req).id,
    false,
  );
  res.status(204).send();
}

export async function addMember(req: Request, res: Response): Promise<void> {
  res
    .status(201)
    .json(
      await groupService.addMember(parseId(req.params.id), currentUser(req).id, req.body as AddMemberInput),
    );
}

export async function updateRole(req: Request, res: Response): Promise<void> {
  const { role } = req.body as UpdateMemberRoleInput;
  await groupService.updateMemberRole(
    parseId(req.params.id),
    parseId(req.params.userId),
    currentUser(req).id,
    role as GroupMemberRole,
  );
  res.status(204).send();
}

export async function removeMember(req: Request, res: Response): Promise<void> {
  await groupService.removeMember(
    parseId(req.params.id),
    parseId(req.params.userId),
    currentUser(req).id,
  );
  res.status(204).send();
}

function parseId(value: string | undefined): number {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) throw new BadRequestError('ID không hợp lệ');
  return id;
}
