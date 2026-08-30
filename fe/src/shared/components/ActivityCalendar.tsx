import { useMemo, useState } from 'react';
import { addDays, type ActivityCalendar as CalendarData, type CalendarDay } from '@enghabit/shared';

/**
 * Biểu đồ lịch kiểu GitHub: mỗi ô là một ngày, càng đậm là học càng nhiều.
 *
 * Đây là cách nhanh nhất để thấy thói quen của cả năm trong một cái nhìn —
 * chuỗi ngày liền mạch, những khoảng bỏ bê, và xu hướng gần đây.
 *
 * Màu là thang tuần tự MỘT sắc (chàm), độ sáng giảm dần đều — đã kiểm tra tính đơn điệu.
 * Không dùng nhiều màu khác nhau vì đây là dữ liệu độ lớn, không phải phân loại.
 */

const LEVEL_COLORS = ['#eceef2', '#c7d2fe', '#818cf8', '#4f46e5', '#3730a3'];

const WEEKDAY_LABELS = ['T2', '', 'T4', '', 'T6', '', 'CN'];

const MONTH_LABELS = ['Th1', 'Th2', 'Th3', 'Th4', 'Th5', 'Th6', 'Th7', 'Th8', 'Th9', 'Th10', 'Th11', 'Th12'];

const CELL = 11;
const GAP = 3;

interface Week {
  /** 7 ô, index 0 = Thứ Hai. Null là ngày nằm ngoài khoảng dữ liệu. */
  days: (CalendarDay | null)[];
  /** Tháng của ô đầu tuần, dùng để đặt nhãn tháng. */
  month: number;
}

export function ActivityCalendarChart({ data }: { data: CalendarData }): JSX.Element {
  const [hovered, setHovered] = useState<CalendarDay | null>(null);

  const weeks = useMemo(() => buildWeeks(data.days), [data.days]);

  const levelOf = (count: number): number => {
    if (count === 0) return 0;
    const [t1, t2, t3] = data.thresholds;
    if (count <= t1) return 1;
    if (count <= t2) return 2;
    if (count <= t3) return 3;
    return 4;
  };

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm text-slate-600">
          <span className="font-semibold tabular-nums text-slate-900">{data.totalActivities}</span> hoạt động
          trong <span className="font-semibold tabular-nums text-slate-900">{data.activeDays}</span> ngày
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
                      <div
                        key={dayIndex}
                        onMouseEnter={() => setHovered(day)}
                        onMouseLeave={() => setHovered(null)}
                        onFocus={() => setHovered(day)}
                        onBlur={() => setHovered(null)}
                        tabIndex={day.count > 0 ? 0 : -1}
                        role="img"
                        aria-label={`${day.date}: ${day.count} hoạt động`}
                        title={`${formatDate(day.date)} — ${day.count} hoạt động`}
                        className="rounded-[2px] transition-transform hover:scale-125"
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
        <p className="min-h-[18px] text-xs text-slate-500">
          {hovered ? (
            <>
              <span className="font-medium text-slate-700">{formatDate(hovered.date)}</span>
              {hovered.count > 0 ? ` — ${hovered.count} hoạt động` : ' — không học'}
            </>
          ) : (
            'Mỗi ô là một ngày, càng đậm là học càng nhiều'
          )}
        </p>

        <Legend />
      </div>
    </div>
  );
}

function Legend(): JSX.Element {
  return (
    <div className="flex items-center gap-1.5 text-xs text-slate-400">
      <span>Ít</span>
      {LEVEL_COLORS.map((color, i) => (
        <span
          key={i}
          className="rounded-[2px]"
          style={{ width: CELL, height: CELL, backgroundColor: color }}
          aria-hidden
        />
      ))}
      <span>Nhiều</span>
    </div>
  );
}

function WeekdayLabels(): JSX.Element {
  return (
    <div className="flex flex-col gap-[3px] pr-1">
      {WEEKDAY_LABELS.map((label, i) => (
        <span
          key={i}
          className="text-[9px] leading-none text-slate-400"
          style={{ height: CELL, lineHeight: `${CELL}px` }}
        >
          {label}
        </span>
      ))}
    </div>
  );
}

/** Nhãn tháng đặt tại tuần đầu tiên thuộc tháng đó, canh theo đúng cột. */
function MonthLabels({ weeks }: { weeks: Week[] }): JSX.Element {
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
    <div className="relative mb-1 h-3" style={{ marginLeft: 22 }}>
      {labels.map((label) => (
        <span
          key={label.index}
          className="absolute text-[9px] leading-none text-slate-400"
          style={{ left: label.index * (CELL + GAP) }}
        >
          {label.text}
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

function formatDate(date: string): string {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString('vi-VN', {
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
