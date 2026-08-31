import { useState } from 'react';

/**
 * Biểu đồ cột theo ngày cho các số liệu vận hành.
 *
 * Chỉ vẽ một đại lượng (`primary`) lên trục; đại lượng thứ hai chỉ hiện khi trỏ vào
 * một ngày. Cố ý không dùng hai trục tung: hai thang đo khác nhau trên cùng khung
 * hình khiến người đọc tưởng hai đường có quan hệ với nhau trong khi không phải.
 */

export interface TrendPoint {
  /** `YYYY-MM-DD` */
  date: string;
  primary: number;
  secondary: number;
}

const CHART_HEIGHT = 140;

export function TrendChart({
  points,
  primaryLabel,
  secondaryLabel,
  tone = 'brand',
}: {
  points: TrendPoint[];
  primaryLabel: string;
  secondaryLabel: string;
  tone?: 'brand' | 'danger';
}): JSX.Element {
  const [hovered, setHovered] = useState<string | null>(null);

  const max = Math.max(1, ...points.map((p) => p.primary));
  const ceiling = Math.ceil(max / 5) * 5 || 5;
  const active = points.find((p) => p.date === hovered) ?? points[points.length - 1];
  const barColor = tone === 'danger' ? 'bg-danger' : 'bg-brand';

  return (
    <div>
      <div className="flex gap-3">
        <div className="relative w-8 shrink-0" style={{ height: CHART_HEIGHT }}>
          {[0, ceiling / 2, ceiling].map((value) => (
            <span
              key={value}
              className="absolute right-0 -translate-y-1/2 text-[10px] tabular-nums text-content-muted"
              style={{ bottom: `${(value / ceiling) * 100}%` }}
            >
              {value}
            </span>
          ))}
        </div>

        <div className="relative min-w-0 flex-1">
          <div className="pointer-events-none absolute inset-0" style={{ height: CHART_HEIGHT }}>
            {[0, ceiling / 2, ceiling].map((value) => (
              <div
                key={value}
                className="absolute w-full border-t border-line"
                style={{ bottom: `${(value / ceiling) * 100}%` }}
              />
            ))}
          </div>

          <div className="relative flex items-end gap-[3px]" style={{ height: CHART_HEIGHT }}>
            {points.map((point) => (
              <div
                key={point.date}
                className="group flex h-full min-w-0 flex-1 cursor-default flex-col justify-end"
                onMouseEnter={() => setHovered(point.date)}
                onMouseLeave={() => setHovered(null)}
                onFocus={() => setHovered(point.date)}
                onBlur={() => setHovered(null)}
                tabIndex={0}
                role="img"
                aria-label={`${point.date}: ${point.primary} ${primaryLabel.toLowerCase()}, ${point.secondary} ${secondaryLabel.toLowerCase()}`}
              >
                <div
                  className={`w-full rounded-t-[4px] transition-opacity ${barColor} ${
                    hovered !== null && hovered !== point.date ? 'opacity-60' : ''
                  }`}
                  style={{ height: `${Math.max(point.primary === 0 ? 0 : 2, (point.primary / ceiling) * 100)}%` }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Chi tiết ngày đang trỏ, chiếm chỗ cố định để biểu đồ không nhảy */}
      <div className="mt-3 flex min-h-[20px] flex-wrap items-center gap-x-4 gap-y-1 border-t border-line pt-3 text-xs">
        {active && (
          <>
            <span className="font-medium text-content-soft">{formatDate(active.date)}</span>
            <span className="text-content-muted">
              {primaryLabel}: <span className="font-medium tabular-nums text-content">{active.primary}</span>
            </span>
            <span className="text-content-muted">
              {secondaryLabel}: <span className="font-medium tabular-nums text-content">{active.secondary}</span>
            </span>
            <span className="text-content-muted">
              {hovered === null ? '(ngày gần nhất — rê chuột để xem ngày khác)' : ''}
            </span>
          </>
        )}
      </div>
    </div>
  );
}

function formatDate(date: string): string {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString('vi-VN', {
    weekday: 'short',
    day: 'numeric',
    month: 'numeric',
  });
}
