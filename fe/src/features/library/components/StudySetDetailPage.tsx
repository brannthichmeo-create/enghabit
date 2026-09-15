import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Ban, Flag, GraduationCap, Library, Pencil, Share2, Trash2, Zap } from 'lucide-react';
import { FeatureKey, StudySetVisibility, type StudySetCard, type StudySetDetail } from '@enghabit/shared';
import { getErrorMessage } from '../../../shared/lib/api-client';
import { Badge, Button, Card, EmptyState, PageHeader, SkeletonList } from '../../../shared/components/ui';
import { useBreadcrumbTail } from '../../../shared/components/Breadcrumb';
import { useConfirm } from '../../../shared/components/ConfirmDialog';
import { useToast } from '../../../shared/components/Toast';
import { VOCAB_LEVEL_LABELS } from '../../../shared/lib/labels';
import { useLocale, useT } from '../../../shared/i18n/language';
import { useFeature } from '../../feature-flags/feature-flag.hooks';
import { useDeleteCard, useDeleteStudySet, useStudySet } from '../library.hooks';
import { authorLabel } from './StudySetCard';
import { CardForm, ReportStudySetModal, StudySetFormModal } from './StudySetForms';

/**
 * Chi tiết một bộ thẻ.
 *
 * Chủ bộ thẻ soạn thẻ, sửa, xoá, đổi chế độ. Người khác chỉ đọc, học, ôn nhanh, chia sẻ và
 * báo cáo. Bộ riêng tư của người khác không bao giờ tới được đây — backend trả 404.
 */
export function StudySetDetailPage(): JSX.Element {
  const t = useT();
  const navigate = useNavigate();
  const params = useParams();
  const setId = Number(params.id);
  const set = useStudySet(Number.isInteger(setId) && setId > 0 ? setId : null);

  // `/library/:id` mang id động nên không tra được từ bản đồ breadcrumb tĩnh.
  useBreadcrumbTail(set.data?.name ?? null);

  if (set.isLoading) return <SkeletonList rows={4} />;

  if (set.isError || !set.data) {
    return (
      <div>
        <Button variant="ghost" icon={ArrowLeft} onClick={() => navigate('/library')}>
          {t('Về Thư viện')}
        </Button>
        <div className="mt-4">
          <EmptyState
            icon={Library}
            title={t('Không tìm thấy bộ thẻ')}
            description={t('Bộ thẻ không tồn tại, đã chuyển sang riêng tư hoặc đang bị chặn.')}
          />
        </div>
      </div>
    );
  }

  return <Detail set={set.data} />;
}

function Detail({ set }: { set: StudySetDetail }): JSX.Element {
  const t = useT();
  const locale = useLocale();
  const navigate = useNavigate();
  const toast = useToast();
  const confirm = useConfirm();
  const learnEnabled = useFeature(FeatureKey.LEARN);
  const reviewEnabled = useFeature(FeatureKey.FLASHCARDS);
  const deleteSet = useDeleteStudySet();

  const [editing, setEditing] = useState(false);
  const [reporting, setReporting] = useState(false);

  const isPublic = set.visibility === StudySetVisibility.PUBLIC;
  const hasCards = set.cardCount > 0;

  const share = async (): Promise<void> => {
    const url = `${window.location.origin}/library/${set.id}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success(t('Đã sao chép liên kết bộ thẻ'));
    } catch {
      // Trình duyệt chặn clipboard — vẫn cho người dùng thấy liên kết để tự chép.
      toast.error(t('Không sao chép được. Liên kết: {url}', { url }));
    }
  };

  const remove = async (): Promise<void> => {
    const ok = await confirm({
      title: t('Xoá bộ thẻ "{name}"?', { name: set.name }),
      message: t('Toàn bộ thẻ và tiến độ học của mọi người trên bộ này sẽ mất, không khôi phục được.'),
      confirmLabel: t('Xoá bộ thẻ'),
      tone: 'danger',
    });
    if (!ok) return;
    deleteSet.mutate(set.id, {
      onSuccess: () => {
        toast.success(t('Đã xoá bộ thẻ'));
        navigate('/library?tab=mine');
      },
      onError: (err) => toast.error(getErrorMessage(err)),
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <Button variant="ghost" icon={ArrowLeft} onClick={() => navigate('/library')} className="mb-2">
          {t('Thư viện')}
        </Button>
        <PageHeader
          title={set.name}
          description={set.description ?? undefined}
          action={
            set.isOwner ? (
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" icon={Pencil} onClick={() => setEditing(true)}>
                  {t('Sửa')}
                </Button>
                <Button variant="danger" icon={Trash2} loading={deleteSet.isPending} onClick={() => void remove()}>
                  {t('Xoá')}
                </Button>
              </div>
            ) : undefined
          }
        />
        <div className="flex flex-wrap items-center gap-2 text-sm text-on-page-muted">
          <span>{t('Tác giả: {name}', { name: authorLabel(set, t) })}</span>
          <span aria-hidden>·</span>
          <span className="tabular-nums">{t('{n} thẻ', { n: set.cardCount })}</span>
          <span aria-hidden>·</span>
          <span>{t('Cập nhật {date}', { date: new Date(set.updatedAt).toLocaleDateString(locale) })}</span>
          <Badge>{t(VOCAB_LEVEL_LABELS[set.level])}</Badge>
          {set.isOwner && <Badge tone={isPublic ? 'green' : 'slate'}>{isPublic ? t('Công khai') : t('Riêng tư')}</Badge>}
        </div>
      </div>

      {set.block && (
        <Card className="border-danger/40">
          <p className="flex items-center gap-2 font-semibold text-danger">
            <Ban className="h-5 w-5" aria-hidden />
            {t('Bộ thẻ này đang bị chặn')}
          </p>
          <p className="mt-1 text-sm text-content-soft">{set.block.reason}</p>
          <p className="mt-2 text-xs text-content-muted">
            {t('Người khác không còn thấy bộ này. Bạn vẫn học và sửa được; quản trị viên sẽ xem lại khi bạn đã sửa.')}
          </p>
        </Card>
      )}

      <Card>
        <div className="flex flex-wrap gap-2">
          {learnEnabled && (
            <Button icon={GraduationCap} disabled={!hasCards} onClick={() => navigate(`/learn?set=${set.id}`)}>
              {t('Học')}
            </Button>
          )}
          {reviewEnabled && (
            <Button variant="secondary" icon={Zap} disabled={!hasCards} onClick={() => navigate(`/review?cram=${set.id}`)}>
              {t('Ôn nhanh')}
            </Button>
          )}
          {isPublic && !set.block && (
            <Button variant="secondary" icon={Share2} onClick={() => void share()}>
              {t('Chia sẻ')}
            </Button>
          )}
          {!set.isOwner && !set.author.isSystem && (
            set.hasPendingReport ? (
              <Badge tone="amber" icon={Flag}>
                {t('Đã báo cáo, đang chờ xử lý')}
              </Badge>
            ) : (
              <Button variant="ghost" icon={Flag} onClick={() => setReporting(true)}>
                {t('Báo cáo')}
              </Button>
            )
          )}
        </div>

        {hasCards && (
          <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-line pt-4 sm:grid-cols-5">
            <ProgressStat label={t('Thẻ mới')} value={set.progress.new} />
            <ProgressStat label={t('Tới hạn')} value={set.progress.due} />
            <ProgressStat label={t('Quá hạn')} value={set.progress.overdue} />
            <ProgressStat label={t('Thẻ yếu')} value={set.progress.weak} />
            <ProgressStat label={t('Đã thuộc')} value={set.progress.mastered} />
          </dl>
        )}
      </Card>

      <Cards set={set} />

      {editing && <StudySetFormModal open initial={set} onClose={() => setEditing(false)} />}
      {reporting && <ReportStudySetModal open setId={set.id} onClose={() => setReporting(false)} />}
    </div>
  );
}

function Cards({ set }: { set: StudySetDetail }): JSX.Element {
  const t = useT();
  const toast = useToast();
  const confirm = useConfirm();
  const deleteCard = useDeleteCard();
  const [editingId, setEditingId] = useState<number | null>(null);

  const remove = async (card: StudySetCard): Promise<void> => {
    const ok = await confirm({
      title: t('Xoá thẻ "{word}"?', { word: card.word }),
      message: t('Tiến độ học của thẻ này cũng mất theo.'),
      confirmLabel: t('Xoá thẻ'),
      tone: 'danger',
    });
    if (!ok) return;
    deleteCard.mutate(card.id, { onError: (err) => toast.error(getErrorMessage(err)) });
  };

  return (
    <Card>
      <h2 className="font-semibold text-content">{t('Thẻ trong bộ ({n})', { n: set.cardCount })}</h2>

      {set.isOwner && (
        <div className="mt-3 rounded-xl border border-dashed border-line p-3">
          <CardForm setId={set.id} />
        </div>
      )}

      {set.cards.length === 0 ? (
        <p className="mt-4 text-sm text-content-muted">
          {set.isOwner ? t('Thêm thẻ đầu tiên ở ô bên trên.') : t('Bộ thẻ này chưa có thẻ nào.')}
        </p>
      ) : (
        <ul className="mt-3 divide-y divide-line">
          {set.cards.map((card) =>
            editingId === card.id ? (
              <li key={card.id} className="py-3">
                <CardForm setId={set.id} card={card} onDone={() => setEditingId(null)} />
              </li>
            ) : (
              <li key={card.id} className="flex items-start justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="font-medium text-content">
                    {card.word}
                    {card.phonetic && <span className="ml-2 text-sm font-normal text-content-muted">{card.phonetic}</span>}
                  </p>
                  <p className="text-sm text-content-soft">{card.meaning}</p>
                  {card.example && <p className="mt-0.5 text-sm italic text-content-muted">"{card.example}"</p>}
                </div>
                {set.isOwner && (
                  <div className="flex shrink-0 gap-1">
                    <Button variant="ghost" size="sm" icon={Pencil} onClick={() => setEditingId(card.id)} aria-label={t('Sửa thẻ')} />
                    <Button variant="ghost" size="sm" icon={Trash2} onClick={() => void remove(card)} aria-label={t('Xoá thẻ')} />
                  </div>
                )}
              </li>
            ),
          )}
        </ul>
      )}
    </Card>
  );
}

function ProgressStat({ label, value }: { label: string; value: number }): JSX.Element {
  return (
    <div>
      <dt className="text-xs text-content-muted">{label}</dt>
      <dd className="text-lg font-semibold tabular-nums text-content">{value}</dd>
    </div>
  );
}
