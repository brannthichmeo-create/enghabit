import { z } from 'zod';
import { StudySetReportStatus, StudySetVisibility, VocabLevel } from '../constants/enums.js';
import { STUDY_SET_SEARCH_MAX_LENGTH } from '../study/study.js';

/**
 * Thư viện bộ thẻ.
 *
 * Bộ thẻ lưu trong bảng `topics` (mở rộng thêm chủ sở hữu và chế độ hiển thị), thẻ lưu
 * trong `vocabularies`. Bộ của quản trị viên có `ownerId` null và hiện tác giả "Hệ thống".
 * Đặc tả: docs/ke-hoach-hoc-on-flashcard.md.
 */

export const createStudySetSchema = z.object({
  name: z.string().trim().min(1, 'Tên bộ thẻ không được để trống').max(120),
  description: z.string().trim().max(1000, 'Mô tả tối đa 1000 ký tự').optional(),
  level: z.nativeEnum(VocabLevel),
  /**
   * Mặc định RIÊNG TƯ: bộ vừa tạo thường còn trống hoặc đang soạn dở, để công khai sẵn
   * thì người khác mở ra thấy một bộ rỗng.
   */
  visibility: z.nativeEnum(StudySetVisibility).default(StudySetVisibility.PRIVATE),
});
export type CreateStudySetInput = z.infer<typeof createStudySetSchema>;

export const updateStudySetSchema = createStudySetSchema.partial();
export type UpdateStudySetInput = z.infer<typeof updateStudySetSchema>;

/** Một thẻ. Không có audio — xem mục "Không làm" của đặc tả. */
export const studySetCardSchema = z.object({
  word: z.string().trim().min(1, 'Từ không được để trống').max(100),
  meaning: z.string().trim().min(1, 'Nghĩa không được để trống').max(500),
  phonetic: z.string().trim().max(100).optional(),
  example: z.string().trim().max(500).optional(),
});
export type StudySetCardInput = z.infer<typeof studySetCardSchema>;

export const updateStudySetCardSchema = studySetCardSchema.partial();
export type UpdateStudySetCardInput = z.infer<typeof updateStudySetCardSchema>;

export const studySetSearchSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(12),
  /** Tìm trong tên và mô tả bộ thẻ công khai. */
  search: z
    .string()
    .trim()
    .max(STUDY_SET_SEARCH_MAX_LENGTH, `Từ khoá tối đa ${STUDY_SET_SEARCH_MAX_LENGTH} ký tự`)
    .optional(),
});
export type StudySetSearchInput = z.infer<typeof studySetSearchSchema>;

export const reportStudySetSchema = z.object({
  reason: z.string().trim().min(10, 'Lý do phải có ít nhất 10 ký tự').max(500),
});
export type ReportStudySetInput = z.infer<typeof reportStudySetSchema>;

// --- Kiểu dữ liệu trả về ---

export interface StudySetAuthor {
  /** Null với bộ thẻ "Hệ thống". */
  id: number | null;
  name: string | null;
  isSystem: boolean;
}

/** `reason` viết cho chủ bộ thẻ đọc — đây là dòng hiện ra khi họ mở bộ bị chặn. */
export interface StudySetBlockInfo {
  reason: string;
  blockedAt: string;
}

export interface StudySetSummary {
  id: number;
  name: string;
  description: string | null;
  level: VocabLevel;
  visibility: StudySetVisibility;
  cardCount: number;
  author: StudySetAuthor;
  isOwner: boolean;
  createdAt: string;
  updatedAt: string;
  /** Chỉ chủ bộ thẻ thấy giá trị này; người khác không bao giờ nhận được bộ đang bị chặn. */
  block: StudySetBlockInfo | null;
}

export interface StudySetCard {
  id: number;
  word: string;
  meaning: string;
  phonetic: string | null;
  example: string | null;
}

/** Tiến độ của NGƯỜI ĐANG XEM với bộ thẻ này — mỗi người một con số riêng. */
export interface StudySetProgress {
  total: number;
  new: number;
  due: number;
  overdue: number;
  weak: number;
  mastered: number;
}

export interface StudySetDetail extends StudySetSummary {
  cards: StudySetCard[];
  progress: StudySetProgress;
  /** Bộ có đủ thẻ để sinh câu trắc nghiệm không. */
  canMultipleChoice: boolean;
  /** Người xem đã gửi báo cáo còn chờ xử lý cho bộ này chưa. */
  hasPendingReport: boolean;
}

// --- Quản trị: báo cáo vi phạm ---

export const adminStudySetReportQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  status: z.nativeEnum(StudySetReportStatus).optional(),
});
export type AdminStudySetReportQueryInput = z.infer<typeof adminStudySetReportQuerySchema>;

export const blockStudySetSchema = z.object({
  /** Chủ bộ thẻ đọc đúng câu này, nên viết cho người dùng cuối chứ không phải ghi chú nội bộ. */
  reason: z.string().trim().min(10, 'Lý do phải có ít nhất 10 ký tự').max(500),
});
export type BlockStudySetInput = z.infer<typeof blockStudySetSchema>;

/** Nội dung một bộ thẻ để quản trị viên đọc trước khi chặn. */
export interface AdminStudySetDetail {
  id: number;
  name: string;
  description: string | null;
  level: VocabLevel;
  visibility: StudySetVisibility;
  cardCount: number;
  /** Null với bộ "Hệ thống". */
  owner: { id: number; name: string; username: string } | null;
  block: StudySetBlockInfo | null;
  createdAt: string;
  cards: StudySetCard[];
}

export interface AdminStudySetReportRow {
  id: number;
  reason: string;
  status: StudySetReportStatus;
  createdAt: string;
  resolvedAt: string | null;
  reporter: { id: number; name: string; username: string };
  resolvedBy: string | null;
  studySet: {
    id: number;
    name: string;
    visibility: StudySetVisibility;
    cardCount: number;
    owner: { id: number; name: string; username: string } | null;
    block: StudySetBlockInfo | null;
  };
}
