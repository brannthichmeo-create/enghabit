import type { Request, Response } from 'express';
import type {
  ChangePasswordInput,
  LoginInput,
  RegisterInput,
  UpdateAvatarInput,
  UpdateProfileInput,
} from '@enghabit/shared';
import { BadRequestError } from '../../common/errors/app-error.js';
import { currentUser } from '../../common/middlewares/auth-guard.js';
import { isProduction } from '../../config/env.js';
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
  const result = await authService.login(req.body as LoginInput, {
    // req.ip đã tính sẵn theo X-Forwarded-For nhờ `trust proxy` đặt trong app.ts
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
  });
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

  // Phải khớp thuộc tính lúc đặt, nếu không trình duyệt sẽ không xoá đúng cookie đó
  res.clearCookie(REFRESH_COOKIE, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    path: '/api/v1/auth',
  });
  res.status(204).send();
}

export async function getMe(req: Request, res: Response): Promise<void> {
  res.json(await authService.getProfile(currentUser(req).id));
}

export async function updateMe(req: Request, res: Response): Promise<void> {
  res.json(await authService.updateProfile(currentUser(req).id, req.body as UpdateProfileInput));
}

export async function updateAvatar(req: Request, res: Response): Promise<void> {
  const { dataUrl } = req.body as UpdateAvatarInput;
  res.json(await authService.setAvatar(currentUser(req).id, dataUrl));
}

export async function removeAvatar(req: Request, res: Response): Promise<void> {
  res.json(await authService.removeAvatar(currentUser(req).id));
}

export async function changePassword(req: Request, res: Response): Promise<void> {
  await authService.changePassword(currentUser(req).id, req.body as ChangePasswordInput);
  res.status(204).send();
}

/**
 * httpOnly để JavaScript phía client không đọc được, giảm rủi ro XSS đánh cắp token.
 *
 * Khi deploy, frontend (vercel.app) và backend (onrender.com) nằm ở hai tên miền
 * khác nhau nên cookie là cross-site. Trình duyệt CHỈ gửi cookie cross-site khi có
 * `SameSite=None` kèm `Secure` — để `lax` như môi trường dev thì cookie bị chặn
 * âm thầm và tính năng tự gia hạn phiên đăng nhập sẽ hỏng mà không báo lỗi gì.
 */
function setRefreshCookie(res: Response, token: string): void {
  res.cookie(REFRESH_COOKIE, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000,
    path: '/api/v1/auth',
  });
}
