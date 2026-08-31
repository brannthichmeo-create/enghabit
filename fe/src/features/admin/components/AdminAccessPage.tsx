import { useState } from 'react';
import { KeyRound, Monitor, ShieldAlert, Users } from 'lucide-react';
import type { LoginEventRow } from '@enghabit/shared';
import { getErrorMessage } from '../../../shared/lib/api-client';
import { LOGIN_FAIL_LABELS } from '../../../shared/lib/labels';
import {
  Badge,
  Card,
  EmptyState,
  ErrorMessage,
  PageHeader,
  SectionTitle,
  Select,
  SkeletonList,
} from '../../../shared/components/ui';
import { useAccessOverview, useLoginEvents } from '../admin.hooks';
import { TrendChart } from './TrendChart';
import { Pagination, formatDateTime } from './AdminUsersPage';

/**
 * Theo dõi lượt truy cập hệ thống.
 *
 * Đọc từ bảng login_events — mỗi lần đăng nhập, kể cả thất bại, đều ghi một dòng.
 * Nhờ vậy quản trị viên nhìn được cả lưu lượng bình thường lẫn dấu hiệu bất thường
 * (hàng loạt lần sai mật khẩu vào cùng một email) mà không cần công cụ ngoài.
 */
export function AdminAccessPage(): JSX.Element {
  const [days, setDays] = useState(30);
  const [result, setResult] = useState<'all' | 'success' | 'failed'>('all');
  const [page, setPage] = useState(1);

  const overview = useAccessOverview(days);
  const logs = useLoginEvents({ page, days, result });

  return (
    <div>
      <PageHeader
        title="Lượt truy cập"
        description="Lịch sử đăng nhập, phiên đang mở và các lần đăng nhập thất bại"
        action={
          <Select
            value={days}
            onChange={(e) => {
              setDays(Number(e.target.value));
              setPage(1);
            }}
            aria-label="Khoảng thời gian"
            className="!mt-0 w-auto"
          >
            <option value={7}>7 ngày qua</option>
            <option value={30}>30 ngày qua</option>
            <option value={90}>90 ngày qua</option>
          </Select>
        }
      />

      {overview.isLoading && <SkeletonList rows={3} />}
      {overview.isError && <ErrorMessage>{getErrorMessage(overview.error)}</ErrorMessage>}

      {overview.data && (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Tile icon={KeyRound} label="Lượt đăng nhập" value={overview.data.totalLogins} />
            <Tile icon={Users} label="Người dùng khác nhau" value={overview.data.uniqueUsers} />
            <Tile icon={Monitor} label="Phiên đang mở" value={overview.data.activeSessions} />
            <Tile
              icon={ShieldAlert}
              label="Đăng nhập thất bại"
              value={overview.data.totalFailed}
              warn={overview.data.totalFailed > 0}
            />
          </div>

          <section className="mb-6">
            <SectionTitle>Lượt đăng nhập theo ngày</SectionTitle>
            <Card>
              <TrendChart
                points={overview.data.points.map((p) => ({
                  date: p.date,
                  primary: p.logins,
                  secondary: p.uniqueUsers,
                }))}
                primaryLabel="Lượt đăng nhập"
                secondaryLabel="Người dùng khác nhau"
              />
            </Card>
          </section>
        </>
      )}

      <section>
        <SectionTitle
          action={
            <Select
              value={result}
              onChange={(e) => {
                setResult(e.target.value as typeof result);
                setPage(1);
              }}
              aria-label="Lọc theo kết quả"
              className="!mt-0 w-auto"
            >
              <option value="all">Tất cả</option>
              <option value="success">Chỉ thành công</option>
              <option value="failed">Chỉ thất bại</option>
            </Select>
          }
        >
          Nhật ký đăng nhập
        </SectionTitle>

        {logs.isLoading && <SkeletonList rows={5} />}
        {logs.isError && <ErrorMessage>{getErrorMessage(logs.error)}</ErrorMessage>}

        {logs.data && logs.data.items.length === 0 && (
          <EmptyState
            icon={KeyRound}
            title="Chưa có lượt truy cập nào"
            description="Nhật ký bắt đầu được ghi từ lần đăng nhập tiếp theo."
          />
        )}

        {logs.data && logs.data.items.length > 0 && (
          <>
            <Card className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-sm">
                <thead>
                  <tr className="border-b border-line text-left text-content-muted">
                    <th className="pb-2 font-medium">Thời điểm</th>
                    <th className="pb-2 font-medium">Tài khoản</th>
                    <th className="pb-2 font-medium">Kết quả</th>
                    <th className="pb-2 font-medium">Địa chỉ IP</th>
                    <th className="pb-2 font-medium">Thiết bị</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {logs.data.items.map((event) => (
                    <EventRow key={event.id} event={event} />
                  ))}
                </tbody>
              </table>
            </Card>

            <Pagination
              page={page}
              total={logs.data.total}
              pageSize={logs.data.pageSize}
              onChange={setPage}
            />
          </>
        )}
      </section>
    </div>
  );
}

function EventRow({ event }: { event: LoginEventRow }): JSX.Element {
  return (
    <tr>
      <td className="whitespace-nowrap py-2.5 tabular-nums text-content-soft">
        {formatDateTime(event.createdAt)}
      </td>
      <td className="py-2.5">
        <span className="block font-medium text-content">{event.userName ?? '—'}</span>
        <span className="block text-xs text-content-muted">{event.email}</span>
      </td>
      <td className="py-2.5">
        <Badge tone={event.success ? 'green' : 'amber'}>
          {event.success ? 'Thành công' : (LOGIN_FAIL_LABELS[event.reason ?? ''] ?? 'Thất bại')}
        </Badge>
      </td>
      <td className="py-2.5 tabular-nums text-content-muted">{event.ipAddress ?? '—'}</td>
      <td className="max-w-[220px] truncate py-2.5 text-content-muted" title={event.userAgent ?? undefined}>
        {describeDevice(event.userAgent)}
      </td>
    </tr>
  );
}

function Tile({
  icon: Icon,
  label,
  value,
  warn = false,
}: {
  icon: typeof KeyRound;
  label: string;
  value: number;
  warn?: boolean;
}): JSX.Element {
  return (
    <Card>
      <div className="flex items-center gap-2">
        <Icon className={`h-4 w-4 ${warn ? 'text-danger' : 'text-brand'}`} aria-hidden />
        <p className="text-sm text-content-muted">{label}</p>
      </div>
      <p className="mt-2 text-3xl font-bold tabular-nums text-content">{value.toLocaleString('vi-VN')}</p>
    </Card>
  );
}

/**
 * Rút gọn User-Agent thành tên trình duyệt + hệ điều hành.
 * Chuỗi gốc dài cả trăm ký tự, để nguyên thì bảng không đọc được — vẫn giữ đầy đủ
 * trong thuộc tính title để rê chuột xem khi cần điều tra.
 */
function describeDevice(userAgent: string | null): string {
  if (!userAgent) return '—';

  const browser = /Edg\//.test(userAgent)
    ? 'Edge'
    : /Chrome\//.test(userAgent)
      ? 'Chrome'
      : /Firefox\//.test(userAgent)
        ? 'Firefox'
        : /Safari\//.test(userAgent)
          ? 'Safari'
          : 'Khác';

  const os = /Windows/.test(userAgent)
    ? 'Windows'
    : /Android/.test(userAgent)
      ? 'Android'
      : /iPhone|iPad/.test(userAgent)
        ? 'iOS'
        : /Mac OS/.test(userAgent)
          ? 'macOS'
          : /Linux/.test(userAgent)
            ? 'Linux'
            : '';

  return os ? `${browser} · ${os}` : browser;
}
