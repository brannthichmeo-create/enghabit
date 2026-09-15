import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Check, History, Layers, X, Zap } from 'lucide-react';
import {
  StudyGroup,
  StudyMode,
  StudySource,
  type StudyGroup as StudyGroupType,
  type StudyMode as StudyModeType,
} from '@enghabit/shared';
import { getErrorMessage } from '../../../shared/lib/api-client';
import { Badge, Button, Card, EmptyState, ErrorMessage, PageHeader, Skeleton, SkeletonList } from '../../../shared/components/ui';
import { useBreadcrumbTail } from '../../../shared/components/Breadcrumb';
import { useLocale, useT } from '../../../shared/i18n/language';
import { useStudySet } from '../../library/library.hooks';
import { useReviewHistory, useStudyOverview, useStudyStats } from '../study.hooks';
import { SessionSetup } from './SessionSetup';
import { StudySession, formatDuration } from './StudySession';

type Tab = 'review' | 'history';

interface ActiveSession {
  source: StudySource;
  group: StudyGroupType;
  mode: StudyModeType;
  setId?: number;
  key: number;
}

/**
 * Màn Ôn tập: bốn nhóm thẻ trên MỌI bộ đang học, Cram Mode, thống kê và lịch sử.
 *
 * `/review?cram=12` mở thẳng Cram Mode của bộ thẻ 12 — trang chi tiết bộ thẻ dẫn vào đây.
 */
export function ReviewPage(): JSX.Element {
  const t = useT();
  const [params, setParams] = useSearchParams();
  const [tab, setTab] = useState<Tab>('review');
  const [session, setSession] = useState<ActiveSession | null>(null);

  const cramSetId = Number(params.get('cram'));
  const hasCramSet = Number.isInteger(cramSetId) && cramSetId > 0;

  if (session) {
    return (
      <StudySession
        key={session.key}
        source={session.source}
        setId={session.setId}
        group={session.group}
        mode={session.mode}
        onExit={() => setSession(null)}
      />
    );
  }

  if (hasCramSet) {
    return (
      <CramSetup
        setId={cramSetId}
        onCancel={() => setParams({})}
        onStart={(mode) =>
          setSession({ source: StudySource.CRAM, group: StudyGroup.ALL, mode, setId: cramSetId, key: Date.now() })
        }
      />
    );
  }

  return (
    <div>
      <PageHeader title={t('Ôn tập')} description={t('Ôn thẻ theo lịch lặp lại ngắt quãng trên mọi bộ bạn đang học')} />

      <div className="mb-4 flex gap-1 rounded-lg bg-sunken p-1" role="tablist" aria-label={t('Nội dung')}>
        {(
          [
            { key: 'review', label: 'Ôn tập', icon: Layers },
            { key: 'history', label: 'Lịch sử ôn', icon: History },
          ] as const
        ).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 rounded-md px-4 py-1.5 text-sm transition ${
              tab === key ? 'bg-surface font-medium text-content shadow-sm' : 'text-content-soft'
            }`}
          >
            <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
            {t(label)}
          </button>
        ))}
      </div>

      {tab === 'review' ? (
        <ReviewTab onStart={(next) => setSession({ ...next, key: Date.now() })} />
      ) : (
        <HistoryTab />
      )}
    </div>
  );
}

function ReviewTab({ onStart }: { onStart: (session: Omit<ActiveSession, 'key'>) => void }): JSX.Element {
  const t = useT();
  const locale = useLocale();
  const overview = useStudyOverview();
  const stats = useStudyStats();

  if (overview.isLoading) return <SkeletonList rows={2} />;
  if (overview.isError || !overview.data) return <ErrorMessage>{getErrorMessage(overview.error)}</ErrorMessage>;

  const data = overview.data;
  const nothingStarted = data.new + data.due + data.overdue + data.weak === 0 && data.nextReviewDate === null;

  return (
    <div className="space-y-4">
      {nothingStarted ? (
        <EmptyState
          icon={Layers}
          title={t('Bạn chưa học thẻ nào')}
          description={t('Học một bộ thẻ trước — thẻ đã học sẽ tự xuất hiện ở đây đúng ngày cần ôn.')}
        />
      ) : (
        <SessionSetup
          counts={{ NEW: data.new, DUE: data.due, OVERDUE: data.overdue, WEAK: data.weak }}
          // Ôn tập trộn nhiều bộ: thẻ thuộc bộ dưới 4 thẻ tự bị bỏ qua ở chế độ trắc nghiệm.
          canMultipleChoice
          onStart={(group, mode) => onStart({ source: StudySource.REVIEW, group, mode })}
        />
      )}

      {data.nextReviewDate && data.due + data.overdue === 0 && (
        <p className="text-sm text-on-page-muted">
          {t('Lần ôn kế tiếp: {date}', {
            date: new Date(`${data.nextReviewDate}T00:00:00`).toLocaleDateString(locale),
          })}
        </p>
      )}

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 className="flex items-center gap-2 font-semibold text-content">
              <Zap className="h-4 w-4 text-accent-ink" aria-hidden />
              {t('Ôn nhanh thẻ yếu')}
            </h2>
            <p className="mt-0.5 text-sm text-content-muted">
              {t('Cram Mode: luyện dồn các thẻ hay sai mà không làm đổi lịch ôn chính thức.')}
            </p>
          </div>
          <Button
            variant="secondary"
            icon={Zap}
            disabled={data.weak === 0}
            onClick={() => onStart({ source: StudySource.CRAM, group: StudyGroup.WEAK, mode: StudyMode.FLASHCARD })}
          >
            {t('Ôn nhanh ({n})', { n: data.weak })}
          </Button>
        </div>
      </Card>

      <Card>
        <h2 className="font-semibold text-content">{t('Thống kê')}</h2>
        {stats.isLoading && <Skeleton className="mt-3 h-[88px] w-full" />}
        {stats.isError && <ErrorMessage>{getErrorMessage(stats.error)}</ErrorMessage>}
        {stats.data && (
          <dl className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label={t('Lượt ôn')} value={String(stats.data.review.totalReviews)} />
            <Stat label={t('Độ chính xác')} value={`${stats.data.review.accuracy}%`} />
            <Stat label={t('Đã thuộc')} value={String(stats.data.review.mastered)} />
            <Stat label={t('Đang học')} value={String(stats.data.review.learning)} />
            <Stat label={t('Phiên học')} value={String(stats.data.learning.sessions)} />
            <Stat label={t('Thẻ đã học')} value={String(stats.data.learning.cardsLearned)} />
            <Stat label={t('Đúng khi học')} value={`${stats.data.learning.accuracy}%`} />
            <Stat label={t('Thời gian học')} value={formatDuration(stats.data.learning.timeMs, t)} />
          </dl>
        )}
      </Card>
    </div>
  );
}

function HistoryTab(): JSX.Element {
  const t = useT();
  const locale = useLocale();
  const [page, setPage] = useState(1);
  const history = useReviewHistory(page);

  if (history.isLoading) return <SkeletonList rows={3} />;
  if (history.isError || !history.data) return <ErrorMessage>{getErrorMessage(history.error)}</ErrorMessage>;

  const totalPages = Math.max(1, Math.ceil(history.data.total / history.data.pageSize));

  if (history.data.items.length === 0) {
    return <EmptyState icon={History} title={t('Chưa có lượt ôn nào')} />;
  }

  return (
    <>
      <Card className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-line text-left text-content-muted">
              <th className="pb-2 font-medium">{t('Thẻ')}</th>
              <th className="pb-2 font-medium">{t('Bộ thẻ')}</th>
              <th className="pb-2 font-medium">{t('Chế độ')}</th>
              <th className="pb-2 font-medium">{t('Kết quả')}</th>
              <th className="pb-2 pr-2 text-right font-medium">{t('Thời điểm')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {history.data.items.map((row) => (
              <tr key={row.id}>
                <td className="py-2.5">
                  <span className="block font-medium text-content">{row.word}</span>
                  <span className="block text-xs text-content-muted">{row.meaning}</span>
                </td>
                <td className="py-2.5 text-content-soft">{row.setName}</td>
                <td className="py-2.5 text-content-soft">
                  {row.mode === StudyMode.FLASHCARD ? t('Flashcard') : t('Trắc nghiệm')}
                </td>
                <td className="py-2.5">
                  {row.isCorrect ? (
                    <Badge tone="green" icon={Check}>
                      {t('Nhớ')}
                    </Badge>
                  ) : (
                    <Badge tone="red" icon={X}>
                      {t('Quên')}
                    </Badge>
                  )}
                </td>
                <td className="py-2.5 pr-2 text-right tabular-nums text-content-muted">
                  {new Date(row.reviewedAt).toLocaleString(locale)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-3">
          <Button variant="secondary" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
            {t('Trước')}
          </Button>
          <span className="text-sm tabular-nums text-on-page-muted">
            {t('Trang {page} / {total}', { page, total: totalPages })}
          </span>
          <Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
            {t('Sau')}
          </Button>
        </div>
      )}
    </>
  );
}

function CramSetup({
  setId,
  onCancel,
  onStart,
}: {
  setId: number;
  onCancel: () => void;
  onStart: (mode: StudyModeType) => void;
}): JSX.Element {
  const t = useT();
  const set = useStudySet(setId);

  useBreadcrumbTail(set.data ? t('Ôn nhanh: {name}', { name: set.data.name }) : null);

  if (set.isLoading) return <SkeletonList rows={2} />;
  if (set.isError || !set.data) {
    return (
      <EmptyState
        title={t('Không mở được bộ thẻ này')}
        description={t('Bộ thẻ không tồn tại, đã chuyển sang riêng tư hoặc đang bị chặn.')}
        action={
          <Button variant="secondary" onClick={onCancel}>
            {t('Quay lại')}
          </Button>
        }
      />
    );
  }

  return (
    <div>
      <PageHeader
        title={t('Ôn nhanh: {name}', { name: set.data.name })}
        description={t('Cram Mode: luyện dồn cả bộ mà không làm đổi lịch ôn chính thức.')}
        action={
          <Button variant="secondary" onClick={onCancel}>
            {t('Huỷ')}
          </Button>
        }
      />
      <Card>
        <p className="text-sm text-content-soft">{t('{n} thẻ, thứ tự ngẫu nhiên.', { n: set.data.cardCount })}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button icon={Layers} disabled={set.data.cardCount === 0} onClick={() => onStart(StudyMode.FLASHCARD)}>
            {t('Flashcard')}
          </Button>
          <Button
            variant="secondary"
            disabled={!set.data.canMultipleChoice}
            onClick={() => onStart(StudyMode.MULTIPLE_CHOICE)}
          >
            {t('Trắc nghiệm')}
          </Button>
        </div>
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <div>
      <dt className="text-xs text-content-muted">{label}</dt>
      <dd className="font-semibold tabular-nums text-content">{value}</dd>
    </div>
  );
}
