import { z } from 'zod';
import { localDateSchema } from './common.schema.js';

/**
 * Việc cần làm trong ngày.
 *
 * Đây là sổ tay cá nhân, KHÔNG phải hoạt động học: đánh dấu xong một việc không ghi
 * `ActivityLog`, không cộng XP, không nối chuỗi ngày (xem be/src/modules/todos).
 */

/** Trần số việc của MỘT ngày. Có trần để một vòng lặp gọi API không bơm được vạn dòng. */
export const MAX_TODOS_PER_DAY = 50;

/** Độ dài tối đa của tiêu đề, khớp `VARCHAR(200)` dưới DB. */
export const TODO_TITLE_MAX = 200;

/** Số việc quá hạn trả kèm danh sách hôm nay. Nhiều hơn thì danh sách hôm nay bị lấp. */
export const MAX_OVERDUE_TODOS = 20;

export const createTodoSchema = z.object({
  title: z.string().trim().min(1, 'Tên việc không được để trống').max(TODO_TITLE_MAX),
  /** Ngày việc thuộc về. Bỏ trống = hôm nay theo timezone của user. */
  date: localDateSchema.optional(),
});
export type CreateTodoInput = z.infer<typeof createTodoSchema>;

export const updateTodoSchema = z
  .object({
    title: z.string().trim().min(1, 'Tên việc không được để trống').max(TODO_TITLE_MAX).optional(),
    isDone: z.boolean().optional(),
    /** Dời việc sang ngày khác — cũng là cách "dời việc quá hạn sang hôm nay". */
    date: localDateSchema.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Không có gì để cập nhật',
  });
export type UpdateTodoInput = z.infer<typeof updateTodoSchema>;

export const todoQuerySchema = z.object({
  /** Ngày muốn xem. Bỏ trống = hôm nay theo timezone của user. */
  date: localDateSchema.optional(),
});
export type TodoQuery = z.infer<typeof todoQuerySchema>;

/** Một việc, dạng trả về từ API. */
export interface TodoRow {
  id: number;
  title: string;
  /** Ngày việc thuộc về (`YYYY-MM-DD`). */
  date: string;
  isDone: boolean;
  /** Thời điểm đánh dấu xong, ISO UTC. Null khi chưa xong. */
  doneAt: string | null;
  createdAt: string;
}

/** Danh sách của một ngày, kèm việc còn nợ từ các ngày trước. */
export interface TodoDay {
  /** Ngày đang xem — backend tính sẵn để client không phải tự đoán timezone. */
  date: string;
  items: TodoRow[];
  /**
   * Việc chưa xong của các ngày TRƯỚC `date`, chỉ trả khi `date` là hôm nay.
   *
   * Không có khối này thì việc quên làm hôm qua biến mất lặng lẽ lúc sang ngày mới —
   * người dùng chỉ phát hiện khi đã muộn.
   */
  overdue: TodoRow[];
}
