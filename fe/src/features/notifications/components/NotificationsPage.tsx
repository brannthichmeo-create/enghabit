import { useState } from 'react';
import { Bell, CheckCheck, Settings, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getErrorMessage } from '../../../shared/lib/api-client';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorMessage,
  PageHeader,
  SkeletonList,
} from '../../../shared/components/ui';
import {
  useDeleteNotification,
  useMarkAllRead,
  useMarkRead,
  useNotifications,
} from '../notification.hooks';
import { displayFor, timeAgo } from './notification-display';
import { useLocale, useT } from '../../../shared/i18n/language';

/**
 * Danh sách thông báo đã nhận.
 *
 * Chỉ có danh sách, không có cài đặt: đây là màn hình để ĐỌC, mở ra nhiều lần mỗi
 * ngày, còn giờ nhắc thì cả tháng chỉnh một lần. Trộn hai thứ khiến trang dài ra
 * và người dùng phải cuộn qua một khối cài đặt chỉ để xem thông báo mới.
 * Cài đặt nhắc nhở nay nằm ở trang cá nhân, cạnh các thiết lập tài khoản khác.
 */
export function NotificationsPage(): JSX.Element {
  const locale = useLocale();
  const t = useT();
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [page, setPage] = useState(1);

  const list = useNotifications({ page, unreadOnly });
  const markRead = useMarkRead();
  const markAllRead = useMarkAllRead();
  const remove = useDeleteNotification();

  const totalPages = list.data ? Math.ceil(list.data.total / list.data.pageSize) : 1;

  return (
    <div>
      <PageHeader
        title={t('Thông báo')}
        description={t('Nhắc nhở học tập, cảnh báo chuỗi ngày và thông báo từ hệ thống')}
        action={
          <div className="flex flex-wrap gap-2">
            {/* Lối đi tới chỗ cài đặt vừa chuyển đi — người quen tìm nó ở đây sẽ không bị lạc */}
            <Link to="/profile#nhac-nho">
              <Button variant="secondary" icon={Settings}>
                {t('Cài đặt nhắc nhở')}
              </Button>
            </Link>
            <Button variant="secondary" icon={CheckCheck} onClick={() => markAllRead.mutate()}>
              {t('Đánh dấu đã đọc hết')}
            </Button>
          </div>
        }
      />

      <div className="mb-4 flex gap-1 rounded-lg bg-sunken p-1">
        {[
          { key: false, label: 'Tất cả' },
          { key: true, label: 'Chưa đọc' },
        ].map((tab) => (
          <button
            key={String(tab.key)}
            onClick={() => {
              setUnreadOnly(tab.key);
              setPage(1);
            }}
            className={`rounded-md px-4 py-1.5 text-sm transition ${
              unreadOnly === tab.key ? 'bg-surface font-medium text-content shadow-sm' : 'text-content-soft'
            }`}
          >
            {t(tab.label)}
          </button>
        ))}
      </div>

      {list.isLoading && <SkeletonList rows={4} />}
      {list.isError && <ErrorMessage>{getErrorMessage(list.error)}</ErrorMessage>}
      {remove.isError && <ErrorMessage>{getErrorMessage(remove.error)}</ErrorMessage>}

      {list.data && list.data.items.length === 0 && (
        <EmptyState
          icon={Bell}
          title={unreadOnly ? t('Không còn thông báo chưa đọc') : t('Chưa có thông báo nào')}
          description={t('Nhắc nhở học hằng ngày sẽ xuất hiện ở đây theo giờ bạn đặt trong trang cá nhân.')}
        />
      )}

      <div className="space-y-2">
        {list.data?.items.map((notification) => {
          const { icon: Icon, label, tone } = displayFor(notification.type);
          const isUnread = notification.readAt === null;

          const content = (
            <>
              <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${tone}`} aria-hidden />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-content">{notification.title}</span>
                  <Badge tone={isUnread ? 'brand' : 'slate'}>{label}</Badge>
                  {isUnread && <span className="text-xs text-brand-strong">{t('Chưa đọc')}</span>}
                </div>
                <p className="mt-0.5 text-sm text-content-soft">{notification.body}</p>
                <p className="mt-1 text-xs text-content-muted">{timeAgo(notification.createdAt, t, locale)}</p>
              </div>
            </>
          );

          return (
            <Card key={notification.id} className={isUnread ? 'border-brand/40' : ''}>
              <div className="flex items-start gap-3">
                {notification.link ? (
                  <Link
                    to={notification.link}
                    onClick={() => isUnread && markRead.mutate(notification.id)}
                    className="flex min-w-0 flex-1 items-start gap-3"
                  >
                    {content}
                  </Link>
                ) : (
                  <div className="flex min-w-0 flex-1 items-start gap-3">{content}</div>
                )}

                <div className="flex shrink-0 gap-1">
                  {isUnread && (
                    <Button variant="ghost" size="sm" onClick={() => markRead.mutate(notification.id)}>
                      {t('Đã đọc')}
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={Trash2}
                    aria-label={t('Xoá thông báo')}
                    onClick={() => remove.mutate(notification.id)}
                  />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-3">
          <Button variant="secondary" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
            {t('Trước')}
          </Button>
          <span className="text-sm tabular-nums text-on-page-muted">
            Trang {page} / {totalPages}
          </span>
          <Button
            variant="secondary"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Sau
          </Button>
        </div>
      )}
    </div>
  );
}
