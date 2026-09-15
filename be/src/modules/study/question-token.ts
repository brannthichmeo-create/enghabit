import crypto from 'node:crypto';
import type { ChoiceDirection, StudyMode, StudySource } from '@enghabit/shared';
import { env } from '../../config/env.js';
import { BadRequestError } from '../../common/errors/app-error.js';

/**
 * Mã câu hỏi — cách server "nhớ" đề đã phát mà không cần bảng phiên.
 *
 * Mã là nội dung đề (thẻ nào, đáp án ở vị trí nào) được MÃ HOÁ bằng AES-256-GCM:
 * - client không đọc được vị trí đáp án đúng, nên đáp án không rời server trước khi chọn;
 * - client không sửa được mã (GCM kiểm tra toàn vẹn), nên không tự đổi đề thành dễ hơn;
 * - mã gắn với `userId`, người khác nhặt được cũng không nộp thay được.
 *
 * Chỉ ký (HMAC) là KHÔNG ĐỦ: nội dung ký vẫn đọc được bằng base64, lộ luôn đáp án.
 */

export interface QuestionTokenPayload {
  userId: number;
  cardId: number;
  source: StudySource;
  mode: StudyMode;
  /** Chỉ có ở câu trắc nghiệm. */
  direction?: ChoiceDirection;
  correctIndex?: number;
  issuedAt: number;
}

/** Mã quá hạn thì không nhận — đề phát từ hôm qua có thể đã khác quyền truy cập. */
const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

const IV_LENGTH = 12;
const TAG_LENGTH = 16;

/**
 * Khoá suy ra từ bí mật JWT kèm tiền tố riêng, để khoá này và khoá ký JWT không bao giờ
 * trùng nhau dù cùng nguồn.
 */
const KEY = crypto.createHash('sha256').update(`enghabit:question-token:${env.JWT_ACCESS_SECRET}`).digest();

const INVALID_MESSAGE = 'Câu hỏi không hợp lệ hoặc đã hết hạn — hãy tải lượt thẻ mới';

export function encodeQuestionToken(payload: Omit<QuestionTokenPayload, 'issuedAt'>): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-gcm', KEY, iv);
  const body = Buffer.concat([
    cipher.update(JSON.stringify({ ...payload, issuedAt: Date.now() }), 'utf8'),
    cipher.final(),
  ]);
  return Buffer.concat([iv, cipher.getAuthTag(), body]).toString('base64url');
}

export function decodeQuestionToken(token: string, userId: number): QuestionTokenPayload {
  let payload: QuestionTokenPayload;

  try {
    const raw = Buffer.from(token, 'base64url');
    const decipher = crypto.createDecipheriv('aes-256-gcm', KEY, raw.subarray(0, IV_LENGTH));
    decipher.setAuthTag(raw.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH));
    const plain = Buffer.concat([decipher.update(raw.subarray(IV_LENGTH + TAG_LENGTH)), decipher.final()]);
    payload = JSON.parse(plain.toString('utf8')) as QuestionTokenPayload;
  } catch {
    throw new BadRequestError(INVALID_MESSAGE);
  }

  if (payload.userId !== userId || Date.now() - payload.issuedAt > TOKEN_TTL_MS) {
    throw new BadRequestError(INVALID_MESSAGE);
  }
  return payload;
}

/**
 * Khoá chống nộp trùng. Mỗi lần phát là một mã khác nhau (IV ngẫu nhiên), nên cùng một
 * thẻ được phát ở hai lượt vẫn tính hai lần làm — còn bấm hai lần trên CÙNG một câu thì
 * ra cùng khoá và bị bảng `card_reviews` chặn.
 */
export function attemptKeyOf(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}
