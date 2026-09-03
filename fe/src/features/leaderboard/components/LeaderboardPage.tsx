import { useState } from 'react';
import { Flame, Trophy } from 'lucide-react';
import type { LeaderboardEntry, LeaderboardQueryInput } from '@enghabit/shared';
import { getErrorMessage } from '../../../shared/lib/api-client';
import { Card, EmptyState, ErrorMessage, PageHeader, SkeletonList } from '../../../shared/components/ui';
import { Avatar } from '../../../shared/components/Sidebar';
import { useT } from '../../../shared/i18n/language';
import { useLeaderboard } from '../leaderboard.hooks';

/**
 * Bảng xếp hạng người học.
 *
 * Điểm xếp hạng là XP — cùng con số với "Tổng điểm" và cấp độ ở trang cá nhân, nên
 * không bao giờ có chuyện hai chỗ nói hai kiểu.
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

export function LeaderboardPage(): JSX.Element {
  const t = useT();
  const [range, setRange] = useState<LeaderboardQueryInput['range']>('week');
  const board = useLeaderboard(range);

  return (
    <div>
      <PageHeader
        title={t('Bảng xếp hạng')}
        description={t('So sánh điểm học tập với những người học khác')}
      />

      <div className="mb-4 flex gap-1 rounded-lg bg-sunken p-1" role="tablist" aria-label={t('Khoảng thời gian')}>
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

      {board.isLoading && <SkeletonList rows={5} />}
      {board.isError && <ErrorMessage>{getErrorMessage(board.error)}</ErrorMessage>}

      {board.data && board.data.entries.length === 0 && (
        <EmptyState
          icon={Trophy}
          title={t('Chưa ai có điểm trong khoảng này')}
          description={t('Học vài phút là bạn đứng đầu bảng ngay.')}
        />
      )}

      {board.data && board.data.entries.length > 0 && (
        <Card>
          <ul className="divide-y divide-line">
            {board.data.entries.map((entry) => (
              <li key={entry.userId}>
                <Row entry={entry} />
              </li>
            ))}
          </ul>

          {/* Người đang xem nằm ngoài top: kéo riêng xuống dưới, tách bằng đường kẻ đậm
              để không ai tưởng mình đang đứng ngay sau người cuối cùng của bảng. */}
          {board.data.me && (
            <div className="mt-2 border-t-2 border-dashed border-line pt-2">
              <Row entry={board.data.me} />
            </div>
          )}
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

/** Ba hạng đầu có màu riêng — đủ để nhận ra ngay mà không cần thêm biểu tượng cúp. */
const MEDALS: Record<number, string> = {
  1: 'bg-accent text-ink',
  2: 'bg-sunken text-content',
  3: 'bg-brand-soft text-brand-strong',
};

function Row({ entry }: { entry: LeaderboardEntry }): JSX.Element {
  const t = useT();

  return (
    <div
      className={`flex items-center gap-3 rounded-lg px-2 py-3 ${
        entry.isMe ? 'bg-brand-soft' : ''
      }`}
    >
      <span
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold tabular-nums ${
          MEDALS[entry.rank] ?? 'text-content-muted'
        }`}
      >
        {entry.rank}
      </span>

      <Avatar name={entry.name} />

      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="truncate font-medium text-content">{entry.name}</span>
          {entry.isMe && <span className="text-xs font-medium text-brand-strong">{t('bạn')}</span>}
        </span>
        <span className="flex items-center gap-1 text-xs text-content-muted">
          <Flame className="h-3 w-3" aria-hidden />
          {t('{n} ngày', { n: entry.currentStreak })}
          <span aria-hidden>·</span>
          {t('{n} lượt', { n: entry.activities })}
        </span>
      </span>

      <span className="shrink-0 text-right">
        <span className="block text-lg font-bold tabular-nums text-content">{entry.xp}</span>
        <span className="block text-[11px] text-content-muted">XP</span>
      </span>
    </div>
  );
}
