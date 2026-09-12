import crypto from 'node:crypto';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { type Express } from 'express';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { env } from './config/env.js';
import { logger } from './lib/logger.js';
import { errorHandler, notFoundHandler } from './common/middlewares/error-handler.js';
import { authRoutes } from './modules/auth/auth.routes.js';
import { goalRoutes } from './modules/goals/goal.routes.js';
import { habitRoutes } from './modules/habits/habit.routes.js';
import { topicRoutes } from './modules/topics/topic.routes.js';
import { flashcardRoutes } from './modules/flashcards/flashcard.routes.js';
import { lessonRoutes } from './modules/lessons/lesson.routes.js';
import { statisticsRoutes } from './modules/statistics/statistics.routes.js';
import { notificationRoutes } from './modules/notifications/notification.routes.js';
import { rewardsRoutes } from './modules/rewards/rewards.routes.js';
import { leaderboardRoutes } from './modules/leaderboard/leaderboard.routes.js';
import { adminRoutes } from './modules/admin/admin.routes.js';
import { groupRoutes } from './modules/groups/group.routes.js';
import { communityRoutes } from './modules/community/community.routes.js';

export function createApp(): Express {
  const app = express();

  // Render/Railway đứng sau proxy. Không bật cái này thì Express coi kết nối là
  // http và sẽ từ chối đặt cookie `Secure`, khiến đăng nhập hỏng khi deploy.
  app.set('trust proxy', 1);

  app.use(helmet());
  app.use(cors({ origin: env.CORS_ORIGIN.split(','), credentials: true }));

  /*
    Đăng bài ở diễn đàn có thể kèm tối đa 3 tệp × 900KB, mà base64 làm phình thêm
    ~33%, nên riêng nhánh này cần trần rộng hơn (3 × 900KB × 1,34 ≈ 3,6MB).

    Phải khai báo TRƯỚC parser toàn cục: express.json bỏ qua request đã được parse, nên
    cái đứng trước thắng. Đặt sau thì parser 1mb chạy trước và trả 413 cho mọi bài có
    tệp — mà lỗi đó lại không nói gì về nguyên nhân thật.

    Giữ trần chung ở 1mb thay vì nới hết: mọi endpoint còn lại chỉ nhận JSON nhỏ, không
    có lý do gì mở rộng bề mặt tấn công của chúng.
  */
  app.use('/api/v1/community', express.json({ limit: '5mb' }));
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());

  // Mỗi request có id riêng để trace xuyên suốt routes → controller → service.
  app.use(
    pinoHttp({
      logger,
      genReqId: (req: IncomingMessage, res: ServerResponse) => {
        const id = (req.headers['x-request-id'] as string | undefined) ?? crypto.randomUUID();
        res.setHeader('x-request-id', id);
        return id;
      },
    }),
  );

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  const api = express.Router();
  api.use('/auth', authRoutes);
  api.use('/goals', goalRoutes);
  api.use('/habits', habitRoutes);
  api.use('/topics', topicRoutes);
  api.use('/flashcards', flashcardRoutes);
  api.use('/lessons', lessonRoutes);
  api.use('/statistics', statisticsRoutes);
  api.use('/notifications', notificationRoutes);
  api.use('/rewards', rewardsRoutes);
  api.use('/leaderboard', leaderboardRoutes);
  api.use('/admin', adminRoutes);
  api.use('/community', communityRoutes);
  api.use('/groups', groupRoutes);

  app.use('/api/v1', api);

  // Hai middleware này phải nằm CUỐI CÙNG, đúng thứ tự.
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
