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
    message: 'Ngày kết thúc phải sau ngày bắt đầu',
    path: ['endDate'],
  });
export type CreateGoalInput = z.infer<typeof createGoalSchema>;

export const updateGoalSchema = z.object({
  targetValue: z.number().int().positive().max(10_000).optional(),
  endDate: localDateSchema.nullable().optional(),
  status: z.nativeEnum(GoalStatus).optional(),
});
export type UpdateGoalInput = z.infer<typeof updateGoalSchema>;

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
