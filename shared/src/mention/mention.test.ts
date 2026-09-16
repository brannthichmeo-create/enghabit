import { describe, expect, it } from 'vitest';
import { MENTION_ALL, matchMentions, parseMentions, type MentionTarget } from './mention.js';

const MEMBERS: MentionTarget[] = [
  { userId: 1, name: 'Trần Long', username: 'long.tran' },
  { userId: 2, name: 'Nguyễn An', username: 'an_nguyen' },
  { userId: 3, name: 'Lê Minh', username: 'minh' },
];

describe('parseMentions', () => {
  it('lấy tên tài khoản sau dấu @', () => {
    expect(parseMentions('chào @long.tran và @minh nhé')).toEqual(['long.tran', 'minh']);
  });

  it('bỏ trùng và hạ chữ thường', () => {
    expect(parseMentions('@Minh @minh @MINH')).toEqual(['minh']);
  });

  it('bỏ dấu câu dính ở cuối', () => {
    expect(parseMentions('cảm ơn @minh.')).toEqual(['minh']);
  });

  it('không coi đuôi email là một lượt nhắc', () => {
    expect(parseMentions('gửi về long@vidu.com giúp mình')).toEqual([]);
  });

  it('bỏ tên ngắn hơn 3 ký tự vì không thể là tên tài khoản', () => {
    expect(parseMentions('@ab xin chào')).toEqual([]);
  });

  it('nhận ra @all', () => {
    expect(parseMentions('@all họp lúc 8h')).toEqual([MENTION_ALL]);
  });
});

describe('matchMentions', () => {
  it('chỉ trả về người có trong danh sách', () => {
    const result = matchMentions('@minh @khongcoai', MEMBERS, 99);
    expect(result.map((m) => m.userId)).toEqual([3]);
  });

  it('@all trả về mọi người trừ người viết', () => {
    const result = matchMentions('@all nhớ làm bài', MEMBERS, 2);
    expect(result.map((m) => m.userId)).toEqual([1, 3]);
  });

  it('không nhắc chính người viết', () => {
    expect(matchMentions('@minh tự nhắc mình', MEMBERS, 3)).toEqual([]);
  });

  it('văn bản không có @ thì không tốn công đối chiếu', () => {
    expect(matchMentions('bài này hay quá', MEMBERS, 1)).toEqual([]);
  });
});
