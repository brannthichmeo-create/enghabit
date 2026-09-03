import { Router } from 'express';
import { UserRole, claimMissionSchema, type ClaimMissionInput } from '@enghabit/shared';
import { asyncHandler } from '../../common/middlewares/async-handler.js';
import { currentUser, requireAuth, requireRole } from '../../common/middlewares/auth-guard.js';
import { validateBody } from '../../common/middlewares/validate.js';
import * as rewardsService from './rewards.service.js';

export const rewardsRoutes: Router = Router();

// Chỉ người học. Quản trị viên vận hành hệ thống chứ không đi học (xem CLAUDE.md >
// Chức năng cho quản trị viên) — giao diện đã không hiện các màn hình này cho họ, nhưng
// chặn luôn ở API để gọi thẳng bằng token admin cũng không ăn được XP, xu hay streak.
rewardsRoutes.use(requireAuth, requireRole(UserRole.USER));

/** Toàn bộ dữ liệu khu phần thưởng trong một request — FE không phải ghép nhiều lời gọi. */
rewardsRoutes.get(
  '/',
  asyncHandler(async (req, res) => {
    const user = currentUser(req);
    res.json(await rewardsService.getRewardsSummary(user.id, user.timezone));
  }),
);

rewardsRoutes.post(
  '/check-in',
  asyncHandler(async (req, res) => {
    const user = currentUser(req);
    res.json(await rewardsService.checkIn(user.id, user.timezone));
  }),
);

rewardsRoutes.post(
  '/missions/claim',
  validateBody(claimMissionSchema),
  asyncHandler(async (req, res) => {
    const user = currentUser(req);
    const { missionId } = req.body as ClaimMissionInput;
    res.json(await rewardsService.claimMission(user.id, user.timezone, missionId));
  }),
);

rewardsRoutes.post(
  '/streak-freeze/buy',
  asyncHandler(async (req, res) => {
    const user = currentUser(req);
    res.json(await rewardsService.buyStreakFreeze(user.id, user.timezone));
  }),
);
