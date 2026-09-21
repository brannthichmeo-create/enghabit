import { z } from 'zod';
import { GoalPeriod, GoalStatus, GoalType } from '../constants/enums.js';
import { localDateSchema } from './common.schema.js';

export const createGoalSchema = z
  .object({
    type: z.nativeEnum(GoalType),
    targetValue: z.number().int().positive('Mục tiêu phải lớn hơn 0').max(10_000),
    period: z.nativeEnum(GoalPeriod),
    startDate: localDateSchema,
    endDate: localDateSchema.optional(),
  })
  .refine((data) => !data.endDate || data.endDate >= data.startDate, {
    message: 'Hạn phải từ ngày bắt đầu mục tiêu trở đi',
    path: ['endDate'],
  });
export type CreateGoalInput = z.infer<typeof createGoalSchema>;

/**
 * Sửa một mục tiêu đang theo dõi. Không nhận `status`: kết thúc mục tiêu đi qua
 * `finishGoalSchema`, vì kết thúc còn phải chốt ngày hạn — để PATCH đổi trạng thái
 * thẳng là có hai đường, và đường tắt để lại mục tiêu "đã xong" mà không biết xong hôm nào.
 */
export const updateGoalSchema = z.object({
  targetValue: z.number().int().positive('Mục tiêu phải lớn hơn 0').max(10_000).optional(),
  endDate: localDateSchema.nullable().optional(),
});
export type UpdateGoalInput = z.infer<typeof updateGoalSchema>;

/** Kết thúc mục tiêu: đã đạt, hoặc thôi theo dõi. Kết thúc rồi thì không mở lại. */
export const finishGoalSchema = z.object({
  outcome: z.enum([GoalStatus.COMPLETED, GoalStatus.ARCHIVED]),
});
export type FinishGoalInput = z.infer<typeof finishGoalSchema>;

/** Tiến độ của một mục tiêu trong kỳ hiện tại. */
export interface GoalProgress {
  goalId: number;
  type: GoalType;
  targetValue: number;
  currentValue: number;
  /** 0-100, đã làm tròn. */
  completionRate: number;
  isCompleted: boolean;
}
