import { AdminAction, AuditTargetType, UserRole, UserStatus, VocabLevel, type AuditValue } from '@enghabit/shared';
import type { TranslateFn } from '../../shared/i18n/language';
import { USER_STATUS_LABELS, VOCAB_LEVEL_LABELS } from '../../shared/lib/labels';

/**
 * Nhãn cho màn Nhật ký thao tác.
 *
 * Nhãn nằm trong BẢNG nên giữ tiếng Việt tại đây và dịch ở chỗ hiển thị — thêm dòng mới
 * vào các bảng này thì phải tự thêm bản dịch vào `en.ts`, script check:i18n không quét được.
 *
 * Mọi bảng tra bằng CHUỖI chứ không bằng enum: nhật ký giữ mãi dòng cũ, một thao tác đã
 * bỏ ở phiên bản sau vẫn phải hiện được. Chỗ gọi luôn có nhánh mặc định.
 */

export const AUDIT_ACTION_LABELS: Record<string, string> = {
  [AdminAction.USER_ROLE_CHANGED]: 'Đổi vai trò tài khoản',
  [AdminAction.USER_LOCKED]: 'Khoá tài khoản',
  [AdminAction.USER_UNLOCKED]: 'Mở khoá tài khoản',
  [AdminAction.USER_DELETED]: 'Xoá tài khoản',
  [AdminAction.RESET_REQUEST_APPROVED]: 'Duyệt yêu cầu cấp lại mật khẩu',
  [AdminAction.RESET_REQUEST_REJECTED]: 'Từ chối yêu cầu cấp lại mật khẩu',
  [AdminAction.ANNOUNCEMENT_SENT]: 'Gửi thông báo',
  [AdminAction.GROUP_WARNED]: 'Cảnh báo nhóm',
  [AdminAction.GROUP_BLOCKED]: 'Chặn nhóm',
  [AdminAction.GROUP_UNBLOCKED]: 'Mở chặn nhóm',
  [AdminAction.TOPIC_CREATED]: 'Thêm chủ đề',
  [AdminAction.TOPIC_UPDATED]: 'Sửa chủ đề',
  [AdminAction.TOPIC_DELETED]: 'Xoá chủ đề',
  [AdminAction.VOCABULARY_CREATED]: 'Thêm từ vựng',
  [AdminAction.VOCABULARY_UPDATED]: 'Sửa từ vựng',
  [AdminAction.VOCABULARY_DELETED]: 'Xoá từ vựng',
  [AdminAction.STUDY_SET_REPORT_DISMISSED]: 'Bỏ qua báo cáo bộ thẻ',
  [AdminAction.STUDY_SET_BLOCKED]: 'Chặn bộ thẻ',
  [AdminAction.STUDY_SET_UNBLOCKED]: 'Mở chặn bộ thẻ',
  [AdminAction.FEATURE_ENABLED]: 'Bật tính năng',
  [AdminAction.FEATURE_DISABLED]: 'Tắt tính năng',
  [AdminAction.SHOP_TYPE_CREATED]: 'Thêm loại vật phẩm',
  [AdminAction.SHOP_TYPE_UPDATED]: 'Sửa loại vật phẩm',
  [AdminAction.SHOP_TYPE_DELETED]: 'Xoá loại vật phẩm',
  [AdminAction.SHOP_ITEM_CREATED]: 'Thêm vật phẩm',
  [AdminAction.SHOP_ITEM_UPDATED]: 'Sửa vật phẩm',
  [AdminAction.SHOP_ITEM_DELETED]: 'Xoá vật phẩm',
  [AdminAction.SHOP_ITEM_IMAGE_DELETED]: 'Gỡ ảnh vật phẩm',
  [AdminAction.POST_DELETED]: 'Xoá bài viết',
  [AdminAction.COMMENT_DELETED]: 'Xoá bình luận',
};

/** Thứ tự cũng là thứ tự trong ô lọc — xếp theo thứ tự các mục ở thanh bên của quản trị viên. */
export const AUDIT_TARGET_LABELS: Record<string, string> = {
  [AuditTargetType.USER]: 'Tài khoản',
  [AuditTargetType.RESET_REQUEST]: 'Yêu cầu cấp lại mật khẩu',
  [AuditTargetType.TOPIC]: 'Chủ đề',
  [AuditTargetType.VOCABULARY]: 'Từ vựng',
  [AuditTargetType.ANNOUNCEMENT]: 'Thông báo',
  [AuditTargetType.FEATURE]: 'Tính năng',
  [AuditTargetType.GROUP]: 'Nhóm lớp',
  [AuditTargetType.STUDY_SET]: 'Bộ thẻ',
  [AuditTargetType.STUDY_SET_REPORT]: 'Báo cáo bộ thẻ',
  [AuditTargetType.SHOP_TYPE]: 'Loại vật phẩm',
  [AuditTargetType.SHOP_ITEM]: 'Vật phẩm',
  [AuditTargetType.POST]: 'Bài viết',
  [AuditTargetType.COMMENT]: 'Bình luận',
};

/** Tên hiển thị của từng trường trong phần "đã đổi gì". */
export const AUDIT_FIELD_LABELS: Record<string, string> = {
  role: 'Vai trò',
  status: 'Trạng thái',
  word: 'Từ',
  meaning: 'Nghĩa',
  phonetic: 'Phiên âm',
  example: 'Ví dụ',
  audioUrl: 'Âm thanh',
  name: 'Tên',
  label: 'Tên loại',
  slug: 'Mã loại',
  description: 'Mô tả',
  level: 'Trình độ',
  sortOrder: 'Thứ tự',
  isActive: 'Đang hoạt động',
  isEnabled: 'Đang bật',
  typeId: 'Loại',
  price: 'Giá',
  image: 'Ảnh',
  recipients: 'Số người nhận',
  audience: 'Người nhận',
  link: 'Đường dẫn',
  body: 'Nội dung',
  blockedReason: 'Lý do chặn trước đó',
  resolvedReports: 'Báo cáo được khép lại',
  alsoDisabled: 'Tắt kèm',
  vocabularyCount: 'Số từ vựng',
};

/** Nhãn của phần ghi chú đi kèm — cùng một cột nhưng mang nghĩa khác nhau theo thao tác. */
export function noteLabel(action: string): string {
  switch (action) {
    case AdminAction.RESET_REQUEST_REJECTED:
    case AdminAction.GROUP_BLOCKED:
    case AdminAction.STUDY_SET_BLOCKED:
      return 'Lý do';
    case AdminAction.STUDY_SET_REPORT_DISMISSED:
      return 'Lý do người báo cáo';
    case AdminAction.GROUP_WARNED:
      return 'Nội dung cảnh báo';
    case AdminAction.ANNOUNCEMENT_SENT:
      return 'Nội dung';
    case AdminAction.USER_DELETED:
      return 'Email';
    case AdminAction.POST_DELETED:
    case AdminAction.COMMENT_DELETED:
      return 'Tác giả';
    case AdminAction.VOCABULARY_CREATED:
    case AdminAction.VOCABULARY_UPDATED:
    case AdminAction.VOCABULARY_DELETED:
      return 'Chủ đề';
    case AdminAction.SHOP_TYPE_DELETED:
      return 'Mã loại';
    default:
      return 'Ghi chú';
  }
}

/**
 * Tông của nhãn thao tác: xoá là đỏ, chặn/khoá/tắt/từ chối là vàng, tạo và mở lại là
 * xanh lá, còn lại là xanh thương hiệu. Nhãn luôn có chữ — màu chỉ để quét nhanh.
 */
export function actionTone(action: string): 'red' | 'amber' | 'green' | 'brand' {
  if (action.endsWith('_DELETED')) return 'red';
  if (
    action === AdminAction.USER_LOCKED ||
    action === AdminAction.FEATURE_DISABLED ||
    action === AdminAction.RESET_REQUEST_REJECTED ||
    action === AdminAction.GROUP_WARNED ||
    action.endsWith('_BLOCKED')
  ) {
    return 'amber';
  }
  if (
    action.endsWith('_CREATED') ||
    action.endsWith('_UNBLOCKED') ||
    action === AdminAction.USER_UNLOCKED ||
    action === AdminAction.FEATURE_ENABLED ||
    action === AdminAction.RESET_REQUEST_APPROVED
  ) {
    return 'green';
  }
  return 'brand';
}

const ROLE_LABELS: Record<string, string> = {
  [UserRole.ADMIN]: 'Quản trị viên',
  [UserRole.USER]: 'Người học',
};

/** Hiện một giá trị trong phần "đã đổi gì", theo đúng nghĩa của trường chứa nó. */
export function formatAuditValue(field: string, value: AuditValue, t: TranslateFn, locale: string): string {
  if (value === null) return '—';

  if (field === 'image') return value ? t('Có ảnh') : t('Không có ảnh');
  if (typeof value === 'boolean') return value ? t('Có') : t('Không');
  if (field === 'price' && typeof value === 'number') return t('{n} xu', { n: value.toLocaleString(locale) });
  if (typeof value === 'number') return value.toLocaleString(locale);

  if (field === 'role') return t(ROLE_LABELS[value] ?? value);
  if (field === 'audience') return value === 'ALL' ? t('Tất cả người dùng') : t(ROLE_LABELS[value] ?? value);
  if (field === 'status' && value in USER_STATUS_LABELS) return t(USER_STATUS_LABELS[value as UserStatus]);
  if (field === 'level' && value in VOCAB_LEVEL_LABELS) return t(VOCAB_LEVEL_LABELS[value as VocabLevel]);

  // Nội dung do người dùng hoặc quản trị viên nhập — hiện nguyên văn, không dịch.
  return value;
}
