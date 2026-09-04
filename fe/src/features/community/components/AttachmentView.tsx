import { useEffect, useState } from 'react';
import { Download, FileText, ImageOff } from 'lucide-react';
import type { PostAttachmentInfo } from '@enghabit/shared';
import { fetchAttachmentUrl } from '../community.api';
import { useT } from '../../../shared/i18n/language';

/**
 * Hiển thị tệp đính kèm của một bài.
 *
 * Ảnh và tệp thường được tách làm hai khối: ảnh xem ngay tại chỗ, còn tệp khác chỉ là
 * một dòng bấm để tải. Cố ý không cố hiển thị nội dung PDF hay TXT trong trang —
 * render nội dung do người khác tải lên là đúng thứ ta muốn tránh (xem shared/attachment).
 */

export function AttachmentList({ attachments }: { attachments: PostAttachmentInfo[] }): JSX.Element | null {
  if (attachments.length === 0) return null;

  const images = attachments.filter((file) => file.isImage);
  const files = attachments.filter((file) => !file.isImage);

  return (
    <div className="mt-3 space-y-2">
      {images.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {images.map((image) => (
            <AttachmentImage key={image.id} attachment={image} />
          ))}
        </div>
      )}

      {files.map((file) => (
        <AttachmentFile key={file.id} attachment={file} />
      ))}
    </div>
  );
}

/**
 * Ảnh đính kèm.
 *
 * Tải qua `apiClient` rồi dựng blob URL vì endpoint cần Bearer token mà thẻ `img`
 * không gửi header được. Blob URL được thu hồi khi component rời màn hình — quên
 * bước này thì mỗi lần mở bài là giữ thêm một bản sao ảnh trong bộ nhớ tab.
 */
function AttachmentImage({ attachment }: { attachment: PostAttachmentInfo }): JSX.Element {
  const t = useT();
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let objectUrl: string | null = null;
    let cancelled = false;

    fetchAttachmentUrl(attachment.id)
      .then((created) => {
        objectUrl = created;
        // Component đã rời màn hình trước khi tải xong: thu hồi ngay, đừng đặt state.
        if (cancelled) {
          URL.revokeObjectURL(created);
          return;
        }
        setUrl(created);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [attachment.id]);

  if (failed) {
    return (
      <span className="flex h-28 w-28 flex-col items-center justify-center gap-1 rounded-lg border border-line bg-sunken text-content-muted">
        <ImageOff className="h-5 w-5" aria-hidden />
        <span className="text-[10px]">{t('Không tải được ảnh')}</span>
      </span>
    );
  }

  if (!url) return <span className="h-28 w-28 animate-pulse rounded-lg bg-sunken" />;

  return (
    <a href={url} target="_blank" rel="noreferrer" className="shrink-0">
      <img
        src={url}
        alt={attachment.fileName}
        className="h-28 w-28 rounded-lg border border-line object-cover transition-opacity hover:opacity-90"
      />
    </a>
  );
}

/** Tệp không phải ảnh: một dòng có tên, cỡ tệp và nút tải. */
function AttachmentFile({ attachment }: { attachment: PostAttachmentInfo }): JSX.Element {
  const t = useT();
  const [busy, setBusy] = useState(false);

  const download = async (): Promise<void> => {
    setBusy(true);
    try {
      const url = await fetchAttachmentUrl(attachment.id);
      const link = document.createElement('a');
      link.href = url;
      link.download = attachment.fileName;
      link.click();
      // Nhả ngay sau khi trình duyệt đã nhận lệnh tải — giữ lại không có tác dụng gì.
      URL.revokeObjectURL(url);
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={() => void download()}
      disabled={busy}
      className="flex w-full items-center gap-2.5 rounded-lg border border-line bg-sunken px-3 py-2 text-left transition-colors hover:bg-hover disabled:opacity-50"
    >
      <FileText className="h-4 w-4 shrink-0 text-content-muted" aria-hidden />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm text-content-soft">{attachment.fileName}</span>
        <span className="block text-xs text-content-muted">{formatFileSize(attachment.sizeBytes)}</span>
      </span>
      <Download className="h-4 w-4 shrink-0 text-content-muted" aria-hidden />
      <span className="sr-only">{t('Tải tệp về')}</span>
    </button>
  );
}

/** Cỡ tệp dạng dễ đọc. Dùng KB/MB thập phân cho khớp với cách hệ điều hành hiển thị. */
export function formatFileSize(bytes: number): string {
  if (bytes < 1000) return `${bytes} B`;
  if (bytes < 1_000_000) return `${Math.round(bytes / 1000)} KB`;
  return `${(bytes / 1_000_000).toFixed(1)} MB`;
}
