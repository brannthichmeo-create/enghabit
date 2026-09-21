import { z } from 'zod';
import { HabitFrequency } from '../constants/enums.js';
import { HABIT_AUTO_ACTIVITIES, habitAmountsError } from '../habit/habit-schedule.js';
import { localDateSchema } from './common.schema.js';

/** Giờ nhắc trong ngày, định dạng 24h `HH:mm` theo timezone của user. */
export const timeOfDaySchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Giờ phải có định dạng HH:mm');

/** Thứ trong tuần: 1 = Thứ Hai ... 7 = Chủ nhật (theo ISO-8601). */
export const weekdaySchema = z.number().int().min(1).max(7);

/** Trần lượng mỗi lần — đủ cho "300 thẻ" hay "120 phút", chặn gõ nhầm thêm vài số 0. */
const MAX_HABIT_AMOUNT = 1000;
const amountSchema = z.number().int().positive('Số lượng phải lớn hơn 0').max(MAX_HABIT_AMOUNT);

/**
 * Các trường cấu hình dùng chung cho tạo và sửa.
 *
 * Mọi trường "tuỳ chọn" đều nhận `null` để XOÁ khi sửa — bỏ trống mà gửi `undefined` thì
 * máy chủ hiểu là "không đổi" và giá trị cũ vẫn còn đó.
 */
const habitFields = {
  name: z.string().trim().min(1, 'Tên thói quen không được để trống').max(120),
  frequency: z.nativeEnum(HabitFrequency),
  /** Bắt buộc khi frequency = CUSTOM. */
  customDays: z.array(weekdaySchema).min(1).max(7),
  reminderTime: timeOfDaySchema.nullable(),
  isActive: z.boolean(),
  /** Null = tự tích. Có giá trị = tự hoàn thành từ hoạt động học trong app. */
  autoActivity: z.enum(HABIT_AUTO_ACTIVITIES).nullable(),
  targetAmount: amountSchema.nullable(),
  minAmount: amountSchema.nullable(),
  unit: z.string().trim().max(20).nullable(),
  timesPerWeek: z.number().int().min(1).max(7).nullable(),
  goalId: z.number().int().positive().nullable(),
};

type HabitShape = {
  frequency?: HabitFrequency;
  customDays?: number[];
  targetAmount?: number | null;
  minAmount?: number | null;
};

function habitRules(data: HabitShape, ctx: z.RefinementCtx): void {
  // Đổi sang "theo thứ" mà không gửi kèm thứ nào thì thói quen không bao giờ đến hạn.
  if (data.frequency === HabitFrequency.CUSTOM && (data.customDays?.length ?? 0) === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Thói quen tuỳ chỉnh phải chọn ít nhất một ngày trong tuần',
      path: ['customDays'],
    });
  }

  // Chỉ kiểm khi payload có đủ cả hai số; PATCH gửi một số thì service kiểm trên bản đã gộp.
  if (data.minAmount === undefined || data.targetAmount === undefined) return;
  const message = habitAmountsError({ targetAmount: data.targetAmount, minAmount: data.minAmount });
  if (message) ctx.addIssue({ code: z.ZodIssueCode.custom, message, path: ['minAmount'] });
}

export const createHabitSchema = z
  .object({
    name: habitFields.name,
    frequency: habitFields.frequency,
    customDays: habitFields.customDays.optional(),
    reminderTime: timeOfDaySchema.optional(),
    isActive: habitFields.isActive.default(true),
    autoActivity: habitFields.autoActivity.default(null),
    targetAmount: habitFields.targetAmount.default(null),
    minAmount: habitFields.minAmount.default(null),
    unit: habitFields.unit.default(null),
    timesPerWeek: habitFields.timesPerWeek.default(null),
    goalId: habitFields.goalId.default(null),
  })
  .superRefine(habitRules);
export type CreateHabitInput = z.infer<typeof createHabitSchema>;

export const updateHabitSchema = z
  .object({
    name: habitFields.name.optional(),
    frequency: habitFields.frequency.optional(),
    customDays: habitFields.customDays.optional(),
    reminderTime: habitFields.reminderTime.optional(),
    isActive: habitFields.isActive.optional(),
    autoActivity: habitFields.autoActivity.optional(),
    targetAmount: habitFields.targetAmount.optional(),
    minAmount: habitFields.minAmount.optional(),
    unit: habitFields.unit.optional(),
    timesPerWeek: habitFields.timesPerWeek.optional(),
    goalId: habitFields.goalId.optional(),
  })
  .superRefine(habitRules);
export type UpdateHabitInput = z.infer<typeof updateHabitSchema>;

export const checkInHabitSchema = z.object({
  /** Mặc định là hôm nay theo timezone user nếu không truyền. */
  date: localDateSchema.optional(),
  /**
   * Lượng đã làm, chỉ có nghĩa với thói quen có lượng mỗi lần. Bỏ trống là làm đủ — nút
   * Check-in một chạm không bắt người dùng gõ số mỗi ngày.
   */
  amount: amountSchema.optional(),
  note: z.string().trim().max(500).optional(),
});
export type CheckInHabitInput = z.infer<typeof checkInHabitSchema>;
