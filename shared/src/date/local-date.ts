/**
 * Xử lý "ngày local" — nền tảng của toàn bộ tính năng streak & thống kê.
 *
 * Quy ước (xem CLAUDE.md > Quy ước thời gian):
 * - DB lưu thời điểm ở UTC (`occurredAt`).
 * - ActivityLog lưu thêm `localDate` (YYYY-MM-DD) = ngày theo timezone của user.
 * - Mọi phép group theo ngày dùng `localDate`, không convert timezone trong SQL.
 */

/** Ngày local dạng `YYYY-MM-DD`. Dùng string thay vì Date để tránh lệch timezone khi truyền qua JSON. */
export type LocalDate = string;

const LOCAL_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function isLocalDate(value: string): value is LocalDate {
  return LOCAL_DATE_PATTERN.test(value);
}

/**
 * Đổi một thời điểm UTC sang ngày local theo timezone IANA của user.
 * Dùng locale `en-CA` vì nó cho ra đúng định dạng YYYY-MM-DD.
 */
export function toLocalDate(instant: Date, timeZone: string): LocalDate {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(instant);
}

/** Ngày hôm nay theo timezone của user. */
export function todayLocalDate(timeZone: string, now: Date = new Date()): LocalDate {
  return toLocalDate(now, timeZone);
}

/**
 * Cộng/trừ số ngày vào một LocalDate.
 * Tính bằng UTC nội bộ nên không bị ảnh hưởng bởi DST — LocalDate chỉ là nhãn ngày, không phải mốc thời gian.
 */
export function addDays(date: LocalDate, days: number): LocalDate {
  const [year, month, day] = date.split('-').map(Number) as [number, number, number];
  const utc = new Date(Date.UTC(year, month - 1, day));
  utc.setUTCDate(utc.getUTCDate() + days);
  return utc.toISOString().slice(0, 10);
}

/** Số ngày giữa hai LocalDate (b - a). Trả về số âm nếu b trước a. */
export function diffInDays(a: LocalDate, b: LocalDate): number {
  const toUtcMs = (d: LocalDate): number => {
    const [year, month, day] = d.split('-').map(Number) as [number, number, number];
    return Date.UTC(year, month - 1, day);
  };
  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  return Math.round((toUtcMs(b) - toUtcMs(a)) / MS_PER_DAY);
}

/** Ngày bắt đầu tuần (thứ Hai) chứa `date`. */
export function startOfWeek(date: LocalDate): LocalDate {
  const [year, month, day] = date.split('-').map(Number) as [number, number, number];
  const utc = new Date(Date.UTC(year, month - 1, day));
  // getUTCDay(): 0 = Chủ nhật → quy về thứ Hai là đầu tuần
  const offset = (utc.getUTCDay() + 6) % 7;
  return addDays(date, -offset);
}

/** Ngày đầu tháng chứa `date`. */
export function startOfMonth(date: LocalDate): LocalDate {
  return `${date.slice(0, 7)}-01`;
}

/** Danh sách LocalDate liên tục từ `from` đến `to` (bao gồm cả hai đầu). */
export function eachDayBetween(from: LocalDate, to: LocalDate): LocalDate[] {
  const total = diffInDays(from, to);
  if (total < 0) return [];
  return Array.from({ length: total + 1 }, (_, i) => addDays(from, i));
}
