import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Globe, Library, Pencil, Trash2 } from 'lucide-react';
import { getErrorMessage } from '../../../shared/lib/api-client';
import { Badge, Button, Card, EmptyState, PageHeader, SkeletonList } from '../../../shared/components/ui';
import { useBreadcrumbTail } from '../../../shared/components/Breadcrumb';
import { useConfirm } from '../../../shared/components/ConfirmDialog';
import { useToast } from '../../../shared/components/Toast';
import { VOCAB_LEVEL_LABELS } from '../../../shared/lib/labels';
import { useLocale, useT } from '../../../shared/i18n/language';
import { CardFormView, StudySetFormDialog } from '../../library/components/StudySetForms';
import {
  useCreateVocabulary,
  useDeleteTopic,
  useDeleteVocabulary,
  useTopic,
  useTopicVocabulary,
  useUpdateTopic,
  useUpdateVocabulary,
} from '../admin.hooks';
import type { Topic, Vocabulary } from '../admin.api';

/**
 * Chi tiết một bộ thẻ "Hệ thống" — cùng bố cục với trang chi tiết bộ thẻ ở Thư viện, bớt
 * đi phần của người học (học, ôn, tiến độ, báo cáo): quản trị viên soạn nội dung, không học.
 */
export function AdminContentSetPage(): JSX.Element {
  const t = useT();
  const navigate = useNavigate();
  const params = useParams();
  const id = Number(params.id);
  const topicId = Number.isInteger(id) && id > 0 ? id : null;
  const topic = useTopic(topicId);
  const cards = useTopicVocabulary(topicId);

  // `/admin/content/:id` mang id động nên không tra được từ bản đồ breadcrumb tĩnh.
  useBreadcrumbTail(topic.data?.name ?? null);

  if (topic.isLoading) return <SkeletonList rows={4} />;

  if (topic.isError || !topic.data) {
    return (
      <div>
        <Button variant="ghost" icon={ArrowLeft} onClick={() => navigate('/admin/content')}>
          {t('Nội dung học tập')}
        </Button>
        <div className="mt-4">
          <EmptyState icon={Library} title={t('Không tìm thấy bộ thẻ')} />
        </div>
      </div>
    );
  }

  return <Detail topic={topic.data} cards={cards.data} cardsLoading={cards.isLoading} />;
}

function Detail({
  topic,
  cards,
  cardsLoading,
}: {
  topic: Topic;
  cards: Vocabulary[] | undefined;
  cardsLoading: boolean;
}): JSX.Element {
  const t = useT();
  const locale = useLocale();
  const navigate = useNavigate();
  const toast = useToast();
  const confirm = useConfirm();
  const updateTopic = useUpdateTopic();
  const deleteTopic = useDeleteTopic();
  const [editing, setEditing] = useState(false);

  const cardCount = cards?.length ?? 0;

  const remove = async (): Promise<void> => {
    const ok = await confirm({
      title: t('Xoá bộ thẻ "{name}"?', { name: topic.name }),
      message: t('Toàn bộ thẻ và tiến độ học của mọi người trên bộ này sẽ mất, không khôi phục được.'),
      confirmLabel: t('Xoá bộ thẻ'),
      tone: 'danger',
    });
    if (!ok) return;
    deleteTopic.mutate(topic.id, {
      onSuccess: () => {
        toast.success(t('Đã xoá bộ thẻ'));
        navigate('/admin/content');
      },
      onError: (err) => toast.error(getErrorMessage(err)),
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <Button variant="ghost" icon={ArrowLeft} onClick={() => navigate('/admin/content')} className="mb-2">
          {t('Nội dung học tập')}
        </Button>
        <PageHeader
          title={topic.name}
          description={topic.description ?? undefined}
          action={
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" icon={Pencil} onClick={() => setEditing(true)}>
                {t('Sửa')}
              </Button>
              <Button variant="danger" icon={Trash2} loading={deleteTopic.isPending} onClick={() => void remove()}>
                {t('Xoá')}
              </Button>
            </div>
          }
        />
        <div className="flex flex-wrap items-center gap-2 text-sm text-on-page-muted">
          <span>{t('Tác giả: {name}', { name: t('Hệ thống') })}</span>
          <span aria-hidden>·</span>
          <span className="tabular-nums">{t('{n} thẻ', { n: cardCount })}</span>
          <span aria-hidden>·</span>
          <span>{t('Cập nhật {date}', { date: new Date(topic.updatedAt).toLocaleDateString(locale) })}</span>
          <Badge>{t(VOCAB_LEVEL_LABELS[topic.level])}</Badge>
          <Badge tone="green" icon={Globe}>
            {t('Công khai')}
          </Badge>
        </div>
        <p className="mt-1.5 text-xs text-on-page-muted">
          {t('Mọi người học thấy bộ này trong Thư viện. Thêm, sửa hay xoá thẻ ở đây là bên đó đổi theo ngay.')}
        </p>
      </div>

      <Cards topicId={topic.id} cards={cards} loading={cardsLoading} />

      {editing && (
        <StudySetFormDialog
          open
          publicOnly
          initial={topic}
          onClose={() => setEditing(false)}
          onSubmit={async ({ name, description, level }) => {
            await updateTopic.mutateAsync({ id: topic.id, input: { name, description, level } });
          }}
        />
      )}
    </div>
  );
}

function Cards({
  topicId,
  cards,
  loading,
}: {
  topicId: number;
  cards: Vocabulary[] | undefined;
  loading: boolean;
}): JSX.Element {
  const t = useT();
  const toast = useToast();
  const confirm = useConfirm();
  const createCard = useCreateVocabulary();
  const updateCard = useUpdateVocabulary();
  const deleteCard = useDeleteVocabulary();
  const [editingId, setEditingId] = useState<number | null>(null);

  const remove = async (card: Vocabulary): Promise<void> => {
    const ok = await confirm({
      title: t('Xoá thẻ "{word}"?', { word: card.word }),
      message: t('Tiến độ học của mọi người trên thẻ này cũng mất theo.'),
      confirmLabel: t('Xoá thẻ'),
      tone: 'danger',
    });
    if (!ok) return;
    deleteCard.mutate(card.id, { onError: (err) => toast.error(getErrorMessage(err)) });
  };

  return (
    <Card>
      <h2 className="font-semibold text-content">{t('Thẻ trong bộ ({n})', { n: cards?.length ?? 0 })}</h2>

      <div className="mt-3 rounded-xl border border-dashed border-line p-3">
        <CardFormView
          onSubmit={async (input) => {
            await createCard.mutateAsync({ topicId, ...input });
          }}
        />
      </div>

      {loading ? (
        <div className="mt-4">
          <SkeletonList rows={3} />
        </div>
      ) : !cards || cards.length === 0 ? (
        <p className="mt-4 text-sm text-content-muted">{t('Thêm thẻ đầu tiên ở ô bên trên.')}</p>
      ) : (
        <ul className="mt-3 divide-y divide-line">
          {cards.map((card) =>
            editingId === card.id ? (
              <li key={card.id} className="py-3">
                <CardFormView
                  card={card}
                  onDone={() => setEditingId(null)}
                  onSubmit={async (input) => {
                    await updateCard.mutateAsync({ id: card.id, input });
                  }}
                />
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
                <div className="flex shrink-0 gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={Pencil}
                    onClick={() => setEditingId(card.id)}
                    aria-label={t('Sửa thẻ')}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={Trash2}
                    onClick={() => void remove(card)}
                    aria-label={t('Xoá thẻ')}
                  />
                </div>
              </li>
            ),
          )}
        </ul>
      )}
    </Card>
  );
}
