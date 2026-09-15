import { Prisma } from '@prisma/client';

/**
 * Lỗi vi phạm ràng buộc unique (P2002).
 *
 * Dùng khi ràng buộc DB là thứ chặn ghi trùng — hai request cùng lúc đều đọc thấy
 * "chưa có" nên kiểm tra đọc-rồi-ghi không chặn được, chỉ DB chặn được.
 */
export function isUniqueViolation(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
}
