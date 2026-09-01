import { z } from 'zod';
import { MissionId } from '../constants/enums.js';
import { type LocalDate } from '../date/local-date.js';
import { type MissionState } from '../rewards/rewards.js';

export const claimMissionSchema = z.object({
  missionId: z.nativeEnum(MissionId),
});
export type ClaimMissionInput = z.infer<typeof claimMissionSchema>;

/** Trạng thái điểm danh của hôm nay, theo ngày local của user. */
export interface CheckInState {
  /** Ngày local đang xét — FE hiển thị theo ngày này, không tự tính lại từ giờ máy. */
  localDate: LocalDate;
  claimedToday: boolean;
  /** Số xu sẽ nhận nếu điểm danh bây giờ. */
  reward: number;
}

export interface StreakFreezeState {
  /** Số vật phẩm còn trong kho. */
  available: number;
  price: number;
  max: number;
  /** Ngày gần nhất đã dùng một vật phẩm để cứu chuỗi, null nếu chưa từng dùng. */
  lastUsedDate: LocalDate | null;
}

/** Toàn bộ dữ liệu cho khu phần thưởng trên trang tổng quan — gọi một request là đủ. */
export interface RewardsSummary {
  coins: number;
  checkIn: CheckInState;
  missions: MissionState[];
  freeze: StreakFreezeState;
}

/** Kết quả một hành động tiêu/nhận xu: số dư mới và số xu vừa thay đổi. */
export interface CoinChangeResult {
  coins: number;
  /** Dương là nhận thêm, âm là vừa tiêu. */
  delta: number;
  summary: RewardsSummary;
}
