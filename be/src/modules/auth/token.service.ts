import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import type { UserRole } from '@enghabit/shared';
import { env } from '../../config/env.js';
import { prisma } from '../../lib/prisma.js';

/**
 * Sinh/kiểm tra JWT và quản lý refresh token.
 *
 * Refresh token lưu trong DB dưới dạng hash — nếu DB bị lộ thì token cũng không dùng lại được.
 */

export interface AccessTokenPayload {
  sub: number;
  role: UserRole;
  timezone: string;
}

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN,
  } as jwt.SignOptions);
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as unknown as AccessTokenPayload;
}

/** Refresh token là chuỗi ngẫu nhiên, không phải JWT — để có thể thu hồi từng token một. */
export function generateRefreshToken(): string {
  return crypto.randomBytes(48).toString('hex');
}

export function hashRefreshToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export async function issueRefreshToken(userId: number): Promise<string> {
  const token = generateRefreshToken();
  await prisma.refreshToken.create({
    data: {
      userId,
      tokenHash: hashRefreshToken(token),
      expiresAt: new Date(Date.now() + parseDuration(env.JWT_REFRESH_EXPIRES_IN)),
    },
  });
  return token;
}

/** Thu hồi token cũ và cấp token mới (rotation) — hạn chế thiệt hại nếu token bị đánh cắp. */
export async function rotateRefreshToken(oldToken: string): Promise<{ userId: number; token: string } | null> {
  const record = await prisma.refreshToken.findUnique({ where: { tokenHash: hashRefreshToken(oldToken) } });

  if (!record || record.revokedAt !== null || record.expiresAt < new Date()) return null;

  await prisma.refreshToken.update({ where: { id: record.id }, data: { revokedAt: new Date() } });
  const token = await issueRefreshToken(record.userId);
  return { userId: record.userId, token };
}

export async function revokeRefreshToken(token: string): Promise<void> {
  await prisma.refreshToken.updateMany({
    where: { tokenHash: hashRefreshToken(token), revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

/** Đổi chuỗi kiểu "15m", "30d", "12h" sang milliseconds. */
function parseDuration(value: string): number {
  const match = /^(\d+)([smhd])$/.exec(value);
  if (!match) throw new Error(`Định dạng thời hạn token không hợp lệ: ${value}`);

  const amount = Number(match[1]);
  const unit = match[2] as 's' | 'm' | 'h' | 'd';
  const multipliers = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 } as const;
  return amount * multipliers[unit];
}
