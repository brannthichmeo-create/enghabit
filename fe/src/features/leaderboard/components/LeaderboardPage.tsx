import { useState } from 'react';
import { Award, Crown, Flame, Layers, Medal, Sparkles, Trophy } from 'lucide-react';
import type { LeaderboardEntry, LeaderboardMetric, LeaderboardQueryInput } from '@enghabit/shared';
import { getErrorMessage } from '../../../shared/lib/api-client';
import { Card, EmptyState, ErrorMessage, PageHeader, SkeletonList } from '../../../shared/components/ui';
import { Avatar } from '../../../shared/components/Sidebar';
import { useT } from '../../../shared/i18n/language';
import { useLeaderboard } from '../leaderboard.hooks';

/**
 * Bảng xếp hạng người học.
 *
 * Hai trục lọc ĐỘC LẬP với nhau: tiêu chí xếp hạng (điểm học tập / hoạt động) và
 * khoảng thời gian (tuần / tháng / toàn thời gian) — không phải bốn bảng cố định, nên
 * chọn một tiêu chí không giới hạn khoảng thời gian nào cả.
 *
 * - **Điểm học tập (XP):** cùng công thức với cấp độ ở trang cá nhân, nên không bao
 *   giờ có chuyện "cấp của tôi nói một đằng, thứ hạng nói một nẻo".
 * - **Hoạt động:** tổng số lượt bất kể loại, không quy đổi qua XP. XP thiên vị hoạt
 *   động nặng điểm (một quiz = 20 XP = năm lượt ôn thẻ), nên đây là chỗ để người ôn
 *   đều đặn nhiều việc nhỏ so tài mà không bị lép vế.
 *
 * Cấp độ hiện cạnh tên luôn là cấp độ của CẢ HÀNH TRÌNH, không đổi theo hai trục lọc
 * trên — xem ghi chú ở `LeaderboardEntry.level`.
 *
 * Mặc định là tuần này chứ không phải toàn thời gian: bảng toàn thời gian gần như bất
 * động, người mới nhìn vào thấy mình ở đáy và không có cách nào leo lên trong tầm nhìn
 * vài ngày. Bảng theo tuần thì tuần nào cũng có cơ hội.
 */

const RANGE_LABELS: Record<LeaderboardQueryInput['range'], string> = {
  week: 'Tuần này',
  month: 'Tháng này',
  all: 'Từ trước tới nay',
};

const METRIC_LABELS: Record<LeaderboardMetric, string> = {
  xp: 'Điểm học tập',
  activities: 'Hoạt động',
};

const METRIC_ICONS: Record<LeaderboardMetric, typeof Sparkles> = {
  xp: Sparkles,
  activities: Layers,
};

/** Số người được đưa lên bục. Dưới ngần này thì bục trông trống trải, hiện danh sách thường. */
const PODIUM_SIZE = 3;

export function LeaderboardPage(): JSX.Element {
  const t = useT();
  const [range, setRange] = useState<LeaderboardQueryInput['range']>('week');
  const [metric, setMetric] = useState<LeaderboardMetric>('xp');
  const board = useLeaderboard(range, metric);

  const entries = board.data?.entries ?? [];
  const hasPodium = entries.length >= PODIUM_SIZE;
  const podium = hasPodium ? entries.slice(0, PODIUM_SIZE) : [];
  const rest = hasPodium ? entries.slice(PODIUM_SIZE) : entries;

  return (
    <div>
      <PageHeader
        title={t('Bảng xếp hạng')}
        description={t('So sánh điểm học tập với những người học khác')}
      />

      <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="flex gap-1 rounded-lg bg-sunken p-1" role="tablist" aria-label={t('Xếp theo')}>
          {(Object.keys(METRIC_LABELS) as LeaderboardMetric[]).map((key) => {
            const Icon = METRIC_ICONS[key];
            return (
              <button
                key={key}
                role="tab"
                aria-selected={metric === key}
                onClick={() => setMetric(key)}
                className={`flex items-center gap-1.5 rounded-md px-4 py-1.5 text-sm transition ${
                  metric === key ? 'bg-surface font-medium text-content shadow-sm' : 'text-content-soft'
                }`}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
                {t(METRIC_LABELS[key])}
              </button>
            );
          })}
        </div>

        <div className="flex gap-1 rounded-lg bg-sunken p-1" role="tablist" aria-label={t('Khoảng thời gian')}>
          {(Object.keys(RANGE_LABELS) as LeaderboardQueryInput['range'][]).map((key) => (
            <button
              key={key}
              role="tab"
              aria-selected={range === key}
              onClick={() => setRange(key)}
              className={`rounded-md px-4 py-1.5 text-sm transition ${
                range === key ? 'bg-surface font-medium text-content shadow-sm' : 'text-content-soft'
              }`}
            >
              {t(RANGE_LABELS[key])}
            </button>
          ))}
        </div>
      </div>

      {board.isLoading && <SkeletonList rows={5} />}
      {board.isError && <ErrorMessage>{getErrorMessage(board.error)}</ErrorMessage>}

      {board.data && entries.length === 0 && (
        <EmptyState
          icon={Trophy}
          title={t('Chưa ai có điểm trong khoảng này')}
          description={t('Học vài phút là bạn đứng đầu bảng ngay.')}
        />
      )}

      {/*
        Ba hạng đầu tách hẳn ra thành bục, không nằm chung danh sách nữa.
        `items-end` cộng với ô hạng nhất cao hơn tạo ra dáng bục thật — thứ hạng đọc
        được bằng CHIỀU CAO chứ không chỉ bằng màu, nên người mù màu vẫn thấy (R21).
        Thứ tự trên màn rộng là 2 – 1 – 3 như bục trao giải; màn hẹp xếp dọc 1 – 2 – 3
        theo đúng thứ tự đọc.
      */}
      {podium.length > 0 && (
        <div
          key={metric}
          className="mb-4 grid animate-fade-in gap-3 sm:grid-cols-3 sm:items-end"
        >
          {podium.map((entry) => (
            <PodiumCard key={entry.userId} entry={entry} metric={metric} />
          ))}
        </div>
      )}

      {rest.length > 0 && (
        <Card>
          <ul className="divide-y divide-line">
            {rest.map((entry) => (
              <li key={entry.userId}>
                <Row entry={entry} metric={metric} />
              </li>
            ))}
          </ul>

          {/* Người đang xem nằm ngoài top: kéo riêng xuống dưới, tách bằng đường kẻ đậm
              để không ai tưởng mình đang đứng ngay sau người cuối cùng của bảng. */}
          {board.data?.me && (
            <div className="mt-2 border-t-2 border-dashed border-line pt-2">
              <Row entry={board.data.me} metric={metric} />
            </div>
          )}
        </Card>
      )}

      {/* Người đang xem ngoài top mà danh sách dưới bục rỗng — vẫn phải thấy mình ở đâu */}
      {rest.length === 0 && board.data?.me && (
        <Card>
          <Row entry={board.data.me} metric={metric} />
        </Card>
      )}

      {board.data && board.data.totalRanked > 0 && (
        <p className="mt-3 text-xs text-on-page-muted">
          {t('{n} người có điểm trong khoảng này', { n: board.data.totalRanked })}
        </p>
      )}
    </div>
  );
}

/**
 * Kiểu trình bày cho từng bục.
 *
 * Dùng token có sẵn thay vì bịa ba màu huy chương mới: vàng của logo cho hạng nhất,
 * trung tính cho hạng nhì, xanh thương hiệu cho hạng ba (xem docs/color-rules.md R4).
 * Màu chỉ là lớp phụ — thứ hạng vẫn đọc được qua số, biểu tượng và chiều cao ô.
 */
const PODIUM_STYLES = {
  1: {
    icon: Crown,
    card: 'border-accent bg-accent-soft sm:order-2 sm:pb-7',
    badge: 'bg-accent text-ink',
    label: 'Hạng nhất',
  },
  2: {
    icon: Medal,
    card: 'border-line-strong bg-sunken sm:order-1',
    badge: 'bg-line-strong text-on-fill',
    label: 'Hạng nhì',
  },
  3: {
    icon: Award,
    card: 'border-brand/50 bg-brand-soft sm:order-3',
    badge: 'bg-brand text-on-brand',
    label: 'Hạng ba',
  },
} as const;

/**
 * Con số lớn hiển thị theo tiêu chí đang chọn, và câu chú thích cho con số còn lại.
 *
 * Tách hàm dùng chung cho cả `PodiumCard` và `Row` để hai nơi không lệch cách trình
 * bày khi thêm tiêu chí xếp hạng mới sau này.
 */
function primaryStat(
  entry: LeaderboardEntry,
  metric: LeaderboardMetric,
  t: ReturnType<typeof useT>,
): { value: number; unit: string; secondary: string } {
  if (metric === 'activities') {
    return { value: entry.activities, unit: t('lượt'), secondary: t('{n} XP', { n: entry.xp }) };
  }
  return { value: entry.xp, unit: 'XP', secondary: t('{n} lượt', { n: entry.activities }) };
}

function PodiumCard({
  entry,
  metric,
}: {
  entry: LeaderboardEntry;
  metric: LeaderboardMetric;
}): JSX.Element {
  const t = useT();
  const style = PODIUM_STYLES[entry.rank as 1 | 2 | 3] ?? PODIUM_STYLES[3];
  const Icon = style.icon;
  const stat = primaryStat(entry, metric, t);

  return (
    <div
      className={`relative flex flex-col items-center rounded-2xl border-2 px-4 pb-5 pt-7 text-center shadow-card ${style.card} ${
        entry.isMe ? 'ring-2 ring-brand ring-offset-2 ring-offset-page' : ''
      }`}
    >
      {/* Huy hiệu hạng nằm vắt lên mép trên để ô nào cũng có một điểm neo cho mắt */}
      <span
        className={`absolute -top-3.5 flex h-7 items-center gap-1 rounded-full px-2.5 text-xs font-bold ${style.badge}`}
      >
        <Icon className="h-3.5 w-3.5" aria-hidden />
        {entry.rank}
        <span className="sr-only">{t(style.label)}</span>
      </span>

      <Avatar name={entry.name} size={entry.rank === 1 ? 'lg' : 'md'} />

      <p className="mt-2 w-full truncate font-semibold text-content">{entry.name}</p>

      {entry.isMe && <span className="text-xs font-medium text-brand-strong">{t('bạn')}</span>}

      <p className="mt-1 text-xs text-content-muted">{t('Cấp {n}', { n: entry.level })}</p>

      <p className="mt-2.5 text-2xl font-bold leading-none tabular-nums text-content">{stat.value}</p>
      <p className="text-[11px] text-content-muted">{stat.unit}</p>

      <p className="mt-2 flex items-center justify-center gap-1 text-xs text-content-muted">
        <Flame className="h-3 w-3 shrink-0" aria-hidden />
        {t('{n} ngày', { n: entry.currentStreak })}
        <span aria-hidden>·</span>
        {stat.secondary}
      </p>
    </div>
  );
}

function Row({ entry, metric }: { entry: LeaderboardEntry; metric: LeaderboardMetric }): JSX.Element {
  const t = useT();
  const stat = primaryStat(entry, metric, t);

  return (
    <div className={`flex items-center gap-3 rounded-lg px-2 py-3 ${entry.isMe ? 'bg-brand-soft' : ''}`}>
      <span className="w-8 shrink-0 text-center text-sm font-bold tabular-nums text-content-muted">
        {entry.rank}
      </span>

      <Avatar name={entry.name} />

      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-x-2">
          <span className="truncate font-medium text-content">{entry.name}</span>
          <span className="rounded-full bg-sunken px-1.5 py-0.5 text-[10px] font-semibold text-content-muted">
            {t('Cấp {n}', { n: entry.level })}
          </span>
          {entry.isMe && <span className="text-xs font-medium text-brand-strong">{t('bạn')}</span>}
        </span>
        <span className="flex items-center gap-1 text-xs text-content-muted">
          <Flame className="h-3 w-3 shrink-0" aria-hidden />
          {t('{n} ngày', { n: entry.currentStreak })}
          <span aria-hidden>·</span>
          {stat.secondary}
        </span>
      </span>

      <span className="shrink-0 text-right">
        <span className="block text-lg font-bold tabular-nums text-content">{stat.value}</span>
        <span className="block text-[11px] text-content-muted">{stat.unit}</span>
      </span>
    </div>
  );
}
