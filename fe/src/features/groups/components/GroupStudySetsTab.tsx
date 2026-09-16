import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Globe, Layers, Lock, Plus, Trash2, Users } from 'lucide-react';
import {
  StudySetVisibility,
  type GroupStudySetRow,
  type StudySetSummary,
} from '@enghabit/shared';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorMessage,
  SkeletonList,
} from '../../../shared/components/ui';
import { Modal } from '../../../shared/components/Modal';
import { useToast } from '../../../shared/components/Toast';
import { useConfirm } from '../../../shared/components/ConfirmDialog';
import { getErrorMessage } from '../../../shared/lib/api-client';
import { VOCAB_LEVEL_LABELS } from '../../../shared/lib/labels';
import { useLocale, useT } from '../../../shared/i18n/language';
import { useMyStudySets } from '../../library/library.hooks';
import { useGroupStudySets, useShareStudySet, useUnshareStudySet } from '../group.hooks';

/**
 * Bộ thẻ được chia sẻ trong nhóm.
 *
 * Chỉ TRƯỞNG NHÓM thêm và gỡ; mọi thành viên xem và học được. Bộ thẻ KHÔNG bị nhân
 * bản: nó vẫn là bộ gốc trong Thư viện của chủ, chia sẻ chỉ mở thêm quyền đọc cho
 * thành viên nhóm. Vì vậy trong nhóm bộ nào cũng mang nhãn "Nội bộ", còn trong Thư
 * viện thì chế độ công khai / riêng tư của nó giữ nguyên như cũ.
 */
export function GroupStudySetsTab({
  groupId,
  isLeader,
}: {
  groupId: number;
  isLeader: boolean;
}): JSX.Element {
  const t = useT();
  const [picking, setPicking] = useState(false);

  const sets = useGroupStudySets(groupId);

  return (
    <div>
      {isLeader && (
        <div className="mb-4">
          <Button icon={Plus} onClick={() => setPicking(true)}>
            {t('Chia sẻ bộ thẻ vào nhóm')}
          </Button>
          <p className="mt-1.5 text-xs text-content-muted">
            {t('Chỉ trưởng nhóm chia sẻ được. Chọn trong các bộ thẻ bạn tự tạo ở Thư viện.')}
          </p>
        </div>
      )}

      <PickSetModal
        groupId={groupId}
        shared={sets.data ?? []}
        open={picking}
        onClose={() => setPicking(false)}
      />

      {sets.isLoading && <SkeletonList rows={3} />}
      {sets.isError && <ErrorMessage>{getErrorMessage(sets.error)}</ErrorMessage>}

      {sets.data?.length === 0 && (
        <EmptyState
          icon={Layers}
          title={t('Nhóm chưa có bộ thẻ nào')}
          description={
            isLeader
              ? t('Chia sẻ một bộ thẻ của bạn để cả nhóm cùng học.')
              : t('Khi trưởng nhóm chia sẻ bộ thẻ, bộ đó sẽ hiện ở đây cho cả nhóm cùng học.')
          }
        />
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {sets.data?.map((set) => (
          <SharedSetCard key={set.setId} groupId={groupId} set={set} isLeader={isLeader} />
        ))}
      </div>
    </div>
  );
}

/** Một bộ thẻ trong nhóm. Bấm vào mở đúng trang chi tiết bộ thẻ của Thư viện. */
function SharedSetCard({
  groupId,
  set,
  isLeader,
}: {
  groupId: number;
  set: GroupStudySetRow;
  isLeader: boolean;
}): JSX.Element {
  const t = useT();
  const locale = useLocale();
  const toast = useToast();
  const confirm = useConfirm();
  const unshare = useUnshareStudySet();

  return (
    <Card className="flex h-full flex-col">
      <div className="flex items-start justify-between gap-2">
        <Link to={`/library/${set.setId}`} className="min-w-0 font-semibold text-content">
          {set.name}
        </Link>
        <Badge>{t(VOCAB_LEVEL_LABELS[set.level])}</Badge>
      </div>

      <p className="mt-1 text-xs text-content-muted">
        {t('{name} chia sẻ ngày {date}', {
          name: set.sharedByName ?? t('Người dùng'),
          date: new Date(set.sharedAt).toLocaleDateString(locale),
        })}
      </p>

      {set.description && (
        <p className="mt-2 line-clamp-2 text-sm text-content-soft">{set.description}</p>
      )}

      <div className="mt-auto flex flex-wrap items-center gap-2 pt-3">
        <span className="text-xs tabular-nums text-content-muted">
          {t('{n} thẻ', { n: set.cardCount })}
        </span>
        {/* Trong nhóm, bộ nào cũng là nội bộ — kể cả bộ đang công khai ở Thư viện. */}
        <Badge tone="brand" icon={Users}>
          {t('Nội bộ')}
        </Badge>
        {/* Chế độ ở Thư viện chỉ hiện cho chủ bộ thẻ: người khác không sửa được nó nên
            biết thêm cũng không làm gì, mà lại lộ bộ riêng tư của người ta có tồn tại. */}
        {set.isOwner &&
          (set.visibility === StudySetVisibility.PUBLIC ? (
            <Badge tone="green" icon={Globe}>
              {t('Công khai ở Thư viện')}
            </Badge>
          ) : (
            <Badge icon={Lock}>{t('Riêng tư ở Thư viện')}</Badge>
          ))}
      </div>

      <div className="mt-3 flex gap-2 border-t border-line pt-3">
        <Link to={`/library/${set.setId}`} className="flex-1">
          <Button variant="secondary" size="sm" icon={BookOpen} className="w-full">
            {t('Mở bộ thẻ')}
          </Button>
        </Link>

        {isLeader && (
          <Button
            variant="ghost"
            size="sm"
            icon={Trash2}
            aria-label={t('Gỡ khỏi nhóm')}
            loading={unshare.isPending && unshare.variables?.setId === set.setId}
            onClick={async () => {
              const ok = await confirm({
                title: t('Gỡ "{name}" khỏi nhóm?', { name: set.name }),
                message: t(
                  'Thành viên sẽ không học bộ này qua nhóm nữa. Bộ thẻ trong Thư viện của chủ vẫn còn nguyên, và tiến độ đã học không mất.',
                ),
                confirmLabel: t('Gỡ khỏi nhóm'),
                tone: 'danger',
              });
              if (!ok) return;
              unshare.mutate(
                { groupId, setId: set.setId },
                {
                  onSuccess: () => toast.success(t('Đã gỡ bộ thẻ khỏi nhóm')),
                  onError: (error) => toast.error(getErrorMessage(error)),
                },
              );
            }}
          />
        )}
      </div>
    </Card>
  );
}

/**
 * Hộp thoại chọn bộ thẻ để chia sẻ.
 *
 * Chỉ liệt kê bộ trong tab "Của tôi" của Thư viện — cả công khai lẫn riêng tư. Không
 * cho chọn bộ của người khác: chia sẻ bộ riêng tư của họ vào nhóm là tự ý mở nội dung
 * của người khác cho cả nhóm đọc.
 */
function PickSetModal({
  groupId,
  shared,
  open,
  onClose,
}: {
  groupId: number;
  shared: GroupStudySetRow[];
  open: boolean;
  onClose: () => void;
}): JSX.Element {
  const t = useT();
  const toast = useToast();
  const share = useShareStudySet();

  // `open` quyết định lúc nào gọi API: mở hộp thoại mới hỏi, đóng rồi thì thôi.
  const mySets = useMyStudySets(open);
  const sharedIds = new Set(shared.map((set) => set.setId));

  const submit = (set: StudySetSummary): void => {
    share.mutate(
      { groupId, setId: set.id },
      {
        onSuccess: () => {
          toast.success(t('Đã chia sẻ "{name}" vào nhóm', { name: set.name }));
          onClose();
        },
        onError: (error) => toast.error(getErrorMessage(error)),
      },
    );
  };

  return (
    <Modal open={open} onClose={onClose} title={t('Chọn bộ thẻ để chia sẻ')} size="lg">
      {mySets.isLoading && <SkeletonList rows={3} />}
      {mySets.isError && <ErrorMessage>{getErrorMessage(mySets.error)}</ErrorMessage>}

      {mySets.data?.length === 0 && (
        <EmptyState
          icon={Layers}
          title={t('Bạn chưa có bộ thẻ nào')}
          description={t('Tạo một bộ thẻ ở Thư viện rồi quay lại đây để chia sẻ cho cả nhóm.')}
        />
      )}

      <ul className="space-y-2">
        {mySets.data?.map((set) => {
          const already = sharedIds.has(set.id);

          return (
            <li key={set.id}>
              <Card className="flex flex-wrap items-center gap-3">
                <div className="min-w-0 flex-1">
                  <span className="block truncate font-medium text-content">{set.name}</span>
                  <span className="block text-xs text-content-muted">
                    {t('{n} thẻ', { n: set.cardCount })} ·{' '}
                    {set.visibility === StudySetVisibility.PUBLIC
                      ? t('Công khai')
                      : t('Riêng tư')}
                  </span>
                </div>

                {set.block ? (
                  // Bộ đang bị chặn thì backend cũng từ chối — nói trước lý do thay vì
                  // để người dùng bấm rồi nhận một dòng lỗi đỏ.
                  <span className="text-xs text-danger">{t('Đang bị chặn')}</span>
                ) : (
                  <Button
                    size="sm"
                    disabled={already}
                    loading={share.isPending && share.variables?.setId === set.id}
                    onClick={() => submit(set)}
                  >
                    {already ? t('Đã có trong nhóm') : t('Chia sẻ')}
                  </Button>
                )}
              </Card>
            </li>
          );
        })}
      </ul>
    </Modal>
  );
}
