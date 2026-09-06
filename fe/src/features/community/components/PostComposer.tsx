import { useRef, useState } from 'react';
import { Paperclip, X } from 'lucide-react';
import {
  ALLOWED_ATTACHMENT_MIME,
  ATTACHMENT_MAX_BYTES,
  MAX_ATTACHMENTS_PER_POST,
  base64ByteLength,
  parseAttachmentDataUrl,
  type PostAttachmentInput,
} from '@enghabit/shared';
import { Button, Card, ErrorMessage, Field, Input } from '../../../shared/components/ui';
import { getErrorMessage } from '../../../shared/lib/api-client';
import { useToast } from '../../../shared/components/Toast';
import { useCreatePost } from '../community.hooks';
import { formatFileSize } from './AttachmentView';
import { useT } from '../../../shared/i18n/language';

/**
 * Ô soạn bài mới.
 *
 * Tệp được kiểm ngay khi chọn bằng đúng hàm mà backend dùng (`parseAttachmentDataUrl`
 * ở shared) — người dùng biết tệp không hợp lệ trước khi bấm đăng, thay vì chờ tải lên
 * xong mới nhận lỗi. Backend vẫn kiểm lại vì giao diện có thể bị bỏ qua hoàn toàn.
 */
export function PostComposer({
  onDone,
  groupId,
}: {
  onDone: () => void;
  /** Đăng vào nhóm này. Bỏ trống là đăng ở diễn đàn chung. */
  groupId?: number;
}): JSX.Element {
  const t = useT();
  const toast = useToast();
  const createPost = useCreatePost();
  const fileInput = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [files, setFiles] = useState<PostAttachmentInput[]>([]);
  const [error, setError] = useState('');

  const pickFiles = async (fileList: FileList | null): Promise<void> => {
    if (!fileList || fileList.length === 0) return;
    setError('');

    const room = MAX_ATTACHMENTS_PER_POST - files.length;
    if (room <= 0) {
      setError(t('Mỗi bài chỉ đính kèm tối đa {n} tệp', { n: MAX_ATTACHMENTS_PER_POST }));
      return;
    }

    const picked: PostAttachmentInput[] = [];
    for (const file of Array.from(fileList).slice(0, room)) {
      const dataUrl = await readAsDataUrl(file);
      const parsed = parseAttachmentDataUrl(dataUrl);

      if (!parsed.ok) {
        setError(`${file.name}: ${parsed.reason}`);
        continue;
      }
      picked.push({ fileName: file.name, dataUrl });
    }

    setFiles((current) => [...current, ...picked]);
    // Xoá giá trị input để chọn lại đúng tệp vừa gỡ vẫn kích hoạt onChange.
    if (fileInput.current) fileInput.current.value = '';
  };

  const submit = (event: React.FormEvent): void => {
    event.preventDefault();
    setError('');

    createPost.mutate(
      { title: title.trim(), body: body.trim(), attachments: files, ...(groupId ? { groupId } : {}) },
      {
        onSuccess: () => {
          toast.success(t('Đã đăng bài'));
          setTitle('');
          setBody('');
          setFiles([]);
          onDone();
        },
        onError: (err) => setError(getErrorMessage(err)),
      },
    );
  };

  return (
    <Card>
      <form onSubmit={submit} className="space-y-4">
        <h2 className="font-semibold text-content">{t('Đặt câu hỏi hoặc chia sẻ')}</h2>

        <Field label={t('Tiêu đề')}>
          <Input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder={t('Ví dụ: Làm sao để nhớ từ vựng lâu?')}
            maxLength={200}
            required
          />
        </Field>

        <Field label={t('Nội dung')} hint={t('{n}/10000 ký tự', { n: body.length })}>
          <textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder={t('Mô tả cụ thể giúp người khác trả lời dễ hơn.')}
            rows={5}
            maxLength={10_000}
            required
            className="mt-1.5 w-full rounded-lg border border-line-control bg-surface px-3 py-2 text-sm text-content outline-none transition-colors placeholder:text-content-muted focus:border-brand focus:ring-4 focus:ring-brand/10"
          />
        </Field>

        {files.length > 0 && (
          <ul className="space-y-1.5">
            {files.map((file, index) => (
              <li
                key={`${file.fileName}-${index}`}
                className="flex items-center gap-2 rounded-lg bg-sunken px-3 py-2"
              >
                <Paperclip className="h-3.5 w-3.5 shrink-0 text-content-muted" aria-hidden />
                <span className="min-w-0 flex-1 truncate text-sm text-content-soft">{file.fileName}</span>
                <span className="shrink-0 text-xs text-content-muted">
                  {formatFileSize(estimateBytes(file.dataUrl))}
                </span>
                <button
                  type="button"
                  onClick={() => setFiles((current) => current.filter((_, i) => i !== index))}
                  className="shrink-0 rounded p-0.5 text-content-muted transition-colors hover:text-danger"
                  aria-label={t('Gỡ tệp {name}', { name: file.fileName })}
                >
                  <X className="h-3.5 w-3.5" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        )}

        <ErrorMessage>{error}</ErrorMessage>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <input
              ref={fileInput}
              type="file"
              multiple
              accept={ALLOWED_ATTACHMENT_MIME.join(',')}
              onChange={(event) => void pickFiles(event.target.files)}
              className="hidden"
              id="post-attachments"
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              icon={Paperclip}
              onClick={() => fileInput.current?.click()}
              disabled={files.length >= MAX_ATTACHMENTS_PER_POST}
            >
              {t('Đính kèm')}
            </Button>
            <p className="mt-1.5 text-xs text-content-muted">
              {t('Tối đa {n} tệp, mỗi tệp {size}KB. Nhận ảnh, PDF và TXT.', {
                n: MAX_ATTACHMENTS_PER_POST,
                size: Math.round(ATTACHMENT_MAX_BYTES / 1000),
              })}
            </p>
          </div>

          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={onDone}>
              {t('Huỷ')}
            </Button>
            <Button type="submit" loading={createPost.isPending}>
              {t('Đăng bài')}
            </Button>
          </div>
        </div>
      </form>
    </Card>
  );
}

/** Đọc tệp thành data URL — cùng định dạng mà backend nhận. */
function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Không đọc được tệp'));
    reader.readAsDataURL(file);
  });
}

/** Cỡ tệp suy từ chuỗi data URL, chỉ để hiện cho người dùng trước khi đăng. */
function estimateBytes(dataUrl: string): number {
  return base64ByteLength(dataUrl.slice(dataUrl.indexOf(',') + 1));
}
