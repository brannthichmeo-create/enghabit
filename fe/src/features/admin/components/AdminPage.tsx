import { useState } from 'react';
import { UserRole } from '@enghabit/shared';
import { getErrorMessage } from '../../../shared/lib/api-client';
import { Badge, Button, Card, ErrorMessage, SkeletonList, PageHeader } from '../../../shared/components/ui';
import { useCurrentUser } from '../../auth/auth.store';
import { useAdminUsers, useDeleteUser, useSystemStats } from '../admin.hooks';
import { ContentManager } from './ContentManager';

type Tab = 'stats' | 'users' | 'content';

const TABS: { key: Tab; label: string }[] = [
  { key: 'stats', label: 'Thống kê hệ thống' },
  { key: 'users', label: 'Người dùng' },
  { key: 'content', label: 'Nội dung học tập' },
];

export function AdminPage(): JSX.Element {
  const [tab, setTab] = useState<Tab>('stats');

  return (
    <div>
      <PageHeader title="Quản trị hệ thống" description="Quản lý người dùng và nội dung học tập" />

      <div className="mb-6 flex gap-1 overflow-x-auto rounded-lg bg-sunken p-1">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`whitespace-nowrap rounded-md px-4 py-1.5 text-sm transition ${
              tab === key ? 'bg-surface font-medium text-content shadow-sm' : 'text-content-soft'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'stats' && <SystemStatsPanel />}
      {tab === 'users' && <UsersPanel />}
      {tab === 'content' && <ContentManager />}
    </div>
  );
}

function SystemStatsPanel(): JSX.Element {
  const stats = useSystemStats();

  if (stats.isLoading) return <SkeletonList rows={3} />;
  if (stats.isError) return <ErrorMessage>{getErrorMessage(stats.error)}</ErrorMessage>;
  if (!stats.data) return <ErrorMessage>Không tải được thống kê</ErrorMessage>;

  const items = [
    { label: 'Người dùng', value: stats.data.userCount },
    { label: 'Hoạt động 7 ngày qua', value: stats.data.activeLast7Days },
    { label: 'Chủ đề', value: stats.data.topicCount },
    { label: 'Từ vựng', value: stats.data.vocabularyCount },
    { label: 'Bài quiz', value: stats.data.quizCount },
    { label: 'Tổng lượt hoạt động', value: stats.data.activityCount },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <Card key={item.label}>
          <p className="text-sm text-content-muted">{item.label}</p>
          <p className="mt-1 text-2xl font-bold text-content">{item.value}</p>
        </Card>
      ))}
    </div>
  );
}

function UsersPanel(): JSX.Element {
  const currentUser = useCurrentUser();
  const [page, setPage] = useState(1);
  const users = useAdminUsers(page);
  const deleteUser = useDeleteUser();

  if (users.isLoading) return <SkeletonList rows={3} />;
  if (users.isError) return <ErrorMessage>{getErrorMessage(users.error)}</ErrorMessage>;
  if (!users.data) return <ErrorMessage>Không tải được danh sách</ErrorMessage>;

  const totalPages = Math.ceil(users.data.total / users.data.pageSize);

  return (
    <div>
      {deleteUser.isError && <ErrorMessage>{getErrorMessage(deleteUser.error)}</ErrorMessage>}

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-content-muted">
                <th className="pb-2 font-medium">Tên</th>
                <th className="pb-2 font-medium">Email</th>
                <th className="pb-2 font-medium">Vai trò</th>
                <th className="pb-2 font-medium">Ngày tạo</th>
                <th className="pb-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {users.data.items.map((user) => (
                <tr key={user.id}>
                  <td className="py-2.5 font-medium text-content">{user.name}</td>
                  <td className="py-2.5 text-content-soft">{user.email}</td>
                  <td className="py-2.5">
                    <Badge tone={user.role === UserRole.ADMIN ? 'brand' : 'slate'}>
                      {user.role === UserRole.ADMIN ? 'Quản trị' : 'Người học'}
                    </Badge>
                  </td>
                  <td className="py-2.5 text-content-muted">
                    {new Date(user.createdAt).toLocaleDateString('vi-VN')}
                  </td>
                  <td className="py-2.5 text-right">
                    {/* Không cho tự xoá chính mình — tránh khoá mất quyền quản trị. */}
                    {user.id !== currentUser?.id && (
                      <Button
                        variant="ghost"
                        onClick={() => {
                          if (confirm(`Xoá người dùng ${user.email}? Toàn bộ dữ liệu học tập sẽ mất.`)) {
                            deleteUser.mutate(user.id);
                          }
                        }}
                      >
                        Xoá
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-3">
          <Button variant="secondary" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
            Trước
          </Button>
          <span className="text-sm text-content-muted">
            Trang {page} / {totalPages}
          </span>
          <Button variant="secondary" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
            Sau
          </Button>
        </div>
      )}
    </div>
  );
}
