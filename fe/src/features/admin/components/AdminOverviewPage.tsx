import {
  Activity,
  BookOpen,
  Clock,
  Database,
  Flag,
  KeyRound,
  ListChecks,
  Lock,
  ShieldAlert,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { StudySetReportStatus, type SystemOverview } from '@enghabit/shared';
import { getErrorMessage } from '../../../shared/lib/api-client';
import { ACTIVITY_TYPE_LABELS } from '../../../shared/lib/labels';
import { Badge, Card, ErrorMessage, PageHeader, Skeleton } from '../../../shared/components/ui';
import { StatusRow, type StatusTone } from '../../../shared/components/StatusRow';
import { useResetRequests, useStudySetReports, useSystemOverview } from '../admin.hooks';
import { TrendChart } from './TrendChart';
import { useLocale, useT, type TranslateFn } from '../../../shared/i18n/language';

/**
 * Bảng điều khiển của quản trị viên.
 *
 * Đọc từ trên xuống theo thứ tự việc của người vận hành, cùng khuôn với trang tổng quan
 * người học:
 *
 *  1. **Hệ thống có ổn không, quy mô ra sao?** — huy hiệu database ở tiêu đề và MỘT dải
 *     bốn con số. Bản trước là bốn thẻ rời cùng cỡ, mỗi thẻ một số to — bốn điểm nhìn
 *     ngang nhau, không cái nào nổi lên, và tốn gấp đôi chỗ.
 *  2. **Có gì cần mình xử lý?** — "Việc cần xử lý" gom yêu cầu cấp lại mật khẩu, báo cáo
 *     bộ thẻ và đăng nhập thất bại, mỗi dòng dẫn thẳng tới màn xử lý. Tài khoản bị khoá
 *     KHÔNG nằm đây: đó là hệ quả của một việc đã xử lý xong, thuộc về số liệu tra cứu.
 *     Trước đây hai hàng chờ đầu tiên không có mặt trên trang này, quản trị viên phải tự
 *     mở từng màn mới biết có việc.
 *  3. **Người học dùng thế nào?** — xu hướng 30 ngày trải hết bề ngang (30 cột mới đủ
 *     chỗ thở), rồi người học tích cực và số liệu tra cứu. Nhóm này tách khỏi nhóm trên
 *     bằng khoảng cách rộng hơn, vì đây là phần xem lại chứ không phải phần phải làm.
 *
 * Thẻ đứng cạnh nhau cao bằng nhau; ruột của thẻ thấp hơn tự giãn đều để lấp chỗ, không
 * để một khoảng trống dồn xuống đáy.
 */
export function AdminOverviewPage(): JSX.Element {
  const locale = useLocale();
  const t = useT();
  const overview = useSystemOverview();

  if (overview.isLoading) return <OverviewSkeleton />;
  if (overview.isError) return <ErrorMessage>{getErrorMessage(overview.error)}</ErrorMessage>;
  if (!overview.data) return <ErrorMessage>{t('Không tải được số liệu hệ thống')}</ErrorMessage>;

  const data = overview.data;

  return (
    <div>
      <PageHeader
        title={t('Tổng quan hệ thống')}
        description={t('Tình trạng vận hành, quy mô người dùng và mức độ sử dụng')}
        action={<HealthBadge system={data.system} />}
      />

      {/* Nhóm 1 — bây giờ: quy mô và việc cần xử lý */}
      <div className="space-y-4">
        <KpiStrip data={data} />

        <div className="grid gap-4 lg:grid-cols-2">
          <ActionCard data={data} />

          <Card className="flex h-full flex-col">
            <h2 className="font-semibold text-content">{t('Cơ cấu hoạt động')}</h2>
            <p className="mt-0.5 text-sm text-content-muted">{t('Người học đang làm gì nhiều nhất')}</p>
            <ActivityBreakdown byType={data.activity.byType} total={data.activity.total} />
          </Card>
        </div>
      </div>

      {/* Nhóm 2 — xem lại: cách nhóm trên rộng hơn hẳn khoảng cách giữa các thẻ trong nhóm */}
      <div className="mt-8 space-y-4">
        <Card>
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

        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="flex h-full flex-col">
            <h2 className="font-semibold text-content">{t('Người học tích cực nhất')}</h2>
            <p className="mt-0.5 text-sm text-content-muted">{t('Xếp theo tổng số lượt hoạt động')}</p>

            {data.topLearners.length === 0 ? (
              <p className="mt-4 text-sm text-content-muted">{t('Chưa có dữ liệu hoạt động.')}</p>
            ) : (
              <ol className="mt-4 flex flex-1 flex-col justify-between gap-2.5">
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

          {/*
            Số tra cứu: ít thay đổi và hiếm khi là thứ cần xem đầu tiên, nên nằm cuối
            trang. Hai nhóm chia đôi chiều cao thẻ để khớp với bảng bên cạnh.
          */}
          <Card className="flex h-full flex-col">
            <h2 className="font-semibold text-content">{t('Số liệu tra cứu')}</h2>
            <p className="mt-0.5 text-sm text-content-muted">{t('Cơ cấu tài khoản và kho nội dung')}</p>

            <div className="mt-4 flex flex-1 flex-col justify-between gap-4">
              <dl className="grid grid-cols-2 gap-x-4 gap-y-3.5 text-sm">
                <Pair label={t('Quản trị viên')} value={data.users.admins} />
                <Pair label={t('Mới trong 30 ngày')} value={data.users.newLast30Days} />
                <Pair label={t('Học trong 30 ngày')} value={data.users.activeLast30Days} />
                <Pair label={t('Bị khoá')} value={data.users.locked} icon={Lock} />
              </dl>

              <dl className="grid grid-cols-2 gap-x-4 gap-y-3.5 border-t border-line pt-4 text-sm">
                <Pair label={t('Chủ đề')} value={data.content.topics} icon={BookOpen} />
                <Pair label={t('Từ vựng')} value={data.content.vocabulary} />
              </dl>
            </div>
          </Card>
        </div>
      </div>

      <p className="mt-6 text-xs text-on-page-muted">
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

/**
 * Bốn con số quy mô trong MỘT dải, các ô ngăn bằng đường kẻ 1px.
 *
 * Đường kẻ là nền `line` lộ ra qua khe `gap-px` giữa các ô nền trắng — cách này đúng ở
 * mọi kiểu xếp (2×2 trên màn hẹp, 4×1 trên màn rộng), còn `divide-x` chỉ đúng khi tất cả
 * nằm trên một hàng.
 */
function KpiStrip({ data }: { data: SystemOverview }): JSX.Element {
  const t = useT();

  return (
    <section
      aria-label={t('Quy mô người dùng')}
      className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line shadow-card lg:grid-cols-4"
    >
      <Kpi
        icon={Users}
        label={t('Người dùng')}
        value={data.users.total}
        hint={t('+{n} trong 7 ngày', { n: data.users.newLast7Days })}
      />
      <Kpi
        icon={Activity}
        label={t('Hoạt động 7 ngày')}
        value={data.users.activeLast7Days}
        hint={t('{percent}% tổng số người dùng', { percent: data.users.retention7Days })}
      />
      <Kpi
        icon={Clock}
        label={t('Học trong 24 giờ')}
        value={data.users.activeToday}
        hint={t('{n} lượt hoạt động / 7 ngày', { n: data.activity.last7Days })}
      />
      <Kpi
        icon={KeyRound}
        label={t('Phiên đang mở')}
        value={data.access.activeSessions}
        hint={t('{n} lượt đăng nhập / 7 ngày', { n: data.access.loginsLast7Days })}
      />
    </section>
  );
}

function Kpi({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  hint: string;
}): JSX.Element {
  const locale = useLocale();
  return (
    <div className="bg-surface p-4 sm:p-5">
      <p className="flex items-center gap-2 text-sm text-content-muted">
        <Icon className="h-4 w-4 shrink-0 text-brand-strong" aria-hidden />
        <span className="truncate">{label}</span>
      </p>
      <p className="mt-2 text-2xl font-bold tabular-nums text-content">{value.toLocaleString(locale)}</p>
      <p className="mt-1 truncate text-xs text-content-muted">{hint}</p>
    </div>
  );
}

/**
 * Việc cần xử lý: mỗi dòng một hàng chờ hoặc một dấu hiệu bất thường, dẫn thẳng tới màn
 * xử lý nó. Dòng luôn còn đó khi hàng chờ trống — chỉ chuyển sang trạng thái đã xong,
 * để quản trị viên biết là đã kiểm chứ không phải trang quên hiện.
 *
 * Hai hàng chờ lấy số từ chính API danh sách của màn xử lý (`pageSize = 1`, đọc `total`)
 * — không dựng endpoint đếm riêng, để con số ở đây không bao giờ lệch với danh sách bên đó.
 */
function ActionCard({ data }: { data: SystemOverview }): JSX.Element {
  const t = useT();
  const resetRequests = useResetRequests({ tab: 'pending', page: 1, pageSize: 1 });
  const reports = useStudySetReports({ status: StudySetReportStatus.PENDING, page: 1, pageSize: 1 });

  const failed = data.access.failedLast7Days;

  return (
    <Card className="h-full">
      <h2 className="flex items-center gap-2 font-semibold text-content">
        <ListChecks className="h-4 w-4 shrink-0 text-brand-strong" aria-hidden />
        {t('Việc cần xử lý')}
      </h2>

      <ul className="mt-2 divide-y divide-line">
        <li>
          <StatusRow
            icon={KeyRound}
            title={t('Yêu cầu cấp lại mật khẩu')}
            {...queueStatus(
              resetRequests,
              (n) => t('{n} yêu cầu chờ duyệt', { n }),
              t('Không có yêu cầu nào đang chờ'),
              t,
            )}
            to="/admin/requests"
          />
        </li>
        <li>
          <StatusRow
            icon={Flag}
            title={t('Báo cáo bộ thẻ')}
            {...queueStatus(
              reports,
              (n) => t('{n} báo cáo chờ xử lý', { n }),
              t('Không có báo cáo nào đang chờ'),
              t,
            )}
            to="/admin/study-sets"
          />
        </li>
        <li>
          <StatusRow
            icon={ShieldAlert}
            title={t('Đăng nhập thất bại')}
            status={
              failed > 0 ? t('{n} lần trong 7 ngày qua', { n: failed }) : t('Không có lần nào trong 7 ngày qua')
            }
            tone={failed > 0 ? 'warn' : 'done'}
            to="/admin/access"
          />
        </li>
      </ul>
    </Card>
  );
}

/**
 * Tình trạng của một hàng chờ từ kết quả truy vấn danh sách. "Không có gì đang chờ" chỉ
 * được nói khi số đã về thật — lúc đang tải hay lúc lỗi mà nói hàng chờ trống là nói sai.
 */
function queueStatus(
  query: { data?: { total: number }; isError: boolean },
  pending: (n: number) => string,
  empty: string,
  t: TranslateFn,
): { status: string; tone: StatusTone } {
  if (!query.data) {
    return { status: query.isError ? t('Chưa tải được') : t('Đang tải…'), tone: 'neutral' };
  }
  return query.data.total > 0
    ? { status: pending(query.data.total), tone: 'pending' }
    : { status: empty, tone: 'done' };
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
 *
 * Danh sách giãn đều theo chiều cao thẻ để khớp với thẻ "Việc cần xử lý" bên cạnh.
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

  if (total === 0) {
    return <p className="mt-4 text-sm text-content-muted">{t('Chưa có hoạt động nào được ghi nhận.')}</p>;
  }

  return (
    <ul className="mt-4 flex flex-1 flex-col justify-between gap-3">
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

/** Khung chờ theo đúng hình trang thật, để lúc số liệu về trang không nhảy bố cục. */
function OverviewSkeleton(): JSX.Element {
  return (
    <div className="space-y-4">
      <Skeleton className="h-14 w-72" />
      <Skeleton className="h-[112px] w-full rounded-xl" />
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-[280px] w-full rounded-xl" />
        <Skeleton className="h-[280px] w-full rounded-xl" />
      </div>
    </div>
  );
}

function formatUptime(seconds: number, t: TranslateFn): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours >= 24) return t('{days} ngày {hours} giờ', { days: Math.floor(hours / 24), hours: hours % 24 });
  if (hours > 0) return t('{hours} giờ {minutes} phút', { hours, minutes });
  return t('{n} phút', { n: minutes });
}
