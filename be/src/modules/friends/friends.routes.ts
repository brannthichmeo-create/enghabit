import { Router } from 'express';
import { UserRole, friendSearchSchema } from '@enghabit/shared';
import { asyncHandler } from '../../common/middlewares/async-handler.js';
import { currentUser, requireAuth, requireRole } from '../../common/middlewares/auth-guard.js';
import { validateQuery } from '../../common/middlewares/validate.js';
import { getValidatedQuery } from '../../common/middlewares/validate.js';
import * as service from './friends.service.js';

export const friendsRoutes: Router = Router();
friendsRoutes.use(requireAuth, requireRole(UserRole.USER));

friendsRoutes.get('/', asyncHandler(async (req, res) => {
  res.json(await service.listFriends(currentUser(req).id, typeof req.query.search === 'string' ? req.query.search : ''));
}));
friendsRoutes.get('/search', validateQuery(friendSearchSchema), asyncHandler(async (req, res) => {
  const { publicId } = getValidatedQuery(req, friendSearchSchema);
  res.json(await service.searchPublicId(currentUser(req).id, publicId));
}));
friendsRoutes.get('/users/:publicId/profile', asyncHandler(async (req, res) => {
  res.json(await service.getProfile(currentUser(req).id, req.params.publicId ?? ''));
}));
friendsRoutes.post('/requests/:publicId', asyncHandler(async (req, res) => {
  res.status(201).json(await service.sendRequest(currentUser(req).id, req.params.publicId ?? ''));
}));
friendsRoutes.post('/requests/:id/accept', asyncHandler(async (req, res) => {
  await service.acceptRequest(currentUser(req).id, Number(req.params.id));
  res.status(204).send();
}));
friendsRoutes.delete('/requests/:id', asyncHandler(async (req, res) => {
  await service.removeRequest(currentUser(req).id, Number(req.params.id));
  res.status(204).send();
}));
friendsRoutes.delete('/:userId', asyncHandler(async (req, res) => {
  await service.removeFriend(currentUser(req).id, Number(req.params.userId));
  res.status(204).send();
}));
