import type { Request, Response } from 'express';
import type {
  ChangePasswordInput,
  LoginInput,
  RegisterInput,
  UpdateProfileInput,
} from '@enghabit/shared';
import { BadRequestError } from '../../common/errors/app-error.js';
import { currentUser } from '../../common/middlewares/auth-guard.js';
import * as authService from './auth.service.js';

/**
 * Controller chỉ nhận request / trả response.
 * Toàn bộ nghiệp vụ nằm ở service (xem CLAUDE.md > Quy tắc viết code).
 */

const REFRESH_COOKIE = 'refreshToken';

export async function register(req: Request, res: Response): Promise<void> {
  const result = await authService.register(req.body as RegisterInput);
  setRefreshCookie(res, result.refreshToken);
  res.status(201).json(result);
}

export async function login(req: Request, res: Response): Promise<void> {
  const result = await authService.login(req.body as LoginInput);
  setRefreshCookie(res, result.refreshToken);
  res.json(result);
}

export async function refresh(req: Request, res: Response): Promise<void> {
  // Web gửi qua cookie httpOnly; mobile không có cookie nên gửi trong body.
  const token = (req.cookies?.[REFRESH_COOKIE] as string | undefined) ?? (req.body?.refreshToken as string | undefined);
  if (!token) throw new BadRequestError('Thiếu refresh token');

  const result = await authService.refresh(token);
  setRefreshCookie(res, result.refreshToken);
  res.json(result);
}

export async function logout(req: Request, res: Response): Promise<void> {
  const token = (req.cookies?.[REFRESH_COOKIE] as string | undefined) ?? (req.body?.refreshToken as string | undefined);
  if (token) await authService.logout(token);

  res.clearCookie(REFRESH_COOKIE);
  res.status(204).send();
}

export async function getMe(req: Request, res: Response): Promise<void> {
  res.json(await authService.getProfile(currentUser(req).id));
}

export async function updateMe(req: Request, res: Response): Promise<void> {
  res.json(await authService.updateProfile(currentUser(req).id, req.body as UpdateProfileInput));
}

export async function changePassword(req: Request, res: Response): Promise<void> {
  await authService.changePassword(currentUser(req).id, req.body as ChangePasswordInput);
  res.status(204).send();
}

/** httpOnly để JavaScript phía client không đọc được, giảm rủi ro XSS đánh cắp token. */
function setRefreshCookie(res: Response, token: string): void {
  res.cookie(REFRESH_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000,
    path: '/api/v1/auth',
  });
}
