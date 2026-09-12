import { useState } from 'react';
import { useLocale, useT } from '../../../shared/i18n/language';

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
  const locale = useLocale();
  const t = useT();
  const [hovered, setHovered] = useState<string | null>(null);

  const max = Math.max(1, ...points.map((p) => p.primary));

  // Trần luôn là số CHẴN, vì trục chỉ có ba mốc [0, trần/2, trần] và các đại lượng ở
  // đây đều là số đếm — làm tròn theo bội số 5 như bản cũ thì max = 15 cho ra mốc giữa
  // "7,5 hoạt động", một con số không tồn tại.
  const ceiling = Math.max(2, Math.ceil(max / 2) * 2);
  const step = labelStep(points.length);
  const active = points.find((p) => p.date === hovered) ?? points[points.length - 1];
  const barColor = tone === 'danger' ? 'bg-danger' : 'bg-brand';

  return (
    <div>
      <div className="flex gap-3">
        {/*
          Nhãn trục tung phải nằm TRONG khung, không được thò ra ngoài.

          `bottom: B%` đặt MÉP DƯỚI của nhãn ở mốc B, nên nhãn trên cùng (B = 100%)
          nằm trọn phía trên khung; `-translate-y-1/2` của bản cũ còn đẩy nó lên thêm
          nửa dòng nữa, thành ra nó đè lên tiêu đề mục phía trên.

          Dịch xuống đúng bằng tỉ lệ của chính mốc đó là vừa khít: mốc trên cùng dịch
          100% (tụt hẳn xuống dưới đường kẻ), mốc giữa dịch 50% (canh giữa đường kẻ),
          mốc 0 không dịch (nằm ngay trên đường đáy).
        */}
        <div className="relative w-8 shrink-0" style={{ height: CHART_HEIGHT }}>
          {[0, ceiling / 2, ceiling].map((value) => (
            <span
              key={value}
              className="absolute right-0 text-[10px] tabular-nums text-content-muted"
              style={{
                bottom: `${(value / ceiling) * 100}%`,
                transform: `translateY(${(value / ceiling) * 100}%)`,
              }}
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

          {/*
            Trục hoành. Dùng ĐÚNG cấu trúc flex của hàng cột phía trên (`flex-1` cộng
            `gap-[3px]`) nên mỗi nhãn tự nằm thẳng dưới cột của nó, không cần tính toạ độ.

            `aria-hidden`: mỗi cột đã có `aria-label` đầy đủ ngày tháng rồi, để trình đọc
            màn hình đọc thêm dãy ngày trần trụi này chỉ làm nhiễu.
          */}
          <div className="mt-1.5 flex gap-[3px]" aria-hidden>
            {points.map((point, index) => (
              <div
                key={point.date}
                className="min-w-0 flex-1 whitespace-nowrap text-center text-[10px] tabular-nums text-content-muted"
              >
                {isLabelled(index, points.length, step) ? formatAxisDate(point.date) : ''}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Chi tiết ngày đang trỏ, chiếm chỗ cố định để biểu đồ không nhảy */}
      <div className="mt-3 flex min-h-[20px] flex-wrap items-center gap-x-4 gap-y-1 border-t border-line pt-3 text-xs">
        {active && (
          <>
            <span className="font-medium text-content-soft">{formatDate(active.date, locale)}</span>
            <span className="text-content-muted">
              {primaryLabel}: <span className="font-medium tabular-nums text-content">{active.primary}</span>
            </span>
            <span className="text-content-muted">
              {secondaryLabel}: <span className="font-medium tabular-nums text-content">{active.secondary}</span>
            </span>
            <span className="text-content-muted">
              {hovered === null ? t('(ngày gần nhất — rê chuột để xem ngày khác)') : ''}
            </span>
          </>
        )}
      </div>
    </div>
  );
}

/** Số nhãn trục hoành hiển thị được mà không chồng lên nhau, ở bề ngang thường gặp. */
const MAX_AXIS_LABELS = 10;

/** Cứ mấy cột thì ghi một nhãn. 10 ngày ghi đủ; 90 ngày thì cách 9 cột một nhãn. */
function labelStep(count: number): number {
  return Math.max(1, Math.ceil(count / MAX_AXIS_LABELS));
}

/**
 * Đếm NGƯỢC từ cột cuối, không phải xuôi từ cột đầu.
 *
 * Nhờ vậy cột mới nhất — cột người ta nhìn trước tiên — luôn có nhãn, và khoảng cách
 * giữa các nhãn vẫn đều. Đếm xuôi thì cột cuối chỉ có nhãn khi số cột chia hết cho
 * bước nhảy, tức là hên xui.
 */
function isLabelled(index: number, count: number, step: number): boolean {
  return (count - 1 - index) % step === 0;
}

/**
 * Ngày trên trục hoành, luôn `dd/MM`.
 *
 * Cắt thẳng từ chuỗi `YYYY-MM-DD` chứ không qua `new Date`: chuỗi này là NGÀY LOCAL
 * của người dùng, không phải một mốc thời gian. Đưa qua Date rồi format sẽ dịch theo
 * múi giờ của trình duyệt — máy ở múi giờ âm sẽ hiện lùi một ngày.
 */
function formatAxisDate(date: string): string {
  const [, month, day] = date.split('-');
  return `${day}/${month}`;
}

function formatDate(date: string, locale: string): string {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString(locale, {
    weekday: 'short',
    day: 'numeric',
    month: 'numeric',
    // Đọc lại đúng múi giờ đã dùng lúc dựng Date ở trên. Thiếu dòng này thì trình
    // duyệt format theo múi giờ máy: máy ở UTC-5 sẽ hiện ngày 05 cho chuỗi "…-06".
    timeZone: 'UTC',
  });
}
