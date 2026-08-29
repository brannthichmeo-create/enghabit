import { z } from 'zod';
import { HabitFrequency } from '../constants/enums.js';
import { localDateSchema } from './common.schema.js';

/** Giờ nhắc trong ngày, định dạng 24h `HH:mm` theo timezone của user. */
export const timeOfDaySchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Giờ phải có định dạng HH:mm');

/** Thứ trong tuần: 1 = Thứ Hai ... 7 = Chủ nhật (theo ISO-8601). */
export const weekdaySchema = z.number().int().min(1).max(7);

export const createHabitSchema = z
  .object({
    name: z.string().trim().min(1, 'Tên thói quen không được để trống').max(120),
    frequency: z.nativeEnum(HabitFrequency),
    /** Bắt buộc khi frequency = CUSTOM. */
    customDays: z.array(weekdaySchema).min(1).max(7).optional(),
    reminderTime: timeOfDaySchema.optional(),
    isActive: z.boolean().default(true),
  })
  .refine(
    (data) => data.frequency !== HabitFrequency.CUSTOM || (data.customDays?.length ?? 0) > 0,
    { message: 'Thói quen tuỳ chỉnh phải chọn ít nhất một ngày trong tuần', path: ['customDays'] },
  );
export type CreateHabitInput = z.infer<typeof createHabitSchema>;

export const updateHabitSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  frequency: z.nativeEnum(HabitFrequency).optional(),
  customDays: z.array(weekdaySchema).min(1).max(7).optional(),
  reminderTime: timeOfDaySchema.nullable().optional(),
  isActive: z.boolean().optional(),
});
export type UpdateHabitInput = z.infer<typeof updateHabitSchema>;

export const checkInHabitSchema = z.object({
  /** Mặc định là hôm nay theo timezone user nếu không truyền. */
  date: localDateSchema.optional(),
  note: z.string().trim().max(500).optional(),
});
export type CheckInHabitInput = z.infer<typeof checkInHabitSchema>;
