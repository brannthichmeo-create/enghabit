import { AlertTriangle, Bell, Flame, Layers, Megaphone, Target, type LucideIcon } from 'lucide-react';
import { NotificationType } from '@enghabit/shared';
import type { TranslateFn } from '../../../shared/i18n/language';

/**
 * Cách hiển thị từng loại thông báo — dùng chung cho chuông và trang danh sách.
 *
 * Biểu tượng + màu đi kèm nhãn chữ, không bao giờ để màu là dấu hiệu duy nhất
 * (xem docs/color-rules.md).
 */

interface Display {
  icon: LucideIcon;
  label: string;
  /** Class màu cho biểu tượng. */
  tone: string;
}

const DISPLAY: Record<NotificationType, Display> = {
  [NotificationType.DAILY_REMINDER]: { icon: Bell, label: 'Nhắc học', tone: 'text-brand' },
  [NotificationType.STREAK_AT_RISK]: { icon: Flame, label: 'Chuỗi sắp đứt', tone: 'text-danger' },
  [NotificationType.REVIEW_DUE]: { icon: Layers, label: 'Tới hạn ôn', tone: 'text-brand' },
  [NotificationType.MISTAKES_PENDING]: { icon: AlertTriangle, label: 'Từ sai', tone: 'text-accent-ink' },
  [NotificationType.GOAL_ACHIEVED]: { icon: Target, label: 'Đạt mục tiêu', tone: 'text-success' },
  [NotificationType.ANNOUNCEMENT]: { icon: Megaphone, label: 'Thông báo', tone: 'text-brand-strong' },
};

export function displayFor(type: NotificationType): Display {
  return DISPLAY[type] ?? DISPLAY[NotificationType.ANNOUNCEMENT];
}

/**
 * Khoảng thời gian dạng "3 phút trước".
 * Mốc tuyệt đối ít có ý nghĩa với thông báo — người đọc quan tâm "mới hay cũ".
 */
export function timeAgo(iso: string, t: TranslateFn, locale: string): string {
  const seconds = Math.round((Date.now() - new Date(iso).getTime()) / 1000);

  if (seconds < 60) return t('vừa xong');
  if (seconds < 3600) return t('{n} phút trước', { n: Math.floor(seconds / 60) });
  if (seconds < 86_400) return t('{n} giờ trước', { n: Math.floor(seconds / 3600) });
  if (seconds < 7 * 86_400) return t('{n} ngày trước', { n: Math.floor(seconds / 86_400) });

  return new Date(iso).toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric' });
}
