import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, type LucideIcon } from 'lucide-react';

/**
 * Một dòng trạng thái trong danh sách: biểu tượng, tên việc, tình trạng, và một đích bấm.
 *
 * Dùng cho danh sách "Việc hôm nay" ở trang Tổng quan, nơi các việc của nhiều tính năng
 * (ôn tập, thói quen, điểm danh, nhiệm vụ) phải trông như MỘT danh sách chứ không phải
 * mỗi tính năng một kiểu hộp. Dòng không tự vẽ khung — danh sách đã nằm trong thẻ, khung
 * lồng trong khung chỉ thêm viền mà không thêm nghĩa.
 *
 * Một dòng chỉ có MỘT đích bấm: có `to` thì cả dòng là liên kết, còn không thì đích bấm
 * là `action` ở cuối dòng. Hai đích trên cùng một dòng thì bấm trượt là đi nhầm chỗ.
 */

export type StatusTone = 'pending' | 'reward' | 'warn' | 'done' | 'neutral';

/**
 * Còn việc thì xanh thương hiệu, có thưởng chờ nhận thì vàng, có dấu hiệu bất thường cần
 * để mắt (vd đăng nhập thất bại) thì đỏ, xong rồi thì lặng đi.
 */
const TILE: Record<StatusTone, string> = {
  pending: 'bg-brand-soft text-brand-strong',
  reward: 'bg-accent-soft text-accent-ink',
  warn: 'bg-danger-soft text-danger',
  done: 'bg-success-soft text-success',
  neutral: 'bg-sunken text-content-muted',
};

const STATUS: Record<StatusTone, string> = {
  pending: 'font-medium text-brand-strong',
  reward: 'font-medium text-accent-ink',
  warn: 'font-medium text-danger',
  done: 'text-success',
  neutral: 'text-content-muted',
};

export function StatusRow({
  icon: Icon,
  title,
  status,
  tone = 'neutral',
  to,
  action,
}: {
  icon: LucideIcon;
  title: string;
  /** Tình trạng bằng CHỮ — màu chỉ nhấn thêm, không bao giờ là dấu hiệu duy nhất. */
  status: ReactNode;
  tone?: StatusTone;
  to?: string;
  action?: ReactNode;
}): JSX.Element {
  const body = (
    <>
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${TILE[tone]}`}>
        <Icon className="h-4 w-4" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-content">{title}</span>
        <span className={`block text-xs ${STATUS[tone]}`}>{status}</span>
      </span>
    </>
  );

  if (to) {
    return (
      <Link
        to={to}
        className="-mx-2 flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-sunken"
      >
        {body}
        <ChevronRight className="h-4 w-4 shrink-0 text-content-muted" aria-hidden />
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-3 py-2.5">
      {body}
      {action && <span className="shrink-0">{action}</span>}
    </div>
  );
}
