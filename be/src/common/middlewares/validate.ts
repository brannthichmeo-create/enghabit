import type { RequestHandler } from 'express';
import type { ZodTypeAny, z } from 'zod';

/**
 * Middleware validate bằng Zod schema (lấy từ @enghabit/shared để FE/BE dùng chung rule).
 * Dữ liệu đã parse được gán ngược lại vào req nên controller luôn nhận giá trị đã chuẩn hoá.
 */

export const validateBody =
  <T extends ZodTypeAny>(schema: T): RequestHandler =>
  (req, _res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) return next(result.error);
    req.body = result.data;
    next();
  };

export const validateQuery =
  <T extends ZodTypeAny>(schema: T): RequestHandler =>
  (req, _res, next) => {
    const result = schema.safeParse(req.query);
    if (!result.success) return next(result.error);
    // req.query là getter ở Express 5; gán qua Object.defineProperty cho an toàn với cả 4 và 5.
    Object.defineProperty(req, 'validatedQuery', { value: result.data, writable: false });
    next();
  };

export const validateParams =
  <T extends ZodTypeAny>(schema: T): RequestHandler =>
  (req, _res, next) => {
    const result = schema.safeParse(req.params);
    if (!result.success) return next(result.error);
    Object.defineProperty(req, 'validatedParams', { value: result.data, writable: false });
    next();
  };

/** Lấy query đã validate với đúng kiểu. Dùng trong controller sau validateQuery. */
export function getValidatedQuery<T extends ZodTypeAny>(req: unknown, _schema: T): z.infer<T> {
  return (req as { validatedQuery: z.infer<T> }).validatedQuery;
}

export function getValidatedParams<T extends ZodTypeAny>(req: unknown, _schema: T): z.infer<T> {
  return (req as { validatedParams: z.infer<T> }).validatedParams;
}
