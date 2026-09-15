import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Library } from 'lucide-react';
import { StudySource, type StudyGroup, type StudyMode } from '@enghabit/shared';
import { getErrorMessage } from '../../../shared/lib/api-client';
import { Button, EmptyState, ErrorMessage, PageHeader, SkeletonList } from '../../../shared/components/ui';
import { useBreadcrumbTail } from '../../../shared/components/Breadcrumb';
import { useT } from '../../../shared/i18n/language';
import { useMyStudySets, useStudySet } from '../../library/library.hooks';
import { StudySetCard } from '../../library/components/StudySetCard';
import { SessionSetup } from './SessionSetup';
import { StudySession } from './StudySession';

/**
 * Màn Học: chọn bộ thẻ → chọn nhóm → chọn chế độ → phiên → kết quả.
 *
 * Bộ thẻ nằm trên URL (`/learn?set=12`) để trang chi tiết bộ thẻ dẫn thẳng vào đây, và
 * tải lại trang vẫn đứng đúng bộ đang học.
 */
export function LearnPage(): JSX.Element {
  const [params, setParams] = useSearchParams();
  const setId = Number(params.get('set'));

  if (Number.isInteger(setId) && setId > 0) {
    return <LearnSet setId={setId} onChangeSet={() => setParams({})} />;
  }
  return <SetPicker onPick={(id) => setParams({ set: String(id) })} />;
}

function SetPicker({ onPick }: { onPick: (setId: number) => void }): JSX.Element {
  const t = useT();
  const mine = useMyStudySets();
  const withCards = (mine.data ?? []).filter((set) => set.cardCount > 0);

  return (
    <div>
      <PageHeader
        title={t('Học')}
        description={t('Chọn một bộ thẻ để học bằng flashcard hoặc trắc nghiệm')}
        action={
          <Link to="/library">
            <Button variant="secondary" icon={Library}>
              {t('Tìm trong Thư viện')}
            </Button>
          </Link>
        }
      />

      {mine.isLoading && <SkeletonList rows={3} />}
      {mine.isError && <ErrorMessage>{getErrorMessage(mine.error)}</ErrorMessage>}

      {mine.data && withCards.length === 0 && (
        <EmptyState
          icon={Library}
          title={t('Bạn chưa có bộ thẻ nào để học')}
          description={t('Mở một bộ thẻ công khai trong Thư viện rồi bấm Học, hoặc tự tạo bộ thẻ của riêng bạn.')}
        />
      )}

      {withCards.length > 0 && (
        <>
          <h2 className="mb-3 font-semibold text-on-page">{t('Bộ thẻ của tôi')}</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {withCards.map((set) => (
              <StudySetCard key={set.id} set={set} onSelect={() => onPick(set.id)} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function LearnSet({ setId, onChangeSet }: { setId: number; onChangeSet: () => void }): JSX.Element {
  const t = useT();
  const set = useStudySet(setId);
  const [session, setSession] = useState<{ group: StudyGroup; mode: StudyMode; key: number } | null>(null);

  useBreadcrumbTail(set.data?.name ?? null);

  if (set.isLoading) return <SkeletonList rows={3} />;

  if (set.isError || !set.data) {
    return (
      <EmptyState
        icon={Library}
        title={t('Không mở được bộ thẻ này')}
        description={t('Bộ thẻ không tồn tại, đã chuyển sang riêng tư hoặc đang bị chặn.')}
        action={
          <Button variant="secondary" icon={ArrowLeft} onClick={onChangeSet}>
            {t('Chọn bộ khác')}
          </Button>
        }
      />
    );
  }

  const data = set.data;

  if (session) {
    return (
      <StudySession
        key={session.key}
        source={StudySource.LEARN}
        setId={setId}
        group={session.group}
        mode={session.mode}
        onExit={() => setSession(null)}
      />
    );
  }

  return (
    <div>
      <PageHeader
        title={data.name}
        description={t('{n} thẻ · chọn nhóm và chế độ để bắt đầu', { n: data.cardCount })}
        action={
          <Button variant="secondary" icon={ArrowLeft} onClick={onChangeSet}>
            {t('Đổi bộ thẻ')}
          </Button>
        }
      />

      {data.cardCount === 0 ? (
        <EmptyState title={t('Bộ thẻ này chưa có thẻ nào')} />
      ) : (
        <SessionSetup
          counts={{
            NEW: data.progress.new,
            DUE: data.progress.due,
            OVERDUE: data.progress.overdue,
            WEAK: data.progress.weak,
          }}
          canMultipleChoice={data.canMultipleChoice}
          onStart={(group, mode) => setSession({ group, mode, key: Date.now() })}
        />
      )}
    </div>
  );
}
