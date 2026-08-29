import type { RequestHandler } from 'express';
import { UserRole } from '@enghabit/shared';
import { ForbiddenError, UnauthorizedError } from '../errors/app-error.js';
import { verifyAccessToken } from '../../modules/auth/token.service.js';

/** Thông tin user gắn vào request sau khi xác thực. */
export interface AuthUser {
  id: number;
  role: UserRole;
  timezone: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

/** Bắt buộc đăng nhập. Gắn req.user cho các handler phía sau. */
export const requireAuth: RequestHandler = (req, _res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return next(new UnauthorizedError('Thiếu access token'));
  }

  try {
    const payload = verifyAccessToken(header.slice('Bearer '.length));
    req.user = { id: payload.sub, role: payload.role, timezone: payload.timezone };
    next();
  } catch {
    next(new UnauthorizedError('Access token không hợp lệ hoặc đã hết hạn'));
  }
};

/**
 * Chặn theo vai trò. Mọi route /admin/* bắt buộc dùng requireRole(UserRole.ADMIN)
 * ngay sau requireAuth (xem CLAUDE.md).
 */
export const requireRole =
  (...roles: UserRole[]): RequestHandler =>
  (req, _res, next) => {
    if (!req.user) return next(new UnauthorizedError());
    if (!roles.includes(req.user.role)) return next(new ForbiddenError());
    next();
  };

/** Lấy req.user trong controller, đảm bảo đã qua requireAuth. */
export function currentUser(req: Express.Request): AuthUser {
  if (!req.user) throw new UnauthorizedError();
  return req.user;
}
