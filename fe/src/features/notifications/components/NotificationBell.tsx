import { useEffect, useRef, useState } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { NotificationRow } from '@enghabit/shared';
import { useMarkAllRead, useMarkRead, useNotifications, useUnreadCount } from '../notification.hooks';
import { displayFor, timeAgo } from './notification-display';

/**
 * Chuông thông báo trên thanh trên cùng.
 *
 * Chỉ tải danh sách khi người dùng mở chuông — số chưa đọc thì hỏi định kỳ vì nó
 * luôn hiện, còn nội dung thì không cần tải sẵn cho một menu chưa ai mở.
 */
export function NotificationBell(): JSX.Element {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const unread = useUnreadCount();
  const list = useNotifications(open ? { page: 1, pageSize: 8 } : {});
  const markRead = useMarkRead();
  const markAllRead = useMarkAllRead();

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent): void => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const count = unread.data ?? 0;

  const openNotification = (notification: NotificationRow): void => {
    if (!notification.readAt) markRead.mutate(notification.id);
    setOpen(false);
    if (notification.link) navigate(notification.link);
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative inline-flex h-8 w-8 items-center justify-center rounded-lg text-content-muted transition-colors hover:bg-hover hover:text-content"
        aria-label={count > 0 ? `Thông báo, ${count} chưa đọc` : 'Thông báo'}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <Bell className="h-4 w-4" aria-hidden />
        {count > 0 && (
          <span className="absolute -right-0.5 -top-0.5 min-w-[16px] rounded-full bg-danger px-1 text-[10px] font-bold leading-4 text-on-fill">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-1.5 w-[min(360px,calc(100vw-2rem))] animate-slide-up overflow-hidden rounded-xl border border-line bg-surface-raised shadow-lg"
        >
          <div className="flex items-center justify-between gap-2 border-b border-line px-3 py-2">
            <span className="text-sm font-semibold text-content">Thông báo</span>
            {count > 0 && (
              <button
                onClick={() => markAllRead.mutate()}
                className="inline-flex items-center gap-1 text-xs text-brand-strong hover:underline"
              >
                <CheckCheck className="h-3.5 w-3.5" aria-hidden />
                Đánh dấu đã đọc hết
              </button>
            )}
          </div>

          <div className="max-h-[380px] overflow-y-auto">
            {list.isLoading && <p className="px-3 py-6 text-center text-sm text-content-muted">Đang tải…</p>}

            {list.data?.items.length === 0 && (
              <p className="px-3 py-8 text-center text-sm text-content-muted">
                Chưa có thông báo nào. Nhắc nhở học sẽ xuất hiện ở đây.
              </p>
            )}

            <ul className="divide-y divide-line">
              {list.data?.items.map((notification) => {
                const { icon: Icon, tone } = displayFor(notification.type);
                const isUnread = notification.readAt === null;

                return (
                  <li key={notification.id}>
                    <button
                      onClick={() => openNotification(notification)}
                      className={`flex w-full gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-sunken ${
                        isUnread ? 'bg-brand-soft/50' : ''
                      }`}
                    >
                      <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${tone}`} aria-hidden />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-1.5">
                          <span className="truncate text-sm font-medium text-content">
                            {notification.title}
                          </span>
                          {isUnread && (
                            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand" aria-label="Chưa đọc" />
                          )}
                        </span>
                        <span className="mt-0.5 block text-xs text-content-soft">{notification.body}</span>
                        <span className="mt-0.5 block text-[11px] text-content-muted">
                          {timeAgo(notification.createdAt)}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          <button
            onClick={() => {
              setOpen(false);
              navigate('/notifications');
            }}
            className="block w-full border-t border-line px-3 py-2 text-center text-xs text-brand-strong transition-colors hover:bg-sunken"
          >
            Xem tất cả thông báo
          </button>
        </div>
      )}
    </div>
  );
}
