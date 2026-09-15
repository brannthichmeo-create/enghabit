import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Compass, FileSpreadsheet, FolderOpen, Library, Plus, Search } from 'lucide-react';
import { STUDY_SET_SEARCH_MAX_LENGTH } from '@enghabit/shared';
import { getErrorMessage } from '../../../shared/lib/api-client';
import { Button, EmptyState, ErrorMessage, Input, PageHeader, SkeletonList } from '../../../shared/components/ui';
import { useT } from '../../../shared/i18n/language';
import { useMyStudySets, useStudySetSearch } from '../library.hooks';
import { StudySetCard } from './StudySetCard';
import { StudySetFormModal } from './StudySetForms';
import { ImportCardsModal } from './ImportCardsModal';

type Tab = 'discover' | 'mine';

const TABS: { key: Tab; label: string; icon: typeof Compass }[] = [
  { key: 'discover', label: 'Khám phá', icon: Compass },
  { key: 'mine', label: 'Của tôi', icon: FolderOpen },
];

/**
 * Thư viện bộ thẻ — tab Khám phá (bộ công khai) và tab Của tôi (bộ tự tạo).
 *
 * Tab nằm trên URL (`?tab=mine`) để xoá bộ thẻ xong quay về đúng tab của mình.
 */
export function LibraryPage(): JSX.Element {
  const t = useT();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const tab: Tab = params.get('tab') === 'mine' ? 'mine' : 'discover';
  const [creating, setCreating] = useState(false);
  const [importing, setImporting] = useState(false);

  return (
    <div>
      <PageHeader
        title={t('Thư viện')}
        description={t('Khám phá bộ thẻ công khai hoặc tự tạo bộ thẻ của riêng bạn')}
        action={
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" icon={FileSpreadsheet} onClick={() => setImporting(true)}>
              {t('Nhập từ file')}
            </Button>
            <Button icon={Plus} onClick={() => setCreating(true)}>
              {t('Tạo bộ thẻ')}
            </Button>
          </div>
        }
      />

      <div className="mb-4 flex gap-1 rounded-lg bg-sunken p-1" role="tablist" aria-label={t('Loại danh sách')}>
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            role="tab"
            aria-selected={tab === key}
            onClick={() => setParams(key === 'discover' ? {} : { tab: key })}
            className={`flex items-center gap-1.5 rounded-md px-4 py-1.5 text-sm transition ${
              tab === key ? 'bg-surface font-medium text-content shadow-sm' : 'text-content-soft'
            }`}
          >
            <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
            {t(label)}
          </button>
        ))}
      </div>

      {tab === 'discover' ? (
        <DiscoverTab />
      ) : (
        <MineTab onCreate={() => setCreating(true)} onImport={() => setImporting(true)} />
      )}

      {creating && (
        <StudySetFormModal open onClose={() => setCreating(false)} onSaved={(set) => navigate(`/library/${set.id}`)} />
      )}
      {importing && <ImportCardsModal open onClose={() => setImporting(false)} />}
    </div>
  );
}

function DiscoverTab(): JSX.Element {
  const t = useT();
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebounced(search.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  const sets = useStudySetSearch({ page, search: debounced || undefined });
  const totalPages = sets.data ? Math.max(1, Math.ceil(sets.data.total / sets.data.pageSize)) : 1;

  return (
    <section>
      <label className="relative mb-4 block max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-content-muted" aria-hidden />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          maxLength={STUDY_SET_SEARCH_MAX_LENGTH}
          placeholder={t('Tìm theo tên hoặc mô tả bộ thẻ')}
          aria-label={t('Tìm bộ thẻ')}
          className="pl-9"
        />
      </label>

      {sets.isLoading && <SkeletonList rows={3} />}
      {sets.isError && <ErrorMessage>{getErrorMessage(sets.error)}</ErrorMessage>}

      {sets.data && sets.data.items.length === 0 && (
        <EmptyState
          icon={Library}
          title={debounced ? t('Không tìm thấy bộ thẻ nào') : t('Chưa có bộ thẻ công khai nào')}
          description={debounced ? t('Thử từ khoá khác, hoặc tự tạo một bộ thẻ.') : undefined}
        />
      )}

      {sets.data && sets.data.items.length > 0 && (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {sets.data.items.map((set) => (
              <StudySetCard key={set.id} set={set} />
            ))}
          </div>

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
      )}
    </section>
  );
}

function MineTab({ onCreate, onImport }: { onCreate: () => void; onImport: () => void }): JSX.Element {
  const t = useT();
  const mine = useMyStudySets();

  if (mine.isLoading) return <SkeletonList rows={3} />;
  if (mine.isError) return <ErrorMessage>{getErrorMessage(mine.error)}</ErrorMessage>;

  if (!mine.data || mine.data.length === 0) {
    return (
      <EmptyState
        icon={FolderOpen}
        title={t('Bạn chưa tạo bộ thẻ nào')}
        description={t('Tạo bộ thẻ riêng để học đúng những từ bạn cần.')}
        action={
          <div className="flex flex-wrap justify-center gap-2">
            <Button variant="secondary" icon={FileSpreadsheet} onClick={onImport}>
              {t('Nhập từ file')}
            </Button>
            <Button icon={Plus} onClick={onCreate}>
              {t('Tạo bộ thẻ')}
            </Button>
          </div>
        }
      />
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {mine.data.map((set) => (
        <StudySetCard key={set.id} set={set} />
      ))}
    </div>
  );
}
