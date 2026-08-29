/**
 * Lớp lỗi nghiệp vụ dùng chung.
 *
 * Service ném AppError; error-handler middleware map sang HTTP response.
 * Không ném Error thô hay tự res.status() trong service — để một chỗ duy nhất quyết định format lỗi.
 */
export class AppError extends Error {
  constructor(
    readonly statusCode: number,
    message: string,
    /** Mã lỗi ổn định để client xử lý theo (không phụ thuộc câu chữ tiếng Việt). */
    readonly code: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'Dữ liệu không hợp lệ', details?: unknown) {
    super(400, message, 'BAD_REQUEST', details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Chưa đăng nhập hoặc phiên đã hết hạn') {
    super(401, message, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Không có quyền thực hiện thao tác này') {
    super(403, message, 'FORBIDDEN');
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Không tìm thấy dữ liệu') {
    super(404, message, 'NOT_FOUND');
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Dữ liệu đã tồn tại') {
    super(409, message, 'CONFLICT');
  }
}
