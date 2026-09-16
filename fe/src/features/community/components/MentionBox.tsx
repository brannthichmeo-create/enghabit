import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { MENTION_ALL, type MentionTarget } from '@enghabit/shared';
import { useT } from '../../../shared/i18n/language';

/**
 * Ô nhập có gợi ý đề cập: gõ `@` thì hiện danh sách thành viên nhóm để chọn.
 *
 * Dùng chung cho ô soạn bài và ô bình luận, vì cả hai đều chỉ là một chuỗi văn bản
 * thuần — không có bộ soạn thảo giàu định dạng, không lưu kèm danh sách người được nhắc.
 * Thứ duy nhất lưu lại là đúng chuỗi người dùng gõ; backend tự tách `@tên` ra bằng
 * `matchMentions` của shared. Nhờ vậy gõ tay `@long.tran` mà không qua ô gợi ý vẫn nhắc
 * được, và ô gợi ý chỉ là tiện ích gõ nhanh chứ không phải nguồn sự thật.
 *
 * Ô này CHỈ dùng trong nhóm lớp: diễn đàn chung không có danh sách thành viên để nhắc.
 */

/** Số dòng gợi ý hiện cùng lúc. Nhiều hơn thì danh sách che mất chỗ đang gõ. */
const MAX_SUGGESTIONS = 6;

/** Phần `@tên` đang gõ dở ngay trước con trỏ. */
const ACTIVE_MENTION = /(^|\s)@([a-z0-9._-]*)$/i;

/** Một dòng trong danh sách gợi ý. `@all` là dòng ảo, không phải người thật. */
interface Suggestion {
  username: string;
  name: string;
  isAll: boolean;
}

export function MentionBox({
  value,
  onChange,
  targets,
  rows,
  placeholder,
  maxLength,
  className,
  onSubmitShortcut,
}: {
  value: string;
  onChange: (next: string) => void;
  /** Người có thể nhắc. Mảng rỗng (hoặc chưa tải xong) thì ô này là textarea thường. */
  targets: MentionTarget[];
  rows?: number;
  placeholder?: string;
  maxLength?: number;
  className?: string;
  /**
   * Gọi khi bấm Enter mà KHÔNG mở danh sách gợi ý và không giữ Shift.
   *
   * Dành cho ô bình luận, nơi Enter là gửi. Khi danh sách đang mở thì Enter thuộc về
   * việc chọn người — nếu không, chọn một cái tên cũng gửi luôn bình luận dở dang.
   */
  onSubmitShortcut?: () => void;
}): JSX.Element {
  const t = useT();
  const inputRef = useRef<HTMLTextAreaElement>(null);

  /** Vị trí con trỏ lúc gõ, dùng để biết đang gõ dở `@` ở đâu. */
  const [caret, setCaret] = useState(0);
  const [highlighted, setHighlighted] = useState(0);
  /** Người dùng bấm Esc để tắt gợi ý cho lượt gõ này. */
  const [dismissed, setDismissed] = useState(false);

  const query = useMemo(() => {
    if (dismissed || targets.length === 0) return null;
    const match = ACTIVE_MENTION.exec(value.slice(0, caret));
    return match ? (match[2] ?? '').toLowerCase() : null;
  }, [value, caret, dismissed, targets.length]);

  const suggestions = useMemo((): Suggestion[] => {
    if (query === null) return [];

    const people = targets
      .filter(
        (target) =>
          target.username.toLowerCase().includes(query) || target.name.toLowerCase().includes(query),
      )
      .map((target) => ({ username: target.username, name: target.name, isAll: false }));

    // `@all` đứng đầu: nhắc cả nhóm là việc hay dùng nhất trong một nhóm lớp.
    const all: Suggestion[] = MENTION_ALL.startsWith(query)
      ? [{ username: MENTION_ALL, name: t('Tất cả thành viên trong nhóm'), isAll: true }]
      : [];

    return [...all, ...people].slice(0, MAX_SUGGESTIONS);
  }, [query, targets, t]);

  const open = suggestions.length > 0;

  // Danh sách đổi thì quay lại dòng đầu — giữ chỉ số cũ có thể trỏ ra ngoài mảng mới.
  useEffect(() => setHighlighted(0), [query]);

  /** Thay phần `@` đang gõ dở bằng tên đã chọn, rồi đặt lại con trỏ ngay sau nó. */
  const pick = (suggestion: Suggestion): void => {
    const before = value.slice(0, caret);
    const match = ACTIVE_MENTION.exec(before);
    if (!match) return;

    const start = before.length - (match[2] ?? '').length - 1;
    const inserted = `@${suggestion.username} `;
    const next = `${value.slice(0, start)}${inserted}${value.slice(caret)}`;
    onChange(next);

    // Đặt lại con trỏ SAU khi React vẽ xong: đặt ngay bây giờ sẽ bị lần vẽ kế tiếp
    // kéo con trỏ về cuối ô, và người dùng chèn tên ở giữa câu sẽ mất chỗ đang gõ.
    const nextCaret = start + inserted.length;
    requestAnimationFrame(() => {
      inputRef.current?.setSelectionRange(nextCaret, nextCaret);
      inputRef.current?.focus();
      setCaret(nextCaret);
    });
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>): void => {
    if (open) {
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        setHighlighted((current) => {
          const step = event.key === 'ArrowDown' ? 1 : -1;
          return (current + step + suggestions.length) % suggestions.length;
        });
        return;
      }
      if (event.key === 'Enter' || event.key === 'Tab') {
        event.preventDefault();
        const chosen = suggestions[highlighted];
        if (chosen) pick(chosen);
        return;
      }
      if (event.key === 'Escape') {
        event.preventDefault();
        setDismissed(true);
        return;
      }
    }

    if (event.key === 'Enter' && !event.shiftKey && onSubmitShortcut) {
      event.preventDefault();
      onSubmitShortcut();
    }
  };

  const syncCaret = (element: HTMLTextAreaElement): void => setCaret(element.selectionStart ?? 0);

  return (
    <div className="relative">
      <textarea
        ref={inputRef}
        value={value}
        rows={rows}
        placeholder={placeholder}
        maxLength={maxLength}
        onChange={(event) => {
          setDismissed(false);
          syncCaret(event.target);
          onChange(event.target.value);
        }}
        onKeyUp={(event) => syncCaret(event.currentTarget)}
        onClick={(event) => syncCaret(event.currentTarget)}
        onKeyDown={handleKeyDown}
        // Đóng gợi ý khi rời ô, nhưng chậm một nhịp: bấm chuột vào một dòng gợi ý làm
        // ô mất tiêu điểm TRƯỚC khi sự kiện click chạy, đóng ngay thì cú bấm rơi vào
        // khoảng không và không chọn được ai.
        onBlur={() => window.setTimeout(() => setDismissed(true), 150)}
        className={
          className ??
          'w-full rounded-lg border border-line-control bg-surface px-3 py-2 text-sm text-content outline-none transition-colors placeholder:text-content-muted focus:border-brand focus:ring-4 focus:ring-brand/10'
        }
        aria-autocomplete="list"
        aria-expanded={open}
      />

      {open && (
        <ul
          className="absolute left-0 right-0 top-full z-20 mt-1 max-h-60 overflow-y-auto rounded-lg border border-line bg-surface py-1 shadow-lg"
          role="listbox"
          aria-label={t('Gợi ý người để nhắc')}
        >
          {suggestions.map((suggestion, index) => (
            <li key={suggestion.username} role="option" aria-selected={index === highlighted}>
              <button
                type="button"
                // `onMouseDown` chứ không phải `onClick`: click chạy sau khi ô đã mất
                // tiêu điểm, mà lúc đó danh sách có thể đã đóng.
                onMouseDown={(event) => {
                  event.preventDefault();
                  pick(suggestion);
                }}
                onMouseEnter={() => setHighlighted(index)}
                className={`flex w-full items-baseline gap-2 px-3 py-1.5 text-left transition-colors ${
                  index === highlighted ? 'bg-sunken' : ''
                }`}
              >
                <span className="text-sm font-medium text-content">@{suggestion.username}</span>
                <span className="min-w-0 truncate text-xs text-content-muted">
                  {suggestion.name}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/**
 * Hiện nội dung có đề cập, tô đậm các `@tên` khớp một thành viên.
 *
 * Vẫn là TEXT NODE: chuỗi được cắt thành từng mảnh rồi React chèn vào, không hề dựng
 * HTML từ nội dung người dùng. Tên không khớp ai thì để nguyên chữ thường — đúng với
 * cách backend chấm, nên cái người đọc thấy nổi bật cũng là cái người kia nhận thông báo.
 */
export function MentionText({
  text,
  usernames,
  className = '',
}: {
  text: string;
  /** Tên tài khoản của thành viên nhóm. Rỗng ở diễn đàn chung — khi đó không tô gì cả. */
  usernames: string[];
  className?: string;
}): JSX.Element {
  const known = useMemo(
    () => new Set([MENTION_ALL, ...usernames.map((name) => name.toLowerCase())]),
    [usernames],
  );

  const parts = useMemo(() => splitMentions(text), [text]);

  return (
    <p className={`whitespace-pre-wrap ${className}`}>
      {parts.map((part, index) =>
        part.mention && known.has(part.mention) ? (
          <span key={index} className="font-semibold text-brand-strong">
            {part.text}
          </span>
        ) : (
          <span key={index}>{part.text}</span>
        ),
      )}
    </p>
  );
}

/**
 * Cắt chuỗi thành các mảnh, mảnh nào là một lượt nhắc thì kèm tên đã chuẩn hoá.
 *
 * Cố ý KHÔNG dùng chung `parseMentions` của shared: hàm đó trả về danh sách tên, còn ở
 * đây cần biết từng đoạn nằm ở vị trí nào để vẽ lại đúng chuỗi gốc, kể cả khoảng trắng.
 */
function splitMentions(text: string): { text: string; mention?: string }[] {
  const pattern = /(^|\s)(@[a-z0-9][a-z0-9._-]{0,29})/gi;
  const parts: { text: string; mention?: string }[] = [];
  let cursor = 0;

  for (const match of text.matchAll(pattern)) {
    const lead = match[1] ?? '';
    const token = match[2] ?? '';
    const start = (match.index ?? 0) + lead.length;

    if (start > cursor) parts.push({ text: text.slice(cursor, start) });
    // Bỏ dấu câu dính ở cuối, giống hệt `parseMentions` — nếu không, "@minh." sẽ không
    // khớp ai và hiện nhạt trong khi người đó vẫn nhận được thông báo.
    parts.push({ text: token, mention: token.slice(1).toLowerCase().replace(/[._-]+$/, '') });
    cursor = start + token.length;
  }

  if (cursor < text.length) parts.push({ text: text.slice(cursor) });
  return parts;
}
