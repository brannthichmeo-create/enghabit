import { z } from 'zod';
import {
  GroupJoinStatus,
  GroupMemberRole,
  GroupVisibility,
  StudySetVisibility,
  VocabLevel,
} from '../constants/enums.js';

/**
 * Nhóm lớp — không gian trao đổi nội bộ do chính người học tạo ra.
 *
 * Mọi người dùng đều tạo được nhóm; người tạo thành trưởng nhóm đầu tiên. Nhóm công
 * khai tìm được bằng tên, nhóm riêng tư chỉ vào được nếu biết mã 8 số.
 */

/**
 * Mã nhóm gồm đúng 8 CHỮ SỐ, sinh ngẫu nhiên và duy nhất toàn hệ thống.
 *
 * Dùng chữ số thay vì chữ cái để đọc qua điện thoại không nhầm (không có cặp O/0,
 * I/l). Độ dài 8 cho 90 triệu tổ hợp — đủ thưa để đoán mò không ra nhóm riêng tư.
 */
export const GROUP_CODE_LENGTH = 8;

export const groupCodeSchema = z
  .string()
  .trim()
  .regex(/^\d{8}$/, 'Mã nhóm gồm đúng 8 chữ số');

export const createGroupSchema = z.object({
  name: z.string().trim().min(3, 'Tên nhóm phải có ít nhất 3 ký tự').max(120),
  /** Không bắt buộc — nhóm nhỏ thường chỉ cần cái tên. */
  description: z.string().trim().max(500, 'Mô tả tối đa 500 ký tự').optional(),
  visibility: z.nativeEnum(GroupVisibility).default(GroupVisibility.PUBLIC),
  /**
   * Bật thì người xin vào phải chờ trưởng nhóm duyệt; tắt thì vào được ngay.
   *
   * Mặc định BẬT: nhóm mới lập thường là lớp học có danh sách cố định, để tắt sẵn
   * thì bất kỳ ai dò trúng mã cũng vào thẳng được mà không ai hay.
   */
  requireApproval: z.boolean().default(true),
});
export type CreateGroupInput = z.infer<typeof createGroupSchema>;

/** Sửa nhóm: gửi trường nào sửa trường đó. */
export const updateGroupSchema = createGroupSchema.partial();
export type UpdateGroupInput = z.infer<typeof updateGroupSchema>;

export const groupSearchSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(12),
  /** Tìm trong tên và mô tả nhóm. Chỉ áp dụng cho nhóm công khai. */
  search: z.string().trim().max(120).optional(),
});
export type GroupSearchInput = z.infer<typeof groupSearchSchema>;

/** Xin vào nhóm. Lời nhắn để trưởng nhóm biết ai đang xin vào. */
export const joinGroupSchema = z.object({
  message: z.string().trim().max(300).optional(),
});
export type JoinGroupInput = z.infer<typeof joinGroupSchema>;

/** Trưởng nhóm thêm thẳng một người bằng tên tài khoản hoặc email. */
export const addMemberSchema = z.object({
  identifier: z.string().trim().min(1, 'Nhập tên tài khoản hoặc email').max(190),
});
export type AddMemberInput = z.infer<typeof addMemberSchema>;

export const updateMemberRoleSchema = z.object({
  role: z.nativeEnum(GroupMemberRole),
});
export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>;

// --- Kiểu dữ liệu trả về ---

/** Quan hệ giữa người đang xem với một nhóm — quyết định nút nào hiện ra. */
export const GroupViewerState = {
  /** Chưa liên quan gì, thấy nút "Xin vào nhóm" */
  NONE: 'NONE',
  /** Đã gửi yêu cầu, đang chờ duyệt */
  PENDING: 'PENDING',
  MEMBER: 'MEMBER',
  LEADER: 'LEADER',
} as const;
export type GroupViewerState = (typeof GroupViewerState)[keyof typeof GroupViewerState];

/**
 * Thông tin nhóm bị chặn.
 *
 * `reason` viết cho THÀNH VIÊN đọc, không phải ghi chú nội bộ của quản trị viên —
 * đây chính là dòng hiện ra khi họ mở nhóm bị chặn.
 */
export interface GroupBlockInfo {
  reason: string;
  blockedAt: string;
  /** Tên quản trị viên đã chặn. Null nếu tài khoản đó đã bị xoá. */
  blockedBy: string | null;
}

export interface GroupSummary {
  id: number;
  code: string;
  name: string;
  description: string | null;
  visibility: GroupVisibility;
  requireApproval: boolean;
  memberCount: number;
  postCount: number;
  createdAt: string;
  viewerState: GroupViewerState;
  /** Số yêu cầu đang chờ — chỉ có giá trị khi người xem là trưởng nhóm. */
  pendingCount: number;
  /** Null nghĩa là nhóm đang hoạt động bình thường. */
  block: GroupBlockInfo | null;
}

export interface GroupMemberRow {
  userId: number;
  name: string;
  username: string;
  role: GroupMemberRole;
  joinedAt: string;
  /** Số hoạt động học của thành viên, để trưởng nhóm thấy ai đang học đều. */
  activityCount: number;
  currentStreak: number;
  /**
   * Khung viền đang dùng — URL ảnh DƯỚI GỐC API, tầng api của frontend tự ghép như ảnh
   * vật phẩm. `null` = khung mặc định (viền trắng), vẽ bằng CSS chứ không phải ảnh.
   *
   * Cũng là `null` khi quản trị viên tắt Cửa hàng: tắt là đảo ngược được, khung vẫn nằm
   * trong kho của người dùng và hiện lại khi bật (xem shop.frame.ts).
   */
  avatarFrameUrl: string | null;
}

export interface GroupJoinRequestRow {
  userId: number;
  name: string;
  username: string;
  message: string | null;
  status: GroupJoinStatus;
  createdAt: string;
}

export interface GroupDetail extends GroupSummary {
  members: GroupMemberRow[];
  /** Chỉ trả về cho trưởng nhóm; người thường nhận mảng rỗng. */
  pendingRequests: GroupJoinRequestRow[];
}

/** Kết quả sau khi bấm xin vào nhóm — nhóm tắt phê duyệt thì vào thẳng. */
export interface JoinGroupResult {
  state: GroupViewerState;
  /** true nghĩa là đã là thành viên ngay, không phải chờ duyệt. */
  joined: boolean;
}

// --- Tài liệu nhóm ---

/**
 * Tài liệu nhóm KHÔNG có bảng riêng: nó chính là tệp đính kèm của các bài đăng trong
 * nhóm, xếp theo bài mới nhất.
 *
 * Dựng một kho tệp thứ hai sẽ có hai đường tải lên, hai chỗ kiểm định dạng và hai chỗ
 * phải kiểm tra tư cách thành viên — mà tệp đính kèm của community đã làm đủ cả ba.
 * Tải về vẫn đi qua đúng endpoint `/community/attachments/:id`.
 */
export const groupDocumentQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
  /** Tìm theo tên tệp. */
  search: z.string().trim().max(255).optional(),
});
export type GroupDocumentQueryInput = z.infer<typeof groupDocumentQuerySchema>;

export interface GroupDocumentRow {
  /** Id của `PostAttachment` — dùng thẳng cho endpoint tải tệp. */
  id: number;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  isImage: boolean;
  /** Thời điểm bài mang tệp này được đăng. */
  createdAt: string;
  /** Bài đăng đã mang tệp lên, để mở lại ngữ cảnh trao đổi. */
  postId: number;
  postTitle: string;
  uploaderName: string;
}

// --- Bộ thẻ chia sẻ trong nhóm ---

/**
 * Trưởng nhóm chia sẻ một bộ thẻ của CHÍNH MÌNH vào nhóm.
 *
 * Chia sẻ không đổi gì trong Thư viện: bộ riêng tư vẫn riêng tư với người ngoài nhóm,
 * bộ công khai vẫn công khai. Nó chỉ mở thêm quyền đọc/học cho thành viên nhóm.
 */
export const shareStudySetSchema = z.object({
  setId: z.number().int().positive(),
});
export type ShareStudySetInput = z.infer<typeof shareStudySetSchema>;

export interface GroupStudySetRow {
  setId: number;
  name: string;
  description: string | null;
  level: VocabLevel;
  cardCount: number;
  /**
   * Chế độ của bộ thẻ trong Thư viện — hiện để trưởng nhóm biết mình đang chia sẻ bộ
   * riêng tư hay bộ công khai. Trong nhóm thì bộ nào cũng là nội bộ.
   */
  visibility: StudySetVisibility;
  /** Người đã chia sẻ bộ này vào nhóm. Null nếu tài khoản đó đã bị xoá. */
  sharedByName: string | null;
  sharedAt: string;
  /** Người đang xem có phải chủ bộ thẻ không — chủ mới sửa được nội dung ở Thư viện. */
  isOwner: boolean;
}

// --- Dành cho quản trị viên ---

export const adminGroupQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  /** Tìm theo tên nhóm hoặc mã 8 số. */
  search: z.string().trim().max(120).optional(),
  visibility: z.nativeEnum(GroupVisibility).optional(),
  /** `blocked` chỉ nhóm đang bị chặn, `active` chỉ nhóm bình thường. */
  status: z.enum(['all', 'active', 'blocked']).default('all'),
  sort: z.enum(['newest', 'members', 'posts']).default('newest'),
});
export type AdminGroupQueryInput = z.infer<typeof adminGroupQuerySchema>;

export const blockGroupSchema = z.object({
  /**
   * Lý do chặn, BẮT BUỘC. Thành viên nhóm sẽ đọc đúng câu này khi mở nhóm, nên chặn
   * mà không nói lý do là để họ tự đoán — và trưởng nhóm không biết phải sửa gì.
   */
  reason: z.string().trim().min(10, 'Lý do phải có ít nhất 10 ký tự').max(500),
});
export type BlockGroupInput = z.infer<typeof blockGroupSchema>;

export const warnGroupSchema = z.object({
  message: z.string().trim().min(10, 'Nội dung cảnh báo phải có ít nhất 10 ký tự').max(500),
});
export type WarnGroupInput = z.infer<typeof warnGroupSchema>;

/** Một dòng trong bảng quản lý nhóm của quản trị viên. */
export interface AdminGroupRow extends Omit<GroupSummary, 'viewerState' | 'pendingCount'> {
  /**
   * Trưởng nhóm HIỆN TẠI, không phải người lập nhóm.
   *
   * Người lập có thể đã rời nhóm hoặc bị hạ quyền từ lâu; khi cần liên hệ về một vi
   * phạm thì phải gọi đúng người đang điều hành. Mảng vì một nhóm có nhiều trưởng nhóm.
   */
  leaders: { id: number; name: string; username: string }[];
  pendingCount: number;
  lastPostAt: string | null;
}

/** Hồ sơ đầy đủ một nhóm, mở từ bảng quản lý. */
export interface AdminGroupDetail extends AdminGroupRow {
  members: GroupMemberRow[];
  /** Vài bài gần nhất để quản trị viên xem nhóm đang trao đổi gì. */
  recentPosts: { id: number; title: string; authorName: string; createdAt: string }[];
}
