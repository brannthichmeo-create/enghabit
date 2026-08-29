import { PrismaClient } from '@prisma/client';
import { env, isProduction } from '../config/env.js';

/**
 * Prisma Client singleton.
 *
 * BẮT BUỘC dùng instance này ở mọi nơi — không `new PrismaClient()` ở file khác (xem CLAUDE.md).
 * Mỗi instance mở một connection pool riêng; khi tsx watch hot-reload sẽ tạo thêm instance mới
 * và làm cạn connection của MySQL, gây lỗi rất khó truy nguyên.
 */

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    // Dev bật query log để thấy SQL thật khi debug sai lệch số liệu thống kê.
    log: isProduction ? ['error', 'warn'] : ['query', 'error', 'warn'],
  });

if (!isProduction) {
  globalForPrisma.prisma = prisma;
}

export async function disconnectPrisma(): Promise<void> {
  await prisma.$disconnect();
}

/** Kiểm tra kết nối DB lúc khởi động — fail sớm còn hơn lỗi rải rác lúc chạy. */
export async function assertDatabaseConnection(): Promise<void> {
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (error) {
    throw new Error(
      `Không kết nối được MySQL. Kiểm tra DATABASE_URL trong be/.env (đang trỏ tới: ${maskUrl(env.DATABASE_URL)}). Lỗi gốc: ${String(error)}`,
    );
  }
}

/** Che mật khẩu trước khi đưa connection string vào log/thông báo lỗi. */
function maskUrl(url: string): string {
  return url.replace(/(mysql:\/\/[^:]+:)[^@]*(@)/, '$1***$2');
}
