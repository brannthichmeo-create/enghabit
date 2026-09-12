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
import { Badge, Card, ErrorMessage, PageHeader, SkeletonList } from '../../../shared/components/ui';
import { useSystemOverview } from '../admin.hooks';
import { TrendChart } from './TrendChart';
import { useLocale, useT, type TranslateFn } from '../../../shared/i18n/language';

/**
 * Bảng điều khiển của quản trị viên.
 *
 * Trả lời bốn câu hỏi vận hành theo thứ tự ưu tiên: hệ thống còn sống không, có bao
 * nhiêu người đang dùng, họ dùng nhiều hay ít, và kho nội dung đang có gì. Đây là
 * góc nhìn hệ thống — chuỗi ngày học và XP của cá nhân không thuộc về trang này.
 *
 * Bố cục sửa hai thứ so với bản trước:
 *
 *  1. **Tiêu đề nằm TRONG thẻ.** Bản cũ đặt bốn nhãn mục ở ngoài, trên nền hệ thống,
 *     tạo ra nhịp "nhãn — thẻ — nhãn — thẻ" khiến trang giật khúc. Đưa vào trong giúp
 *     mắt ở yên trong khối đang đọc, và giống hệt cách trang tổng quan người học làm.
 *  2. **Gộp hai bảng số tĩnh.** "Cơ cấu tài khoản" và "Kho nội dung" chỉ là các cặp
 *     nhãn–số, mật độ thông tin thấp mà lại chiếm hai ô ngang hàng với biểu đồ. Nay
 *     gộp thành một thẻ tra cứu ở cột hẹp.
 */
export function AdminOverviewPage(): JSX.Element {
  const locale = useLocale();
  const t = useT();
  const overview = useSystemOverview();

  if (overview.isLoading) return <SkeletonList rows={4} />;
  if (overview.isError) return <ErrorMessage>{getErrorMessage(overview.error)}</ErrorMessage>;
  if (!overview.data) return <ErrorMessage>{t('Không tải được số liệu hệ thống')}</ErrorMessage>;

  const data = overview.data;

  return (
    <div className="space-y-4">
      <PageHeader
        title={t('Tổng quan hệ thống')}
        description={t('Tình trạng vận hành, quy mô người dùng và mức độ sử dụng')}
        action={<HealthBadge system={data.system} />}
      />

      {/* Bốn con số cần liếc thấy đầu tiên khi mở trang */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          icon={Users}
          label={t('Người dùng')}
          value={data.users.total}
          hint={t('+{n} trong 7 ngày', { n: data.users.newLast7Days })}
        />
        <StatTile
          icon={Activity}
          label={t('Hoạt động 7 ngày')}
          value={data.users.activeLast7Days}
          hint={t('{percent}% tổng số người dùng', { percent: data.users.retention7Days })}
        />
        <StatTile
          icon={KeyRound}
          label={t('Phiên đang mở')}
          value={data.access.activeSessions}
          hint={t('{n} lượt đăng nhập / 7 ngày', { n: data.access.loginsLast7Days })}
        />
        <StatTile
          icon={ShieldAlert}
          label={t('Đăng nhập thất bại')}
          value={data.access.failedLast7Days}
          hint={t('7 ngày qua')}
          tone={data.access.failedLast7Days > 0 ? 'warn' : 'normal'}
        />
      </div>

      {/* Hàng 2 — xu hướng chiếm 2/3, cơ cấu hoạt động 1/3 */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card className="h-full">
            <h2 className="font-semibold text-content">{t('Hoạt động học 30 ngày qua')}</h2>
            <p className="mb-4 mt-0.5 text-sm text-content-muted">
              {t('Tổng {n} lượt hoạt động từ trước tới nay', { n: data.activity.total.toLocaleString(locale) })}
            </p>
            <TrendChart
              points={data.activity.daily.map((d) => ({
                date: d.date,
                primary: d.count,
                secondary: d.activeUsers,
              }))}
              primaryLabel={t('Lượt hoạt động')}
              secondaryLabel={t('Người học')}
            />
          </Card>
        </div>

        <Card className="h-full">
          <h2 className="font-semibold text-content">{t('Cơ cấu hoạt động')}</h2>
          <p className="mb-4 mt-0.5 text-sm text-content-muted">{t('Người học đang làm gì nhiều nhất')}</p>
          <ActivityBreakdown byType={data.activity.byType} total={data.activity.total} />
        </Card>
      </div>

      {/* Hàng 3 — bảng xếp hạng chiếm 2/3, số liệu tra cứu 1/3 */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card className="h-full">
            <h2 className="font-semibold text-content">{t('Người học tích cực nhất')}</h2>
            <p className="mb-4 mt-0.5 text-sm text-content-muted">{t('Xếp theo tổng số lượt hoạt động')}</p>

            {data.topLearners.length === 0 ? (
              <p className="text-sm text-content-muted">{t('Chưa có dữ liệu hoạt động.')}</p>
            ) : (
              <ol className="space-y-2.5">
                {data.topLearners.map((learner, index) => (
                  <li key={learner.id} className="flex items-center gap-3 text-sm">
                    <span className="w-4 shrink-0 text-right text-xs tabular-nums text-content-muted">
                      {index + 1}
                    </span>
                    <span className="min-w-0 flex-1 truncate font-medium text-content">{learner.name}</span>
                    <span className="tabular-nums text-content-soft">
                      {t('{n} lượt', { n: learner.activityCount })}
                    </span>
                    <Badge tone="amber">{t('{n} ngày', { n: learner.currentStreak })}</Badge>
                  </li>
                ))}
              </ol>
            )}
          </Card>
        </div>

        {/*
          Hai nhóm số tra cứu gộp một thẻ, ngăn bằng một đường kẻ. Chúng ít thay đổi
          và hiếm khi là thứ cần xem đầu tiên, nên nằm ở cột hẹp là đúng vai trò.
        */}
        <Card className="h-full">
          <h2 className="font-semibold text-content">{t('Số liệu tra cứu')}</h2>
          <p className="mb-4 mt-0.5 text-sm text-content-muted">{t('Cơ cấu tài khoản và kho nội dung')}</p>

          <dl className="grid grid-cols-2 gap-x-4 gap-y-3.5 text-sm">
            <Pair label={t('Quản trị viên')} value={data.users.admins} />
            <Pair label={t('Bị khoá')} value={data.users.locked} icon={Lock} />
            <Pair label={t('Mới trong 30 ngày')} value={data.users.newLast30Days} />
            <Pair label={t('Học trong 24 giờ')} value={data.users.activeToday} />
          </dl>

          <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3.5 border-t border-line pt-4 text-sm">
            <Pair label={t('Chủ đề')} value={data.content.topics} icon={BookOpen} />
            <Pair label={t('Từ vựng')} value={data.content.vocabulary} />
          </dl>
        </Card>
      </div>

      <p className="text-xs text-on-page-muted">
        {t(
          'Số liệu cập nhật lúc {time} · tự làm mới mỗi phút · Node {node} · môi trường {env} · API đã chạy {uptime}',
          {
            time: new Date(data.system.generatedAt).toLocaleTimeString(locale),
            node: data.system.nodeVersion,
            env: data.system.environment,
            uptime: formatUptime(data.system.uptimeSeconds, t),
          },
        )}
      </p>
    </div>
  );
}

function HealthBadge({ system }: { system: SystemOverview['system'] }): JSX.Element {
  const t = useT();
  return (
    <Badge tone={system.databaseOk ? 'green' : 'amber'} icon={Database}>
      {system.databaseOk ? t('Database kết nối tốt') : t('Mất kết nối database')}
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
  const locale = useLocale();
  return (
    <Card>
      <div className="flex items-center gap-2">
        <Icon
          className={`h-4 w-4 shrink-0 ${tone === 'warn' ? 'text-danger' : 'text-brand-strong'}`}
          aria-hidden
        />
        <p className="text-sm text-content-muted">{label}</p>
      </div>
      <p className="mt-2 text-3xl font-bold tabular-nums text-content">{value.toLocaleString(locale)}</p>
      <p className="mt-1 text-xs text-content-muted">{hint}</p>
    </Card>
  );
}

function Pair({ label, value, icon: Icon }: { label: string; value: number; icon?: LucideIcon }): JSX.Element {
  const locale = useLocale();
  return (
    <div>
      <dt className="flex items-center gap-1.5 text-xs text-content-muted">
        {Icon && <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />}
        <span className="truncate">{label}</span>
      </dt>
      <dd className="mt-0.5 text-xl font-semibold tabular-nums text-content">{value.toLocaleString(locale)}</dd>
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
  const locale = useLocale();
  const t = useT();
  const colors: Record<string, string> = {
    VOCAB_LEARNED: 'var(--series-vocab)',
    FLASHCARD_REVIEWED: 'var(--series-flashcard)',
    QUIZ_COMPLETED: 'var(--series-quiz)',
    HABIT_CHECKIN: 'var(--series-habit)',
  };

  if (total === 0) return <p className="text-sm text-content-muted">{t('Chưa có hoạt động nào được ghi nhận.')}</p>;

  return (
    <ul className="space-y-3">
      {byType.map((row) => {
        const percent = Math.round((row.count / total) * 100);

        return (
          <li key={row.type}>
            <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
              <span className="truncate text-content-soft">{t(ACTIVITY_TYPE_LABELS[row.type])}</span>
              <span className="shrink-0 tabular-nums text-content-muted">
                {row.count.toLocaleString(locale)} · {percent}%
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

function formatUptime(seconds: number, t: TranslateFn): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours >= 24) return t('{days} ngày {hours} giờ', { days: Math.floor(hours / 24), hours: hours % 24 });
  if (hours > 0) return t('{hours} giờ {minutes} phút', { hours, minutes });
  return t('{n} phút', { n: minutes });
}
