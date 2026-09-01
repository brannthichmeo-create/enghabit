/**
 * Phần thưởng động viên: điểm danh, nhiệm vụ ngày, vật phẩm giữ chuỗi.
 *
 * Đây là DOMAIN LOGIC dùng chung — be chấm chính thức, fe hiển thị và preview.
 * Định nghĩa đúng một lần tại đây để hai phía không bao giờ nói khác nhau về
 * "nhiệm vụ này cần bao nhiêu" hay "cái này giá bao nhiêu xu".
 *
 * Nguyên tắc quan trọng nhất của cả nhóm tính năng này:
 * **xu không phải XP và điểm danh không phải hoạt động học.** Điểm danh tuyệt đối
 * không ghi ActivityLog — ghi vào đó thì bấm một nút là đủ giữ streak và mọi thống
 * kê học tập sẽ nói dối (xem CLAUDE.md > Data model cốt lõi).
 */

import { ActivityType, MissionId } from '../constants/enums.js';

/** Số xu thưởng khi điểm danh một ngày. */
export const DAILY_CHECKIN_REWARD = 50;

/** Giá một vật phẩm giữ chuỗi, tính bằng xu. */
export const STREAK_FREEZE_PRICE = 200;

/** Số vật phẩm giữ chuỗi tối đa được giữ trong kho cùng lúc. */
export const MAX_STREAK_FREEZES = 3;

export interface MissionDefinition {
  id: MissionId;
  label: string;
  /** Loại hoạt động được đếm cho nhiệm vụ này, đếm trong ActivityLog của ngày. */
  activityType: ActivityType;
  /** Số lượt cần đạt trong ngày. */
  target: number;
  /** Số xu nhận được khi hoàn thành. */
  reward: number;
}

/**
 * Ba nhiệm vụ mỗi ngày, cố định.
 *
 * Cố ý mỗi nhiệm vụ nhắm một loại hoạt động khác nhau: làm xong cả ba nghĩa là đã
 * học từ mới, ôn lại từ cũ và giữ thói quen — chứ không phải lặp một việc ba lần.
 */
export const DAILY_MISSIONS: readonly MissionDefinition[] = [
  {
    id: MissionId.LEARN_VOCAB,
    label: 'Học 5 từ mới',
    activityType: ActivityType.VOCAB_LEARNED,
    target: 5,
    reward: 20,
  },
  {
    id: MissionId.REVIEW_FLASHCARDS,
    label: 'Ôn 10 thẻ',
    activityType: ActivityType.FLASHCARD_REVIEWED,
    target: 10,
    reward: 20,
  },
  {
    id: MissionId.DO_HABIT,
    label: 'Check-in 1 thói quen',
    activityType: ActivityType.HABIT_CHECKIN,
    target: 1,
    reward: 20,
  },
];

export function findMission(id: string): MissionDefinition | undefined {
  return DAILY_MISSIONS.find((mission) => mission.id === id);
}

export interface MissionState extends MissionDefinition {
  /** Số lượt đã làm hôm nay (đã cắt trần ở `target` để thanh tiến độ không vượt 100%). */
  progress: number;
  isCompleted: boolean;
  /** Đã nhận thưởng nhiệm vụ này hôm nay chưa. */
  isClaimed: boolean;
}

/**
 * Chấm tiến độ ba nhiệm vụ của một ngày.
 *
 * `counts` là số lượt theo từng loại hoạt động trong ĐÚNG ngày local đó, `claimed`
 * là các nhiệm vụ đã nhận thưởng hôm nay.
 */
export function evaluateMissions(
  counts: Partial<Record<ActivityType, number>>,
  claimed: readonly string[] = [],
): MissionState[] {
  return DAILY_MISSIONS.map((mission) => {
    const done = counts[mission.activityType] ?? 0;

    return {
      ...mission,
      progress: Math.min(done, mission.target),
      isCompleted: done >= mission.target,
      isClaimed: claimed.includes(mission.id),
    };
  });
}

/** Khoá chống trùng của một lần nhận thưởng nhiệm vụ trong ngày. */
export function missionDedupeKey(id: MissionId, localDate: string): string {
  return `MISSION:${id}:${localDate}`;
}

/** Khoá chống trùng của một lần điểm danh. Mỗi ngày local chỉ điểm danh được một lần. */
export function checkInDedupeKey(localDate: string): string {
  return `DAILY_CHECKIN:${localDate}`;
}
