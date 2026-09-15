import { describe, expect, it } from 'vitest';
import { ChoiceDirection, StudyMode, StudySource } from '@enghabit/shared';
import { attemptKeyOf, decodeQuestionToken, encodeQuestionToken } from './question-token.js';

const PAYLOAD = {
  userId: 7,
  cardId: 42,
  source: StudySource.LEARN,
  mode: StudyMode.MULTIPLE_CHOICE,
  direction: ChoiceDirection.WORD_TO_MEANING,
  correctIndex: 2,
};

describe('mã câu hỏi', () => {
  it('giải mã ra đúng nội dung đã mã hoá', () => {
    const decoded = decodeQuestionToken(encodeQuestionToken(PAYLOAD), 7);
    expect(decoded).toMatchObject(PAYLOAD);
  });

  it('không lộ vị trí đáp án khi đọc mã dạng base64', () => {
    const raw = Buffer.from(encodeQuestionToken(PAYLOAD), 'base64url').toString('utf8');
    expect(raw).not.toContain('correctIndex');
    expect(raw).not.toContain('"cardId"');
  });

  it('người khác không nộp được mã của mình', () => {
    const token = encodeQuestionToken(PAYLOAD);
    expect(() => decodeQuestionToken(token, 8)).toThrow();
  });

  it('mã bị sửa một ký tự thì bị từ chối', () => {
    const token = encodeQuestionToken(PAYLOAD);
    const last = token.at(-1) === 'A' ? 'B' : 'A';
    expect(() => decodeQuestionToken(`${token.slice(0, -1)}${last}`, 7)).toThrow();
  });

  it('chuỗi rác bị từ chối', () => {
    expect(() => decodeQuestionToken('khong-phai-ma', 7)).toThrow();
  });

  it('cùng một thẻ phát hai lần ra hai khoá nộp khác nhau', () => {
    expect(attemptKeyOf(encodeQuestionToken(PAYLOAD))).not.toBe(attemptKeyOf(encodeQuestionToken(PAYLOAD)));
  });

  it('cùng một mã luôn ra cùng khoá nộp — bấm hai lần bị chặn trùng', () => {
    const token = encodeQuestionToken(PAYLOAD);
    expect(attemptKeyOf(token)).toBe(attemptKeyOf(token));
    expect(attemptKeyOf(token)).toHaveLength(64);
  });
});
