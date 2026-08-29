import type { NextFunction, Request, RequestHandler, Response } from 'express';

/**
 * Bọc controller async để lỗi tự chuyển tới error-handler.
 *
 * Express 4 không tự bắt promise rejection — thiếu wrapper này thì lỗi trong controller
 * sẽ thành unhandled rejection và request treo không có phản hồi.
 */
export function asyncHandler(
  handler: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
): RequestHandler {
  return (req, res, next) => {
    handler(req, res, next).catch(next);
  };
}
