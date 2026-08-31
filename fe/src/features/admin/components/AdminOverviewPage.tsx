import {
  Activity,
  BookOpen,
  Database,
  KeyRound,
  Lock,
  ShieldAlert,
  Users,
  type LucideIcon,
} from 'lucide-react';
import type { SystemOverview } from '@enghabit/shared';
import { getErrorMessage } from '../../../shared/lib/api-client';
import { ACTIVITY_TYPE_LABELS } from '../../../shared/lib/labels';
import { Badge, Card, ErrorMessage, PageHeader, SectionTitle, SkeletonList } from '../../../shared/components/ui';
import { useSystemOverview } from '../admin.hooks';
import { TrendChart } from './TrendChart';

/**
 * Bảng điều khiển của quản trị viên.
 *
 * Trả lời bốn câu hỏi vận hành theo thứ tự ưu tiên: hệ thống còn sống không, có bao
 * nhiêu người đang dùng, họ dùng nhiều hay ít, và kho nội dung đang có gì. Đây là
 * góc nhìn hệ thống — chuỗi ngày học và XP của cá nhân không thuộc về trang này.
 */
export function AdminOverviewPage(): JSX.Element {
  const overview = useSystemOverview();

  if (overview.isLoading) return <SkeletonList rows={4} />;
  if (overview.isError) return <ErrorMessage>{getErrorMessage(overview.error)}</ErrorMessage>;
  if (!overview.data) return <ErrorMessage>Không tải được số liệu hệ thống</ErrorMessage>;

  const data = overview.data;

  return (
    <div>
      <PageHeader
        title="Tổng quan hệ thống"
        description="Tình trạng vận hành, quy mô người dùng và mức độ sử dụng"
        action={<HealthBadge system={data.system} />}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          icon={Users}
          label="Người dùng"
          value={data.users.total}
          hint={`+${data.users.newLast7Days} trong 7 ngày`}
        />
        <StatTile
          icon={Activity}
          label="Hoạt động 7 ngày"
          value={data.users.activeLast7Days}
          hint={`${data.users.retention7Days}% tổng số người dùng`}
        />
        <StatTile
          icon={KeyRound}
          label="Phiên đang mở"
          value={data.access.activeSessions}
          hint={`${data.access.loginsLast7Days} lượt đăng nhập / 7 ngày`}
        />
        <StatTile
          icon={ShieldAlert}
          label="Đăng nhập thất bại"
          value={data.access.failedLast7Days}
          hint="7 ngày qua"
          tone={data.access.failedLast7Days > 0 ? 'warn' : 'normal'}
        />
      </div>

      <section className="mb-6">
        <SectionTitle>Hoạt động học 30 ngày qua</SectionTitle>
        <Card>
          <TrendChart
            points={data.activity.daily.map((d) => ({
              date: d.date,
              primary: d.count,
              secondary: d.activeUsers,
            }))}
            primaryLabel="Lượt hoạt động"
            secondaryLabel="Người học"
          />
        </Card>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section>
          <SectionTitle>Cơ cấu hoạt động</SectionTitle>
          <Card>
            <ActivityBreakdown byType={data.activity.byType} total={data.activity.total} />
          </Card>
        </section>

        <section>
          <SectionTitle>Người học tích cực nhất</SectionTitle>
          <Card>
            {data.topLearners.length === 0 ? (
              <p className="text-sm text-content-muted">Chưa có dữ liệu hoạt động.</p>
            ) : (
              <ol className="space-y-2.5">
                {data.topLearners.map((learner, index) => (
                  <li key={learner.id} className="flex items-center gap-3 text-sm">
                    <span className="w-4 shrink-0 text-right text-xs tabular-nums text-content-muted">
                      {index + 1}
                    </span>
                    <span className="min-w-0 flex-1 truncate font-medium text-content">{learner.name}</span>
                    <span className="tabular-nums text-content-soft">{learner.activityCount} lượt</span>
                    <Badge tone="amber">{learner.currentStreak} ngày</Badge>
                  </li>
                ))}
              </ol>
            )}
          </Card>
        </section>

        <section>
          <SectionTitle>Cơ cấu tài khoản</SectionTitle>
          <Card>
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <Pair label="Quản trị viên" value={data.users.admins} />
              <Pair label="Bị khoá" value={data.users.locked} icon={Lock} />
              <Pair label="Mới trong 30 ngày" value={data.users.newLast30Days} />
              <Pair label="Học trong 24 giờ" value={data.users.activeToday} />
            </dl>
          </Card>
        </section>

        <section>
          <SectionTitle>Kho nội dung</SectionTitle>
          <Card>
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <Pair label="Chủ đề" value={data.content.topics} icon={BookOpen} />
              <Pair label="Từ vựng" value={data.content.vocabulary} />
              <Pair label="Bài quiz" value={data.content.quizzes} />
              <Pair label="Câu hỏi quiz" value={data.content.quizQuestions} />
            </dl>
          </Card>
        </section>
      </div>

      <p className="mt-6 text-xs text-on-page-muted">
        Số liệu cập nhật lúc{' '}
        {new Date(data.system.generatedAt).toLocaleTimeString('vi-VN')} · tự làm mới mỗi phút · Node{' '}
        {data.system.nodeVersion} · môi trường {data.system.environment} · API đã chạy{' '}
        {formatUptime(data.system.uptimeSeconds)}
      </p>
    </div>
  );
}

function HealthBadge({ system }: { system: SystemOverview['system'] }): JSX.Element {
  return (
    <Badge tone={system.databaseOk ? 'green' : 'amber'} icon={Database}>
      {system.databaseOk ? 'Database kết nối tốt' : 'Mất kết nối database'}
    </Badge>
  );
}

function StatTile({
  icon: Icon,
  label,
  value,
  hint,
  tone = 'normal',
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  hint: string;
  tone?: 'normal' | 'warn';
}): JSX.Element {
  return (
    <Card>
      <div className="flex items-center gap-2">
        <Icon
          className={`h-4 w-4 ${tone === 'warn' ? 'text-danger' : 'text-brand'}`}
          aria-hidden
        />
        <p className="text-sm text-content-muted">{label}</p>
      </div>
      <p className="mt-2 text-3xl font-bold tabular-nums text-content">{value.toLocaleString('vi-VN')}</p>
      <p className="mt-1 text-xs text-content-muted">{hint}</p>
    </Card>
  );
}

function Pair({ label, value, icon: Icon }: { label: string; value: number; icon?: LucideIcon }): JSX.Element {
  return (
    <div>
      <dt className="flex items-center gap-1.5 text-xs text-content-muted">
        {Icon && <Icon className="h-3.5 w-3.5" aria-hidden />}
        {label}
      </dt>
      <dd className="mt-0.5 text-xl font-semibold tabular-nums text-content">{value.toLocaleString('vi-VN')}</dd>
    </div>
  );
}

/**
 * Tỷ trọng từng loại hoạt động. Dùng thanh ngang thay vì biểu đồ tròn: 4 hạng mục
 * có giá trị chênh nhau nhiều, so sánh độ dài dễ hơn so sánh góc quạt.
 */
function ActivityBreakdown({
  byType,
  total,
}: {
  byType: SystemOverview['activity']['byType'];
  total: number;
}): JSX.Element {
  const colors: Record<string, string> = {
    VOCAB_LEARNED: 'var(--series-vocab)',
    FLASHCARD_REVIEWED: 'var(--series-flashcard)',
    QUIZ_COMPLETED: 'var(--series-quiz)',
    HABIT_CHECKIN: 'var(--series-habit)',
  };

  if (total === 0) return <p className="text-sm text-content-muted">Chưa có hoạt động nào được ghi nhận.</p>;

  return (
    <ul className="space-y-3">
      {byType.map((row) => {
        const percent = Math.round((row.count / total) * 100);

        return (
          <li key={row.type}>
            <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
              <span className="text-content-soft">{ACTIVITY_TYPE_LABELS[row.type]}</span>
              <span className="tabular-nums text-content-muted">
                {row.count.toLocaleString('vi-VN')} · {percent}%
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-sunken">
              <div
                className="h-full rounded-full"
                style={{ width: `${percent}%`, backgroundColor: colors[row.type] }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function formatUptime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours >= 24) return `${Math.floor(hours / 24)} ngày ${hours % 24} giờ`;
  if (hours > 0) return `${hours} giờ ${minutes} phút`;
  return `${minutes} phút`;
}
