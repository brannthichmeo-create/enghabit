import { Router } from 'express';
import { UserRole, leaderboardQuerySchema } from '@enghabit/shared';
import { asyncHandler } from '../../common/middlewares/async-handler.js';
import { currentUser, requireAuth, requireRole } from '../../common/middlewares/auth-guard.js';
import { getValidatedQuery, validateQuery } from '../../common/middlewares/validate.js';
import * as leaderboardService from './leaderboard.service.js';

export const leaderboardRoutes: Router = Router();

// Chỉ người học — quản trị viên không đi học nên cũng không có mặt trong bảng xếp hạng
// (xem CLAUDE.md > Chức năng cho quản trị viên).
leaderboardRoutes.use(requireAuth, requireRole(UserRole.USER));

leaderboardRoutes.get(
  '/',
  validateQuery(leaderboardQuerySchema),
  asyncHandler(async (req, res) => {
    const user = currentUser(req);
    res.json(
      await leaderboardService.getLeaderboard(
        user.id,
        user.timezone,
        getValidatedQuery(req, leaderboardQuerySchema),
      ),
    );
  }),
);
