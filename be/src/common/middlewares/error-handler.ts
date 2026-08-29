import { Prisma } from '@prisma/client';
import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError } from 'zod';
import { isProduction } from '../../config/env.js';
import { AppError } from '../errors/app-error.js';

export interface ErrorResponseBody {
  error: {
    code: string;
    message: string;
    details?: unknown;
    requestId?: string;
  };
}

/** Bắt route không tồn tại — đặt sau tất cả route. */
export const notFoundHandler: RequestHandler = (req, res) => {
  res.status(404).json({
    error: { code: 'NOT_FOUND', message: `Không tìm thấy đường dẫn ${req.method} ${req.originalUrl}` },
  } satisfies ErrorResponseBody);
};

/**
 * Nơi DUY NHẤT chuyển lỗi thành HTTP response.
 * Service chỉ việc ném AppError, controller không cần try/catch để trả lỗi.
 */
export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  const requestId = req.id === undefined ? undefined : String(req.id);

  // Lỗi validate từ Zod → 400 kèm chi tiết từng field để FE hiển thị đúng chỗ.
  if (err instanceof ZodError) {
    req.log?.warn({ err: err.issues }, 'Dữ liệu đầu vào không hợp lệ');
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Dữ liệu không hợp lệ',
        details: err.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
        requestId,
      },
    } satisfies ErrorResponseBody);
    return;
  }

  if (err instanceof AppError) {
    req.log?.warn({ code: err.code, statusCode: err.statusCode }, err.message);
    res.status(err.statusCode).json({
      error: { code: err.code, message: err.message, details: err.details, requestId },
    } satisfies ErrorResponseBody);
    return;
  }

  // Lỗi Prisma thường gặp — dịch sang thông báo hiểu được thay vì trả 500 khó đoán.
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    const mapped = mapPrismaError(err);
    if (mapped) {
      req.log?.warn({ prismaCode: err.code }, mapped.message);
      res.status(mapped.statusCode).json({
        error: { code: mapped.code, message: mapped.message, requestId },
      } satisfies ErrorResponseBody);
      return;
    }
  }

  req.log?.error({ err }, 'Lỗi không xác định');
  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Có lỗi xảy ra ở máy chủ',
      // Dev mới lộ stack; production giấu đi để không rò rỉ cấu trúc hệ thống.
      details: isProduction ? undefined : { message: String(err), stack: (err as Error)?.stack },
      requestId,
    },
  } satisfies ErrorResponseBody);
};

function mapPrismaError(
  err: Prisma.PrismaClientKnownRequestError,
): { statusCode: number; code: string; message: string } | null {
  switch (err.code) {
    case 'P2002':
      return { statusCode: 409, code: 'CONFLICT', message: 'Dữ liệu đã tồn tại' };
    case 'P2025':
      return { statusCode: 404, code: 'NOT_FOUND', message: 'Không tìm thấy dữ liệu' };
    case 'P2003':
      return { statusCode: 400, code: 'BAD_REQUEST', message: 'Dữ liệu liên kết không hợp lệ' };
    default:
      return null;
  }
}
