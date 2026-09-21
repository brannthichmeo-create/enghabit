/**
 * Danh mục thao tác của quản trị viên được ghi vào nhật ký (`admin_audit_logs`).
 *
 * Danh mục nằm trong MÃ NGUỒN, cột DB chỉ là chuỗi — cùng lý do với `FeatureKey`: thêm
 * một thao tác mới là thêm code, không phải migrate lại enum của bảng. Bảng này chỉ
 * THÊM dòng, nên một giá trị lạ từ phiên bản cũ vẫn đọc được: FE có nhánh mặc định.
 */

/** Loại đối tượng bị tác động — dùng để lọc nhật ký theo từng màn quản lý. */
export const AuditTargetType = {
  USER: 'USER',
  RESET_REQUEST: 'RESET_REQUEST',
  ANNOUNCEMENT: 'ANNOUNCEMENT',
  GROUP: 'GROUP',
  TOPIC: 'TOPIC',
  VOCABULARY: 'VOCABULARY',
  STUDY_SET: 'STUDY_SET',
  STUDY_SET_REPORT: 'STUDY_SET_REPORT',
  FEATURE: 'FEATURE',
  SHOP_TYPE: 'SHOP_TYPE',
  SHOP_ITEM: 'SHOP_ITEM',
  POST: 'POST',
  COMMENT: 'COMMENT',
} as const;
export type AuditTargetType = (typeof AuditTargetType)[keyof typeof AuditTargetType];

export const AdminAction = {
  USER_ROLE_CHANGED: 'USER_ROLE_CHANGED',
  USER_LOCKED: 'USER_LOCKED',
  USER_UNLOCKED: 'USER_UNLOCKED',
  USER_DELETED: 'USER_DELETED',

  RESET_REQUEST_APPROVED: 'RESET_REQUEST_APPROVED',
  RESET_REQUEST_REJECTED: 'RESET_REQUEST_REJECTED',

  ANNOUNCEMENT_SENT: 'ANNOUNCEMENT_SENT',

  GROUP_WARNED: 'GROUP_WARNED',
  GROUP_BLOCKED: 'GROUP_BLOCKED',
  GROUP_UNBLOCKED: 'GROUP_UNBLOCKED',

  TOPIC_CREATED: 'TOPIC_CREATED',
  TOPIC_UPDATED: 'TOPIC_UPDATED',
  TOPIC_DELETED: 'TOPIC_DELETED',

  VOCABULARY_CREATED: 'VOCABULARY_CREATED',
  VOCABULARY_UPDATED: 'VOCABULARY_UPDATED',
  VOCABULARY_DELETED: 'VOCABULARY_DELETED',

  STUDY_SET_REPORT_DISMISSED: 'STUDY_SET_REPORT_DISMISSED',
  STUDY_SET_BLOCKED: 'STUDY_SET_BLOCKED',
  STUDY_SET_UNBLOCKED: 'STUDY_SET_UNBLOCKED',

  FEATURE_ENABLED: 'FEATURE_ENABLED',
  FEATURE_DISABLED: 'FEATURE_DISABLED',

  SHOP_TYPE_CREATED: 'SHOP_TYPE_CREATED',
  SHOP_TYPE_UPDATED: 'SHOP_TYPE_UPDATED',
  SHOP_TYPE_DELETED: 'SHOP_TYPE_DELETED',
  SHOP_ITEM_CREATED: 'SHOP_ITEM_CREATED',
  SHOP_ITEM_UPDATED: 'SHOP_ITEM_UPDATED',
  SHOP_ITEM_DELETED: 'SHOP_ITEM_DELETED',
  SHOP_ITEM_IMAGE_DELETED: 'SHOP_ITEM_IMAGE_DELETED',

  POST_DELETED: 'POST_DELETED',
  COMMENT_DELETED: 'COMMENT_DELETED',
} as const;
export type AdminAction = (typeof AdminAction)[keyof typeof AdminAction];

/**
 * Mỗi thao tác thuộc đúng MỘT loại đối tượng. Chỗ ghi chỉ truyền thao tác, loại đối
 * tượng suy ra từ bảng này — hai tham số rời nhau thì sớm muộn sẽ có dòng ghi
 * "xoá vật phẩm" mà loại lại là "chủ đề".
 */
export const AUDIT_ACTION_TARGET: Record<AdminAction, AuditTargetType> = {
  USER_ROLE_CHANGED: AuditTargetType.USER,
  USER_LOCKED: AuditTargetType.USER,
  USER_UNLOCKED: AuditTargetType.USER,
  USER_DELETED: AuditTargetType.USER,
  RESET_REQUEST_APPROVED: AuditTargetType.RESET_REQUEST,
  RESET_REQUEST_REJECTED: AuditTargetType.RESET_REQUEST,
  ANNOUNCEMENT_SENT: AuditTargetType.ANNOUNCEMENT,
  GROUP_WARNED: AuditTargetType.GROUP,
  GROUP_BLOCKED: AuditTargetType.GROUP,
  GROUP_UNBLOCKED: AuditTargetType.GROUP,
  TOPIC_CREATED: AuditTargetType.TOPIC,
  TOPIC_UPDATED: AuditTargetType.TOPIC,
  TOPIC_DELETED: AuditTargetType.TOPIC,
  VOCABULARY_CREATED: AuditTargetType.VOCABULARY,
  VOCABULARY_UPDATED: AuditTargetType.VOCABULARY,
  VOCABULARY_DELETED: AuditTargetType.VOCABULARY,
  STUDY_SET_REPORT_DISMISSED: AuditTargetType.STUDY_SET_REPORT,
  STUDY_SET_BLOCKED: AuditTargetType.STUDY_SET,
  STUDY_SET_UNBLOCKED: AuditTargetType.STUDY_SET,
  FEATURE_ENABLED: AuditTargetType.FEATURE,
  FEATURE_DISABLED: AuditTargetType.FEATURE,
  SHOP_TYPE_CREATED: AuditTargetType.SHOP_TYPE,
  SHOP_TYPE_UPDATED: AuditTargetType.SHOP_TYPE,
  SHOP_TYPE_DELETED: AuditTargetType.SHOP_TYPE,
  SHOP_ITEM_CREATED: AuditTargetType.SHOP_ITEM,
  SHOP_ITEM_UPDATED: AuditTargetType.SHOP_ITEM,
  SHOP_ITEM_DELETED: AuditTargetType.SHOP_ITEM,
  SHOP_ITEM_IMAGE_DELETED: AuditTargetType.SHOP_ITEM,
  POST_DELETED: AuditTargetType.POST,
  COMMENT_DELETED: AuditTargetType.COMMENT,
};

/** Một giá trị trong nhật ký: đã ép về kiểu nguyên thuỷ để hiển thị được ở mọi nơi. */
export type AuditValue = string | number | boolean | null;

/** Các trường bị đổi trong một lần sửa: `{ price: { from: 100, to: 120 } }`. */
export type AuditChanges = Record<string, { from: AuditValue; to: AuditValue }>;
