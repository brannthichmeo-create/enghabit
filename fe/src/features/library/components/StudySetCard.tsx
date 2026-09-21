import { Link } from 'react-router-dom';
import { Ban, Globe, Lock } from 'lucide-react';
import { StudySetVisibility, type StudySetSummary } from '@enghabit/shared';
import { Badge, Card } from '../../../shared/components/ui';
import { VOCAB_LEVEL_LABELS } from '../../../shared/lib/labels';
import { useT, type TranslateFn } from '../../../shared/i18n/language';

/** Tên tác giả hiển thị. Bộ của quản trị viên hiện "Hệ thống", không lộ tên tài khoản quản trị. */
export function authorLabel(set: Pick<StudySetSummary, 'author'>, t: TranslateFn): string {
  if (set.author.isSystem) return t('Hệ thống');
  return set.author.name ?? t('Người dùng');
}

/**
 * Thẻ xem trước một bộ thẻ: tên, tác giả (bắt buộc), số thẻ, mô tả.
 *
 * Mặc định là liên kết tới trang chi tiết ở Thư viện; truyền `to` để dẫn tới trang khác
 * (màn Nội dung học tập của quản trị viên), hoặc `onSelect` để dùng làm lựa chọn (vd chọn
 * bộ để học) mà không rời trang.
 */
export function StudySetCard({
  set,
  onSelect,
  to,
}: {
  set: StudySetSummary;
  onSelect?: () => void;
  to?: string;
}): JSX.Element {
  const t = useT();

  const body = (
    <Card interactive className="flex h-full flex-col">
      <div className="flex items-start justify-between gap-2">
        <h3 className="min-w-0 font-semibold text-content">{set.name}</h3>
        <Badge>{t(VOCAB_LEVEL_LABELS[set.level])}</Badge>
      </div>

      <p className="mt-1 text-xs text-content-muted">{t('Tác giả: {name}', { name: authorLabel(set, t) })}</p>

      {set.description && <p className="mt-2 line-clamp-2 text-sm text-content-soft">{set.description}</p>}

      <div className="mt-auto flex flex-wrap items-center gap-2 pt-3">
        <span className="text-xs tabular-nums text-content-muted">{t('{n} thẻ', { n: set.cardCount })}</span>
        {set.isOwner &&
          (set.visibility === StudySetVisibility.PUBLIC ? (
            <Badge tone="green" icon={Globe}>
              {t('Công khai')}
            </Badge>
          ) : (
            <Badge icon={Lock}>{t('Riêng tư')}</Badge>
          ))}
        {set.block && (
          <Badge tone="red" icon={Ban}>
            {t('Đang bị chặn')}
          </Badge>
        )}
      </div>
    </Card>
  );

  if (onSelect) {
    return (
      <button type="button" onClick={onSelect} className="block h-full text-left">
        {body}
      </button>
    );
  }

  return (
    <Link to={to ?? `/library/${set.id}`} className="block h-full">
      {body}
    </Link>
  );
}
