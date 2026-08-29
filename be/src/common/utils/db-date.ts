import { isLocalDate, type LocalDate } from '@enghabit/shared';

/**
 * Cầu nối giữa LocalDate ('YYYY-MM-DD' dạng string) và cột DATE của MySQL (Prisma trả về Date).
 *
 * Prisma map cột @db.Date thành JS Date ở mốc UTC 00:00. Chuyển đổi phải luôn đi qua UTC,
 * nếu dùng getFullYear()/new Date('YYYY-MM-DD') theo giờ máy chủ sẽ bị lệch 1 ngày —
 * đây là nguyên nhân kinh điển của bug streak.
 */

/** LocalDate → Date để ghi vào cột DATE. */
export function toDbDate(date: LocalDate): Date {
  return new Date(`${date}T00:00:00.000Z`);
}

/** Date đọc từ cột DATE → LocalDate. */
export function fromDbDate(date: Date): LocalDate {
  const value = date.toISOString().slice(0, 10);
  if (!isLocalDate(value)) {
    throw new Error(`Giá trị ngày không hợp lệ đọc từ DB: ${date.toISOString()}`);
  }
  return value;
}
