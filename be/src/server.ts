import { createApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './lib/logger.js';
import { assertDatabaseConnection, disconnectPrisma } from './lib/prisma.js';
import { startReminderJob } from './jobs/reminder.job.js';
import { startStreakFreezeJob } from './jobs/streak-freeze.job.js';

async function main(): Promise<void> {
  // Kiểm tra DB trước khi mở cổng — fail sớm với thông báo rõ ràng.
  await assertDatabaseConnection();
  logger.info('Kết nối MySQL thành công');

  const app = createApp();
  const server = app.listen(env.PORT, () => {
    logger.info(`API đang chạy tại http://localhost:${env.PORT} (${env.NODE_ENV})`);
  });

  if (env.ENABLE_REMINDER_JOB) startReminderJob();

  // Đi chung công tắc với job nhắc nhở: cả hai đều là cron nền, môi trường nào tắt
  // cron thì phải tắt cả hai, nếu không sẽ có nơi chạy nửa vời.
  if (env.ENABLE_REMINDER_JOB) startStreakFreezeJob();

  const shutdown = (signal: string): void => {
    logger.info({ signal }, 'Đang tắt server...');
    server.close(() => {
      void disconnectPrisma().then(() => process.exit(0));
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch((error: unknown) => {
  logger.error({ err: error }, 'Không khởi động được server');
  process.exit(1);
});
