import crypto from 'node:crypto';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { type Express } from 'express';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { FeatureKey } from '@enghabit/shared';
import { env } from './config/env.js';
import { logger } from './lib/logger.js';
import { errorHandler, notFoundHandler } from './common/middlewares/error-handler.js';
import { requireAuth } from './common/middlewares/auth-guard.js';
import { authRoutes } from './modules/auth/auth.routes.js';
import { goalRoutes } from './modules/goals/goal.routes.js';
import { habitRoutes } from './modules/habits/habit.routes.js';
import { topicRoutes } from './modules/topics/topic.routes.js';
import { libraryRoutes } from './modules/library/library.routes.js';
import { studyRoutes } from './modules/study/study.routes.js';
import { statisticsRoutes } from './modules/statistics/statistics.routes.js';
import { notificationRoutes } from './modules/notifications/notification.routes.js';
import { rewardsRoutes } from './modules/rewards/rewards.routes.js';
import { shopImageRoutes, shopRoutes } from './modules/shop/shop.routes.js';
import { leaderboardRoutes } from './modules/leaderboard/leaderboard.routes.js';
import { adminRoutes } from './modules/admin/admin.routes.js';
import { featureRoutes } from './modules/feature-flags/feature.routes.js';
import { requireFeature } from './modules/feature-flags/feature.guard.js';
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
  // Nhập thẻ từ file: tối đa 500 thẻ × (100 + 500 + 100 + 500) ký tự, chữ Việt tới 3 byte
  // mỗi ký tự trong UTF-8 ≈ 1,8MB cho trường hợp xấu nhất.
  app.use(['/api/v1/library/sets/import', '/api/v1/library/sets/:id/cards/import'], express.json({ limit: '3mb' }));
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
  api.use('/features', featureRoutes);

  /*
    Các nhánh dưới đây tắt được từ /admin/features. `requireFeature` trả 404 nên với
    người học, tính năng đã tắt là không tồn tại — ẩn mục trên sidebar là chưa đủ, token
    người học gọi thẳng API vẫn ghi ActivityLog và vẫn nhận xu.

    `requireAuth` phải đứng TRƯỚC guard vì nhánh /topics cần biết vai trò để cho quản
    trị viên đi qua. Các router con vẫn giữ requireAuth/requireRole của chúng — gọi hai
    lần vô hại, còn bỏ đi là tạo ra endpoint hở nếu sau này ai đó mount lại chỗ khác.

    /statistics KHÔNG có guard ở đây: trang Tổng quan luôn phải chạy. Riêng nhánh con
    /statistics/report chịu cờ REPORT, gắn trong statistics.routes.ts.
  */
  api.use('/goals', requireAuth, requireFeature(FeatureKey.GOALS), goalRoutes);
  api.use('/habits', requireAuth, requireFeature(FeatureKey.HABITS), habitRoutes);
  // /topics giờ chỉ phục vụ màn Nội dung học tập của quản trị viên, nên không chịu cờ
  // tính năng nào: tắt Thư viện không được làm quản trị viên mất khả năng soạn nội dung.
  api.use('/topics', topicRoutes);
  api.use('/library', requireAuth, requireFeature(FeatureKey.VOCABULARY), libraryRoutes);
  // Học và Ôn tập dùng chung /study; cờ riêng của từng bên kiểm tra trong service.
  api.use('/study', requireAuth, requireFeature(FeatureKey.VOCABULARY), studyRoutes);
  api.use('/statistics', statisticsRoutes);
  api.use('/notifications', notificationRoutes);
  api.use('/rewards', requireAuth, requireFeature(FeatureKey.REWARDS), rewardsRoutes);
  /*
    Ảnh vật phẩm mount TRƯỚC nhánh /shop có guard, và cố ý không có requireAuth: thẻ
    <img> của trình duyệt không gửi được header Authorization. Ảnh là tranh minh hoạ do
    quản trị viên soạn, không mang dữ liệu của người dùng nào — khác hẳn tệp đính kèm
    của nhóm, thứ bắt buộc kiểm tra tư cách thành viên (xem shop.routes.ts).

    Router này chỉ nhận đúng GET /items/:id/image, mọi đường khác rơi xuống nhánh dưới.
  */
  api.use('/shop', shopImageRoutes);
  api.use('/shop', requireAuth, requireFeature(FeatureKey.SHOP), shopRoutes);
  api.use('/leaderboard', requireAuth, requireFeature(FeatureKey.LEADERBOARD), leaderboardRoutes);
  api.use('/admin', adminRoutes);
  /*
    Bài đăng của nhóm dùng chung module community, nên tắt Cộng đồng là nhóm lớp mất
    luôn bảng tin — vì vậy GROUPS phụ thuộc COMMUNITY trong danh mục ở shared.

    adminBypass như /topics: diễn đàn mở cho cả hai vai trò và quản trị viên vào đó để
    kiểm duyệt. Tắt diễn đàn rồi khoá luôn người kiểm duyệt là bỏ lại đúng đống bài
    cần dọn mà không ai vào dọn được.
  */
  api.use('/community', requireAuth, requireFeature(FeatureKey.COMMUNITY, { adminBypass: true }), communityRoutes);
  api.use('/groups', requireAuth, requireFeature(FeatureKey.GROUPS), groupRoutes);

  app.use('/api/v1', api);

  // Hai middleware này phải nằm CUỐI CÙNG, đúng thứ tự.
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
