import { ToggleRight } from 'lucide-react';
import { AuditTargetType, FEATURES, findFeature, type AdminFeatureRow, type FeatureKey } from '@enghabit/shared';
import { getErrorMessage } from '../../../shared/lib/api-client';
import {
  Card,
  ErrorMessage,
  PageHeader,
  SectionTitle,
  SkeletonList,
  Switch,
} from '../../../shared/components/ui';
import { useToast } from '../../../shared/components/Toast';
import { useConfirm } from '../../../shared/components/ConfirmDialog';
import { useLocale, useT } from '../../../shared/i18n/language';
import { formatDateTime } from '../../admin/components/AdminUsersPage';
import { useAdminFeatures, useSetFeatureEnabled } from '../feature-flag.hooks';
import { AdminLogTabs } from '../../admin/components/AdminLogTabs';

/**
 * Quản lý tính năng — bật/tắt từng tính năng cho toàn bộ người học.
 *
 * Tắt là biện pháp ĐẢO NGƯỢC ĐƯỢC: dữ liệu học (ActivityLog, mục tiêu, thói quen, tiến
 * độ từ vựng) giữ nguyên, bật lại là người học thấy lại đúng chỗ đang dở. Cùng tinh
 * thần với khoá tài khoản và chặn nhóm.
 */
export function AdminFeaturesPage(): JSX.Element {
  const t = useT();
  const list = useAdminFeatures();

  return (
    <div>
      <PageHeader
        title={t('Quản lý tính năng')}
        description={t('Bật hoặc tắt từng tính năng cho toàn bộ người học')}
      />
      <AdminLogTabs targetTypes={[AuditTargetType.FEATURE]}>
        {/* Nói rõ độ trễ: không nói thì quản trị viên bấm tắt, thử ngay, thấy vẫn vào
            được, rồi bấm đi bấm lại vài lần vì tưởng nút hỏng. */}
        <p className="mb-4 text-sm text-on-page-muted">
          {t('Thay đổi có hiệu lực trong vòng 30 giây. Tắt tính năng không xoá dữ liệu đã có của người học.')}
        </p>

        {list.isLoading && <SkeletonList rows={5} />}
        {list.isError && <ErrorMessage>{getErrorMessage(list.error)}</ErrorMessage>}

        {list.data && (
          <Card>
            <SectionTitle>{t('Tính năng của người học')}</SectionTitle>
            <ul className="divide-y divide-line">
              {list.data.map((row) => (
                <li key={row.key}>
                  <FeatureRow row={row} />
                </li>
              ))}
            </ul>
          </Card>
        )}
      </AdminLogTabs>
    </div>
  );
}

function FeatureRow({ row }: { row: AdminFeatureRow }): JSX.Element {
  const t = useT();
  const locale = useLocale();
  const toast = useToast();
  const confirm = useConfirm();
  const setEnabled = useSetFeatureEnabled();

  const feature = findFeature(row.key);
  const label = feature?.label ?? row.key;
  const blocked = row.blockedBy.length > 0 && !row.isEnabled;

  const toggle = async (next: boolean): Promise<void> => {
    if (!next && !(await confirmDisable())) return;

    setEnabled.mutate(
      { key: row.key, isEnabled: next },
      {
        onSuccess: (result) => {
          if (result.alsoDisabled.length > 0) {
            toast.success(
              t('Đã tắt {name}, kèm theo: {others}', {
                name: t(label),
                others: result.alsoDisabled.map((key) => t(labelOf(key))).join(', '),
              }),
            );
            return;
          }
          toast.success(next ? t('Đã bật {name}', { name: t(label) }) : t('Đã tắt {name}', { name: t(label) }));
        },
        onError: (error) => toast.error(getErrorMessage(error)),
      },
    );
  };

  /**
   * Hỏi trước khi tắt, không hỏi khi bật — bật là hành động khôi phục.
   *
   * Hộp thoại nêu hai thứ quản trị viên cần biết mà giao diện không tự nói ra: bao
   * nhiêu người đang dùng tính năng đó, và những tính năng nào sẽ tắt lây theo.
   */
  const confirmDisable = async (): Promise<boolean> => {
    const cascade = FEATURES.filter((f) => f.dependsOn?.includes(row.key)).map((f) => f.label);

    const parts = [t('Người học sẽ không còn thấy mục này. Dữ liệu đã có vẫn giữ nguyên.')];
    if (row.recentUsers > 0) {
      parts.push(t('{count} người học đã dùng tính năng này trong 7 ngày qua.', { count: row.recentUsers }));
    }
    if (cascade.length > 0) {
      parts.push(t('Các tính năng sau sẽ tắt theo: {others}', { others: cascade.map((l) => t(l)).join(', ') }));
    }

    return confirm({
      title: t('Tắt {name}?', { name: t(label) }),
      message: parts.join(' '),
      confirmLabel: t('Tắt tính năng'),
    });
  };

  return (
    <div className="flex items-start gap-3 py-3">
      <ToggleRight className="mt-0.5 h-5 w-5 shrink-0 text-content-muted" aria-hidden />

      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-content">{t(label)}</p>
        {feature && <p className="mt-0.5 text-xs text-content-muted">{t(feature.description)}</p>}

        {blocked && (
          <p className="mt-1 text-xs text-content-soft">
            {t('Phải bật {others} trước', { others: row.blockedBy.map((key) => t(labelOf(key))).join(', ') })}
          </p>
        )}

        {row.updatedByName && (
          <p className="mt-1 text-xs text-content-soft">
            {row.isEnabled
              ? t('Bật bởi {name} lúc {time}', {
                  name: row.updatedByName,
                  time: formatDateTime(row.updatedAt, t, locale),
                })
              : t('Tắt bởi {name} lúc {time}', {
                  name: row.updatedByName,
                  time: formatDateTime(row.updatedAt, t, locale),
                })}
          </p>
        )}
      </div>

      <Switch
        checked={row.isEnabled}
        busy={setEnabled.isPending || blocked}
        label={t(label)}
        onChange={(next) => void toggle(next)}
      />
    </div>
  );
}

function labelOf(key: FeatureKey): string {
  return findFeature(key)?.label ?? key;
}
