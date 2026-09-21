import { useState } from 'react';
import { History } from 'lucide-react';
import { AuditTargetType, type AuditLogRow } from '@enghabit/shared';
import { getErrorMessage } from '../../../shared/lib/api-client';
import { Badge, Card, EmptyState, ErrorMessage, Select, SkeletonList } from '../../../shared/components/ui';
import { useAuditActors, useAuditLogs } from '../admin.hooks';
import {
  AUDIT_ACTION_LABELS,
  AUDIT_FIELD_LABELS,
  AUDIT_TARGET_LABELS,
  actionTone,
  formatAuditValue,
  noteLabel,
} from '../audit-labels';
import { Pagination, formatDateTime } from './AdminUsersPage';
import { useLocale, useT } from '../../../shared/i18n/language';

/**
 * Nhật ký thao tác của MỘT màn quản lý: ai đã sửa gì, lúc nào, đổi từ gì sang gì.
 *
 * Nằm trong tab "Nhật ký" của chính màn đó (xem `AdminLogTabs`) chứ không phải một màn
 * riêng: người vừa sửa vật phẩm muốn xem lại ngay ở Cửa hàng, không phải sang một trang
 * khác rồi lọc tìm giữa nhật ký của mọi màn.
 *
 * CHỈ ĐỌC — không có nút sửa hay xoá dòng nào, và API cũng không có đường nào làm việc
 * đó. Nhật ký mà người bị ghi tự xoá được thì không còn là nhật ký.
 *
 * Mỗi dòng là một thẻ nội dung chứ không phải một hàng bảng: số trường đã đổi của mỗi
 * thao tác khác nhau (khoá tài khoản đổi một trường, sửa vật phẩm có thể đổi năm), xếp
 * vào bảng thì hoặc cột "chi tiết" phình to hoặc phải giấu bớt thông tin.
 */
export function AuditLogPanel({ targetTypes }: { targetTypes: readonly AuditTargetType[] }): JSX.Element {
  const t = useT();
  // Màn quản lý nhiều loại (vd Cửa hàng: loại và vật phẩm) thì cho lọc thêm trong số đó.
  const [targetType, setTargetType] = useState<AuditTargetType | ''>('');
  const [actorId, setActorId] = useState('');
  const [page, setPage] = useState(1);

  const actors = useAuditActors(targetTypes);
  const logs = useAuditLogs({
    page,
    targetTypes: targetType ? [targetType] : [...targetTypes],
    ...(actorId ? { actorId: Number(actorId) } : {}),
  });

  const filtered = targetType !== '' || actorId !== '';

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-3">
        {targetTypes.length > 1 && (
          <Select
            value={targetType}
            onChange={(e) => {
              setTargetType(e.target.value as AuditTargetType | '');
              setPage(1);
            }}
            aria-label={t('Lọc theo loại đối tượng')}
            className="!mt-0 w-auto"
          >
            <option value="">{t('Mọi loại đối tượng')}</option>
            {targetTypes.map((value) => (
              <option key={value} value={value}>
                {t(AUDIT_TARGET_LABELS[value] ?? value)}
              </option>
            ))}
          </Select>
        )}

        <Select
          value={actorId}
          onChange={(e) => {
            setActorId(e.target.value);
            setPage(1);
          }}
          aria-label={t('Lọc theo người thực hiện')}
          className="!mt-0 w-auto"
        >
          <option value="">{t('Mọi quản trị viên')}</option>
          {actors.data?.map((actor) => (
            <option key={actor.id} value={actor.id}>
              {actor.name}
            </option>
          ))}
        </Select>
      </div>

      {logs.isLoading && <SkeletonList rows={5} />}
      {logs.isError && <ErrorMessage>{getErrorMessage(logs.error)}</ErrorMessage>}

      {logs.data && logs.data.items.length === 0 && (
        <EmptyState
          icon={History}
          title={filtered ? t('Không có thao tác nào khớp bộ lọc') : t('Chưa có thao tác nào được ghi')}
          description={
            filtered
              ? t('Thử bỏ bớt điều kiện lọc.')
              : t('Nhật ký bắt đầu ghi từ thao tác chỉnh sửa tiếp theo ở màn này.')
          }
        />
      )}

      {logs.data && logs.data.items.length > 0 && (
        <>
          <Card className="!py-1">
            <ol className="divide-y divide-line">
              {logs.data.items.map((entry) => (
                <li key={entry.id}>
                  <AuditEntry entry={entry} />
                </li>
              ))}
            </ol>
          </Card>

          <Pagination page={page} total={logs.data.total} pageSize={logs.data.pageSize} onChange={setPage} />
        </>
      )}
    </div>
  );
}

function AuditEntry({ entry }: { entry: AuditLogRow }): JSX.Element {
  const t = useT();
  const locale = useLocale();
  const changes = entry.changes ? Object.entries(entry.changes) : [];
  const targetTypeLabel = AUDIT_TARGET_LABELS[entry.targetType];
  // Tên tính năng lấy từ danh mục trong mã nguồn nên có bản dịch; các tên khác là dữ liệu
  // người dùng nhập, hiện nguyên văn.
  const target =
    entry.targetType === AuditTargetType.FEATURE && entry.targetLabel ? t(entry.targetLabel) : entry.targetLabel;

  return (
    <article className="py-3.5">
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <Badge tone={actionTone(entry.action)}>{t(AUDIT_ACTION_LABELS[entry.action] ?? entry.action)}</Badge>
          {target && <span className="min-w-0 truncate font-medium text-content">{target}</span>}
        </div>
        <time dateTime={entry.createdAt} className="shrink-0 text-xs tabular-nums text-content-muted">
          {formatDateTime(entry.createdAt, t, locale)}
        </time>
      </div>

      <p className="mt-1 text-xs text-content-muted">
        {t('Thực hiện bởi {actor}', { actor: entry.actor.name })}
        {targetTypeLabel && (
          <>
            {' · '}
            {t(targetTypeLabel)}
            {entry.targetId && <span className="tabular-nums"> #{entry.targetId}</span>}
          </>
        )}
      </p>

      {changes.length > 0 && (
        <dl className="mt-2.5 grid gap-x-4 gap-y-1 text-sm sm:grid-cols-[max-content_minmax(0,1fr)]">
          {changes.map(([field, change]) => (
            <div key={field} className="contents">
              <dt className="text-content-muted">{t(AUDIT_FIELD_LABELS[field] ?? field)}</dt>
              <dd className="min-w-0 break-words text-content-soft">
                {change.from !== null && (
                  <>
                    <span className="text-content-muted line-through decoration-content-muted/60">
                      {formatAuditValue(field, change.from, t, locale)}
                    </span>
                    <span aria-hidden className="mx-1.5 text-content-muted">
                      →
                    </span>
                    <span className="sr-only"> {t('thành')} </span>
                  </>
                )}
                <span className="font-medium text-content">{formatAuditValue(field, change.to, t, locale)}</span>
              </dd>
            </div>
          ))}
        </dl>
      )}

      {entry.note && (
        <p className="mt-2.5 whitespace-pre-line break-words rounded-lg bg-sunken px-3 py-2 text-sm text-content-soft">
          <span className="font-medium text-content">{t(noteLabel(entry.action))}:</span> {entry.note}
        </p>
      )}
    </article>
  );
}
