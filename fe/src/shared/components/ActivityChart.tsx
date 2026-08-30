import { useState } from 'react';
import { ActivityType, type DailyStat } from '@enghabit/shared';

/**
 * Biểu đồ cột chồng: mỗi ngày một cột, chia theo loại hoạt động.
 *
 * Dùng cột chồng thay vì cột đơn vì nó trả lời được cả hai câu hỏi cùng lúc:
 * "hôm đó học nhiều hay ít" (chiều cao) và "học cái gì" (thành phần).
 *
 * Màu 4 chuỗi lấy theo thứ tự cố định đã qua kiểm tra phân biệt màu cho người mù màu.
 * KHÔNG hoán đổi thứ tự: cặp cam–vàng nếu đứng cạnh nhau sẽ khó phân biệt.
 */

interface Series {
  key: keyof Pick<DailyStat, 'vocabLearned' | 'flashcardsReviewed' | 'quizzesCompleted' | 'habitCheckIns'>;
  label: string;
  color: string;
  type: ActivityType;
}

const SERIES: Series[] = [
  { key: 'vocabLearned', label: 'Từ vựng', color: 'var(--series-vocab)', type: ActivityType.VOCAB_LEARNED },
  { key: 'flashcardsReviewed', label: 'Ôn tập', color: 'var(--series-flashcard)', type: ActivityType.FLASHCARD_REVIEWED },
  { key: 'quizzesCompleted', label: 'Quiz', color: 'var(--series-quiz)', type: ActivityType.QUIZ_COMPLETED },
  { key: 'habitCheckIns', label: 'Thói quen', color: 'var(--series-habit)', type: ActivityType.HABIT_CHECKIN },
];

const CHART_HEIGHT = 176;

export function ActivityChart({ data }: { data: DailyStat[] }): JSX.Element {
  const [hovered, setHovered] = useState<string | null>(null);

  const max = Math.max(1, ...data.map((d) => d.totalActivities));
  // Làm tròn trần lên bội số 5 để đường lưới rơi vào số đẹp.
  const ceiling = Math.ceil(max / 5) * 5;
  const gridValues = [0, ceiling / 2, ceiling];

  const hoveredDay = data.find((d) => d.date === hovered);

  return (
    <div>
      <Legend />

      {/*
        pt-3 để nhãn trục cao nhất (nằm ở mốc 100%, bị dịch lên nửa chiều cao chữ)
        không đè lên hàng legend phía trên.
      */}
      <div className="relative mt-3 flex gap-3 pt-3">
        {/* Trục giá trị — chỉ 3 mốc, đủ để ước lượng mà không làm rối */}
        <div className="relative w-7 shrink-0" style={{ height: CHART_HEIGHT }}>
          {gridValues.map((value) => (
            <span
              key={value}
              className="absolute right-0 -translate-y-1/2 text-[10px] tabular-nums text-slate-400"
              style={{ bottom: `${(value / ceiling) * 100}%` }}
            >
              {value}
            </span>
          ))}
        </div>

        <div className="relative min-w-0 flex-1">
          {/* Lưới nằm dưới cột, màu nhạt để không tranh chấp với dữ liệu */}
          <div className="pointer-events-none absolute inset-0" style={{ height: CHART_HEIGHT }}>
            {gridValues.map((value) => (
              <div
                key={value}
                className="absolute w-full border-t border-slate-100"
                style={{ bottom: `${(value / ceiling) * 100}%` }}
              />
            ))}
          </div>

          <div className="relative flex items-end gap-1 overflow-x-auto no-scrollbar" style={{ height: CHART_HEIGHT }}>
            {data.map((day) => (
              <DayColumn
                key={day.date}
                day={day}
                ceiling={ceiling}
                isHovered={hovered === day.date}
                dimmed={hovered !== null && hovered !== day.date}
                onHover={setHovered}
              />
            ))}
          </div>

          <div className="mt-1.5 flex gap-1">
            {data.map((day) => (
              <span
                key={day.date}
                className="min-w-0 flex-1 text-center text-[10px] tabular-nums text-slate-400"
              >
                {day.date.slice(8)}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Chi tiết ngày đang trỏ. Chiếm chỗ cố định để biểu đồ không nhảy khi rê chuột. */}
      <div className="mt-3 min-h-[42px] border-t border-slate-100 pt-3">
        {hoveredDay ? (
          <DayDetail day={hoveredDay} />
        ) : (
          <p className="text-xs text-slate-400">Chọn một cột để xem chi tiết từng ngày</p>
        )}
      </div>
    </div>
  );
}

function DayColumn({
  day,
  ceiling,
  isHovered,
  dimmed,
  onHover,
}: {
  day: DailyStat;
  ceiling: number;
  isHovered: boolean;
  dimmed: boolean;
  onHover: (date: string | null) => void;
}): JSX.Element {
  return (
    <div
      className="group relative flex h-full min-w-[22px] flex-1 cursor-default flex-col justify-end"
      onMouseEnter={() => onHover(day.date)}
      onMouseLeave={() => onHover(null)}
      onFocus={() => onHover(day.date)}
      onBlur={() => onHover(null)}
      tabIndex={0}
      role="img"
      aria-label={`${day.date}: ${day.totalActivities} hoạt động`}
    >
      {day.totalActivities > 0 && (
        <span
          className={`mb-1 text-center text-[10px] font-medium tabular-nums transition-colors ${
            isHovered ? 'text-slate-900' : 'text-slate-400'
          }`}
        >
          {day.totalActivities}
        </span>
      )}

      <div
        className="flex w-full flex-col justify-end transition-opacity"
        style={{
          height: `${(day.totalActivities / ceiling) * 100}%`,
          // Làm mờ vừa phải: đủ để nổi bật cột đang trỏ nhưng vẫn đọc được các cột còn lại
          opacity: dimmed ? 0.6 : 1,
        }}
      >
        {SERIES.map((series, index) => {
          const value = day[series.key];
          if (value === 0) return null;

          return (
            <div
              key={series.key}
              style={{
                height: `${(value / day.totalActivities) * 100}%`,
                backgroundColor: series.color,
                // Khe 2px giữa các đoạn để ranh giới rõ, không phụ thuộc vào màu
                marginBottom: index < SERIES.length - 1 ? 2 : 0,
              }}
              // Bo góc chỉ ở đoạn trên cùng của cột
              className={index === 0 ? 'rounded-t-[4px]' : ''}
            />
          );
        })}
      </div>
    </div>
  );
}

function DayDetail({ day }: { day: DailyStat }): JSX.Element {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
      <span className="text-xs font-medium text-slate-700">
        {new Date(`${day.date}T00:00:00Z`).toLocaleDateString('vi-VN', {
          weekday: 'long',
          day: 'numeric',
          month: 'numeric',
        })}
      </span>
      {SERIES.map((series) => (
        <span key={series.key} className="flex items-center gap-1.5 text-xs text-slate-500">
          <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: series.color }} aria-hidden />
          {series.label}: <span className="font-medium tabular-nums text-slate-700">{day[series.key]}</span>
        </span>
      ))}
    </div>
  );
}

/** Legend luôn hiện vì có 4 chuỗi — không để màu là cách duy nhất nhận biết. */
function Legend(): JSX.Element {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1.5">
      {SERIES.map((series) => (
        <span key={series.key} className="flex items-center gap-1.5 text-xs text-slate-500">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: series.color }} aria-hidden />
          {series.label}
        </span>
      ))}
    </div>
  );
}
