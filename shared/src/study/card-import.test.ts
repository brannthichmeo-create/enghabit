import { describe, expect, it } from 'vitest';
import { CARD_IMPORT_MAX_ROWS } from './study.js';
import {
  CardImportRowStatus,
  buildCardImport,
  cardImportKey,
  detectColumns,
  normalizeHeader,
  parseCsv,
} from './card-import.js';

describe('parseCsv', () => {
  it('đọc dấu phẩy, bỏ BOM và dòng trống cuối file', () => {
    expect(parseCsv('﻿word,meaning\r\ngreeting,lời chào\r\n')).toEqual([
      ['word', 'meaning'],
      ['greeting', 'lời chào'],
    ]);
  });

  it('ô trong ngoặc kép giữ được dấu phẩy, xuống dòng và dấu ngoặc kép', () => {
    expect(parseCsv('word,example\nbank,"He said ""hi"", then\nleft"')).toEqual([
      ['word', 'example'],
      ['bank', 'He said "hi", then\nleft'],
    ]);
  });

  it('tự nhận dấu chấm phẩy của Excel vùng Việt Nam', () => {
    expect(parseCsv('từ;nghĩa\ngrocery;hàng tạp hoá, thực phẩm')).toEqual([
      ['từ', 'nghĩa'],
      ['grocery', 'hàng tạp hoá, thực phẩm'],
    ]);
  });

  it('tự nhận dấu tab', () => {
    expect(parseCsv('a\tb\nc\td')).toEqual([
      ['a', 'b'],
      ['c', 'd'],
    ]);
  });

  it('giữ ô trống ở giữa và cuối dòng', () => {
    expect(parseCsv('a,,c,\n')).toEqual([['a', '', 'c', '']]);
  });
});

describe('detectColumns', () => {
  it('nhận tên cột tiếng Việt có dấu, không theo thứ tự', () => {
    expect(detectColumns(['Nghĩa', 'Ví dụ', 'Từ vựng', 'Phiên âm'])).toEqual({
      hasHeader: true,
      columns: { meaning: 0, example: 1, word: 2, phonetic: 3 },
    });
  });

  it('thiếu cột Nghĩa thì không coi là dòng tên cột', () => {
    expect(detectColumns(['word', 'lời chào']).hasHeader).toBe(false);
  });

  it('chuẩn hoá tên cột', () => {
    expect(normalizeHeader('  Định Nghĩa ')).toBe('dinhnghia');
  });
});

describe('buildCardImport', () => {
  it('bỏ dòng tên cột, đánh số dòng theo Excel', () => {
    const preview = buildCardImport([
      ['word', 'meaning', 'phonetic', 'example'],
      ['greeting', 'lời chào', '/ˈɡriːtɪŋ/', ''],
    ]);
    expect(preview.hasHeader).toBe(true);
    expect(preview.cards).toEqual([{ word: 'greeting', meaning: 'lời chào', phonetic: '/ˈɡriːtɪŋ/' }]);
    expect(preview.rows[0]?.rowNumber).toBe(2);
  });

  it('không có tên cột thì đọc theo thứ tự Từ, Nghĩa, Phiên âm, Ví dụ', () => {
    const preview = buildCardImport([['weather', 'thời tiết', '', 'Nice weather today.']]);
    expect(preview.hasHeader).toBe(false);
    expect(preview.cards).toEqual([{ word: 'weather', meaning: 'thời tiết', example: 'Nice weather today.' }]);
  });

  it('bỏ qua dòng trống, báo lỗi dòng thiếu nghĩa', () => {
    const preview = buildCardImport([['word', 'meaning'], [null, ''], ['apple', '']]);
    expect(preview.cards).toHaveLength(0);
    expect(preview.invalidCount).toBe(1);
    expect(preview.rows).toEqual([
      { rowNumber: 3, status: CardImportRowStatus.INVALID, word: 'apple', meaning: '', error: 'Nghĩa không được để trống' },
    ]);
  });

  it('báo trùng trong file và trùng thẻ đã có, không phân biệt hoa thường và khoảng trắng', () => {
    const preview = buildCardImport(
      [
        ['word', 'meaning'],
        ['Bank', 'ngân hàng'],
        ['bank ', 'ngân  hàng'],
        ['bank', 'bờ sông'],
        ['grocery', 'hàng tạp hoá'],
      ],
      [{ word: 'grocery', meaning: 'Hàng tạp hoá' }],
    );
    expect(preview.cards.map((c) => c.meaning)).toEqual(['ngân hàng', 'bờ sông']);
    expect(preview.duplicateCount).toBe(2);
  });

  it('ô số và ô ngày của Excel chuyển thành chữ', () => {
    const preview = buildCardImport([[2024, new Date('2024-05-01T00:00:00Z')]]);
    expect(preview.cards).toEqual([{ word: '2024', meaning: '2024-05-01' }]);
  });

  it('vượt số thẻ tối đa thì bật cờ tooMany', () => {
    const sheet = Array.from({ length: CARD_IMPORT_MAX_ROWS + 1 }, (_, i) => [`word${i}`, `nghĩa ${i}`]);
    expect(buildCardImport(sheet).tooMany).toBe(true);
    expect(buildCardImport(sheet.slice(1)).tooMany).toBe(false);
  });

  it('dòng trống phía trên không bị hiểu nhầm là dòng tên cột', () => {
    const preview = buildCardImport([[], ['Từ', 'Nghĩa'], ['cat', 'con mèo']]);
    expect(preview.hasHeader).toBe(true);
    expect(preview.rows[0]?.rowNumber).toBe(3);
  });
});

describe('cardImportKey', () => {
  it('cùng từ khác nghĩa là hai khoá khác nhau', () => {
    expect(cardImportKey('bank', 'ngân hàng')).not.toBe(cardImportKey('bank', 'bờ sông'));
  });
});
