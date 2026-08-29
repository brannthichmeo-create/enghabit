import 'dotenv/config';
import { z } from 'zod';

/**
 * Validate biến môi trường ngay khi khởi động.
 * Thiếu/sai biến sẽ làm app dừng với thông báo rõ ràng, thay vì lỗi khó hiểu lúc chạy.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),

  DATABASE_URL: z.string().min(1, 'Thiếu DATABASE_URL — xem be/.env.example'),

  CORS_ORIGIN: z.string().default('http://localhost:5173'),

  JWT_ACCESS_SECRET: z.string().min(16, 'JWT_ACCESS_SECRET phải dài ít nhất 16 ký tự'),
  JWT_REFRESH_SECRET: z.string().min(16, 'JWT_REFRESH_SECRET phải dài ít nhất 16 ký tự'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),

  ONESIGNAL_APP_ID: z.string().optional(),
  ONESIGNAL_API_KEY: z.string().optional(),

  ENABLE_REMINDER_JOB: z
    .enum(['true', 'false'])
    .default('true')
    .transform((v) => v === 'true'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`).join('\n');
  throw new Error(`Cấu hình môi trường không hợp lệ:\n${issues}`);
}

export const env = parsed.data;

export const isProduction = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';

/** Cảnh báo sớm về lỗi cấu hình DB hay gặp nhất (xem CLAUDE.md). */
if (!env.DATABASE_URL.includes('connection_limit')) {
  // eslint-disable-next-line no-console
  console.warn(
    '[cảnh báo] DATABASE_URL chưa có connection_limit. MySQL free tier dễ hết kết nối — xem be/.env.example',
  );
}
