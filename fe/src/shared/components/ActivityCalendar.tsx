import { useMemo, useState } from 'react';
import { CalendarDays } from 'lucide-react';
import { Link } from 'react-router-dom';
import { addDays, type ActivityCalendar as CalendarData, type CalendarDay } from '@enghabit/shared';
import { useLocale, useT } from '../../shared/i18n/language';

/**
 * Biểu đồ lịch kiểu GitHub: mỗi ô là một ngày, càng đậm là học càng nhiều.
 *
 * Đây là cách nhanh nhất để thấy thói quen của cả năm trong một cái nhìn —
 * chuỗi ngày liền mạch, những khoảng bỏ bê, và xu hướng gần đây.
 *
 * Màu là thang tuần tự MỘT sắc (xanh ngọc theo logo), độ sáng giảm dần đều —
 * đã kiểm tra tính đơn điệu bằng công thức luminance, không chọn bằng mắt.
 * Không dùng nhiều màu khác nhau vì đây là dữ liệu độ lớn, không phải phân loại.
 */

// Đọc từ CSS variable thay vì mã màu cố định, để thang màu tự đổi theo chế độ
// sáng/tối. Cả hai thang đều đã kiểm tra độ sáng giảm dần đơn điệu.
const LEVEL_COLORS = [
  'var(--cal-0)',
  'var(--cal-1)',
  'var(--cal-2)',
  'var(--cal-3)',
  'var(--cal-4)',
];

const WEEKDAY_LABELS = ['T2', '', 'T4', '', 'T6', '', 'CN'];

/** Hôm nay theo giờ máy người dùng, dùng để đánh dấu ô hiện tại. */
function todayIso(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

const MONTH_LABELS = ['Th1', 'Th2', 'Th3', 'Th4', 'Th5', 'Th6', 'Th7', 'Th8', 'Th9', 'Th10', 'Th11', 'Th12'];

/**
 * Kích thước một ô. 13px thay vì 11px: ở 11px, ô và khe giữa gần bằng nhau nên cả lưới
 * nhìn như một mảng nhiễu, khó dò theo hàng để biết ô nào là thứ mấy.
 */
const CELL = 13;
const GAP = 3;

/**
 * Bề ngang cột nhãn thứ (T2, T4...).
 *
 * Dùng CHUNG cho cả cột nhãn lẫn lề trái của hàng nhãn tháng — trước đây hai chỗ ghi
 * hai con số khác nhau nên nhãn tháng lệch khỏi cột tuần của chính nó.
 */
const LABEL_COL = 26;

interface Week {
  /** 7 ô, index 0 = Thứ Hai. Null là ngày nằm ngoài khoảng dữ liệu. */
  days: (CalendarDay | null)[];
  /** Tháng của ô đầu tuần, dùng để đặt nhãn tháng. */
  month: number;
}

export function ActivityCalendarChart({ data }: { data: CalendarData }): JSX.Element {
  const t = useT();
  const locale = useLocale();
  const [hovered, setHovered] = useState<CalendarDay | null>(null);
  // Ngày được bấm chọn. Cần riêng khỏi `hovered` vì trên màn hình cảm ứng không có
  // hover — không có cái này thì nửa số người dùng không xem được chi tiết ngày nào.
  const [pinned, setPinned] = useState<string | null>(null);

  const shown = hovered ?? data.days.find((day) => day.date === pinned) ?? null;

  const weeks = useMemo(() => buildWeeks(data.days), [data.days]);
  const today = todayIso();

  const levelOf = (count: number): number => {
    if (count === 0) return 0;
    const [t1, t2, t3] = data.thresholds;
    if (count <= t1) return 1;
    if (count <= t2) return 2;
    if (count <= t3) return 3;
    return 4;
  };

  /*
    Chưa học buổi nào thì KHÔNG vẽ lưới.

    Lưới toàn ô rỗng cùng một màu không nói được gì, mà lại kèm dòng "0 hoạt động trong
    0 ngày", chú thích Ít–Nhiều và câu mời bấm vào ô — ba thứ đều vô nghĩa lúc này và
    khiến người mới tưởng trang bị lỗi. Thay bằng một lời mời làm việc tiếp theo.
  */
  if (data.totalActivities === 0) {
    return (
      <div className="rounded-xl border border-dashed border-line px-6 py-10 text-center">
        <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-sunken">
          <CalendarDays className="h-5 w-5 text-content-muted" aria-hidden />
        </div>
        <p className="font-medium text-content-soft">{t('Chưa có ngày học nào')}</p>
        <p className="mx-auto mt-1 max-w-sm text-sm text-content-muted">
          {t('Học một bài bất kỳ hôm nay là ô đầu tiên sáng lên, và chuỗi ngày của bạn bắt đầu.')}
        </p>
        <Link
          to="/learn"
          className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-on-brand transition-colors hover:bg-brand-strong"
        >
          {t('Học ngay')}
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm text-content-soft">
          {t('{activities} hoạt động trong {days} ngày', {
            activities: data.totalActivities,
            days: data.activeDays,
          })}
        </p>
      </div>

      {/* Cuộn ngang trên màn hình hẹp — giữ nguyên kích thước ô để vẫn dễ nhìn */}
      <div className="mt-3 overflow-x-auto pb-1">
        <div className="inline-block min-w-full">
          <MonthLabels weeks={weeks} />

          <div className="flex gap-[3px]">
            <WeekdayLabels />

            <div className="flex gap-[3px]">
              {weeks.map((week, weekIndex) => (
                <div key={weekIndex} className="flex flex-col gap-[3px]">
                  {week.days.map((day, dayIndex) =>
                    day === null ? (
                      <div key={dayIndex} style={{ width: CELL, height: CELL }} />
                    ) : (
                      <button
                        key={dayIndex}
                        type="button"
                        onMouseEnter={() => setHovered(day)}
                        onMouseLeave={() => setHovered(null)}
                        onFocus={() => setHovered(day)}
                        onBlur={() => setHovered(null)}
                        onClick={() => setPinned((current) => (current === day.date ? null : day.date))}
                        aria-label={`${day.date}: ${t('{n} hoạt động', { n: day.count })}`}
                        aria-pressed={pinned === day.date}
                        title={`${formatDate(day.date, locale)} — ${t('{n} hoạt động', { n: day.count })}`}
                        // Viền quanh ô HÔM NAY để người xem định vị được mình đang ở
                        // đâu trên dải ngày — không có mốc này thì phải đếm ngược từ
                        // nhãn tháng mới biết ô cuối là ngày nào.
                        className={`rounded-[3px] transition-transform hover:scale-125 ${
                          pinned === day.date
                            ? 'ring-2 ring-brand ring-offset-1 ring-offset-surface'
                            : day.date === today
                              ? 'ring-1 ring-content-muted'
                              : ''
                        }`}
                        style={{
                          width: CELL,
                          height: CELL,
                          backgroundColor: LEVEL_COLORS[levelOf(day.count)],
                        }}
                      />
                    ),
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        {/* Chỗ cố định cho chi tiết ngày đang trỏ để không nhảy layout */}
        <p className="min-h-[18px] text-xs text-content-muted">
          {shown ? (
            <>
              <span className="font-medium text-content-soft">{formatDate(shown.date, locale)}</span>
              {shown.count > 0 ? ` — ${t('{n} hoạt động', { n: shown.count })}` : ` — ${t('không học')}`}
            </>
          ) : (
            t('Bấm vào một ô để xem ngày đó')
          )}
        </p>

        <Legend />
      </div>
    </div>
  );
}

function Legend(): JSX.Element {
  const t = useT();
  return (
    <div className="flex items-center gap-1.5 text-xs text-content-muted">
      <span>{t('Ít')}</span>
      {LEVEL_COLORS.map((color, i) => (
        <span
          key={i}
          className="rounded-[2px]"
          style={{ width: CELL, height: CELL, backgroundColor: color }}
          aria-hidden
        />
      ))}
      <span>{t('Nhiều')}</span>
    </div>
  );
}

function WeekdayLabels(): JSX.Element {
  // Nhãn khai báo trong mảng hằng số nên dịch tại CHỖ HIỂN THỊ (xem CLAUDE.md).
  // Ô trống là khoảng cách cố ý giữa các thứ — không đưa chuỗi rỗng qua `t()`.
  const t = useT();

  return (
    <div className="flex shrink-0 flex-col gap-[3px]" style={{ width: LABEL_COL }}>
      {WEEKDAY_LABELS.map((label, i) => (
        <span
          key={i}
          className="text-[10px] leading-none text-content-muted"
          style={{ height: CELL, lineHeight: `${CELL}px` }}
        >
          {label ? t(label) : ''}
        </span>
      ))}
    </div>
  );
}

/** Nhãn tháng đặt tại tuần đầu tiên thuộc tháng đó, canh theo đúng cột. */
function MonthLabels({ weeks }: { weeks: Week[] }): JSX.Element {
  // Như `WeekdayLabels`: nhãn nằm trong mảng hằng số, dịch ở chỗ hiển thị.
  const t = useT();
  const labels: { index: number; text: string }[] = [];
  let lastMonth = -1;

  weeks.forEach((week, index) => {
    if (week.month === lastMonth) return;
    lastMonth = week.month;

    const candidate = { index, text: MONTH_LABELS[week.month] ?? '' };
    const previous = labels[labels.length - 1];

    if (!previous || index - previous.index >= 3) {
      labels.push(candidate);
      return;
    }

    // Hai nhãn quá sát nhau sẽ chồng chữ. Giữ nhãn sau và bỏ nhãn trước, vì nhãn
    // trước thường là tháng chỉ còn vài ngày ở đầu dải — bỏ nó ít mất thông tin hơn.
    labels[labels.length - 1] = candidate;
  });

  return (
    <div className="relative mb-1.5 h-3.5" style={{ marginLeft: LABEL_COL }}>
      {labels.map((label) => (
        <span
          key={label.index}
          className="absolute text-[10px] font-medium leading-none text-content-muted"
          style={{ left: label.index * (CELL + GAP) }}
        >
          {label.text ? t(label.text) : ''}
        </span>
      ))}
    </div>
  );
}

/**
 * Xếp danh sách ngày thành các cột tuần (Thứ Hai ở trên cùng).
 * Tuần đầu và tuần cuối được đệm null cho khớp vị trí thứ trong tuần.
 */
function buildWeeks(days: CalendarDay[]): Week[] {
  if (days.length === 0) return [];

  const weeks: Week[] = [];
  let current: (CalendarDay | null)[] = [];

  const firstDate = days[0]?.date;
  if (!firstDate) return [];

  // Đệm đầu tuần đầu tiên: nếu ngày đầu là Thứ Tư thì cần 2 ô trống trước đó.
  const firstWeekday = isoWeekday(firstDate);
  for (let i = 1; i < firstWeekday; i += 1) current.push(null);

  for (const day of days) {
    current.push(day);
    if (current.length === 7) {
      weeks.push({ days: current, month: monthOf(day.date) });
      current = [];
    }
  }

  if (current.length > 0) {
    const lastDay = days[days.length - 1];
    while (current.length < 7) current.push(null);
    weeks.push({ days: current, month: lastDay ? monthOf(lastDay.date) : 0 });
  }

  return weeks;
}

/** 1 = Thứ Hai ... 7 = Chủ nhật. */
function isoWeekday(date: string): number {
  return ((new Date(`${date}T00:00:00Z`).getUTCDay() + 6) % 7) + 1;
}

/** 0 = tháng 1. */
function monthOf(date: string): number {
  return Number(date.slice(5, 7)) - 1;
}

/** Hàm thường nên không gọi hook được — nhận `locale` qua tham số (xem CLAUDE.md). */
function formatDate(date: string, locale: string): string {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
  });
}

/** Ngày kế tiếp — dùng khi cần kiểm tra tính liên tục của dải. */
export function nextDate(date: string): string {
  return addDays(date, 1);
}
