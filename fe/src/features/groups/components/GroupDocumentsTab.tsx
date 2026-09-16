import { useState } from 'react';
import { Download, FileText, FolderOpen, Image as ImageIcon, Search } from 'lucide-react';
import type { GroupDocumentRow } from '@enghabit/shared';
import {
  Button,
  Card,
  EmptyState,
  ErrorMessage,
  Input,
  SkeletonList,
} from '../../../shared/components/ui';
import { useToast } from '../../../shared/components/Toast';
import { getErrorMessage } from '../../../shared/lib/api-client';
import { useLocale, useT } from '../../../shared/i18n/language';
import { fetchAttachmentUrl } from '../../community/community.api';
import { formatFileSize } from '../../community/components/AttachmentView';
import { useGroupDocuments } from '../group.hooks';

/**
 * Tài liệu chung của nhóm.
 *
 * Danh sách này KHÔNG có đường tải tệp lên riêng: tệp vào nhóm bằng cách đính kèm vào
 * một bài đăng, rồi tự hiện ở đây. Một đường lên duy nhất nghĩa là chỉ một chỗ kiểm
 * định dạng và dung lượng, và mỗi tệp luôn còn ngữ cảnh "ai đăng, trong bài nào".
 *
 * Tải về dùng chung `fetchAttachmentUrl` với bài đăng — endpoint đó đã kiểm tra tư cách
 * thành viên, nên tệp của nhóm riêng tư không tải được bằng cách đoán id.
 */
export function GroupDocumentsTab({ groupId }: { groupId: number }): JSX.Element {
  const t = useT();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const documents = useGroupDocuments(groupId, { page, pageSize: 20, search: search || undefined });
  const total = documents.data?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / 20));

  return (
    <div>
      <Card className="mb-4">
        <label className="relative block">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-content-muted"
            aria-hidden
          />
          <Input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              // Lọc lại là một danh sách khác hẳn — giữ nguyên trang 5 cũ sẽ ra khung rỗng.
              setPage(1);
            }}
            placeholder={t('Tìm theo tên tệp')}
            className="pl-9"
            aria-label={t('Tìm theo tên tệp')}
          />
        </label>
      </Card>

      {documents.isLoading && <SkeletonList rows={3} />}
      {documents.isError && <ErrorMessage>{getErrorMessage(documents.error)}</ErrorMessage>}

      {documents.data?.items.length === 0 && (
        <EmptyState
          icon={FolderOpen}
          title={search ? t('Không có tệp nào khớp') : t('Nhóm chưa có tài liệu nào')}
          description={
            search
              ? t('Thử một từ khoá khác trong tên tệp.')
              : t('Đính kèm tệp vào một bài đăng, tệp sẽ tự hiện ở đây cho cả nhóm.')
          }
        />
      )}

      <div className="space-y-2">
        {documents.data?.items.map((document) => (
          <DocumentRow key={document.id} document={document} />
        ))}
      </div>

      {total > 20 && (
        <div className="mt-4 flex items-center justify-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((current) => current - 1)}
          >
            {t('Trang trước')}
          </Button>
          <span className="text-sm tabular-nums text-content-soft">
            {t('Trang {page}/{total}', { page, total: pageCount })}
          </span>
          <Button
            variant="secondary"
            size="sm"
            disabled={page >= pageCount}
            onClick={() => setPage((current) => current + 1)}
          >
            {t('Trang sau')}
          </Button>
        </div>
      )}
    </div>
  );
}

/** Một dòng tài liệu: tên tệp, ai đăng, đăng trong bài nào, và nút tải về. */
function DocumentRow({ document: row }: { document: GroupDocumentRow }): JSX.Element {
  const t = useT();
  const locale = useLocale();
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  const Icon = row.isImage ? ImageIcon : FileText;

  const download = async (): Promise<void> => {
    setBusy(true);
    try {
      const url = await fetchAttachmentUrl(row.id);
      const link = window.document.createElement('a');
      link.href = url;
      link.download = row.fileName;
      link.click();
      // Nhả ngay sau khi trình duyệt đã nhận lệnh tải — giữ lại không có tác dụng gì.
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="flex flex-wrap items-center gap-3">
      <Icon className="h-5 w-5 shrink-0 text-content-muted" aria-hidden />

      <div className="min-w-0 flex-1">
        <span className="block truncate font-medium text-content">{row.fileName}</span>
        <span className="block text-xs text-content-muted">
          {t('{size} · {name} đăng trong "{post}"', {
            size: formatFileSize(row.sizeBytes),
            name: row.uploaderName,
            post: row.postTitle,
          })}
        </span>
        <span className="block text-xs text-content-muted">
          {new Date(row.createdAt).toLocaleString(locale, {
            day: 'numeric',
            month: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      </div>

      <Button
        variant="secondary"
        size="sm"
        icon={Download}
        loading={busy}
        onClick={() => void download()}
      >
        {t('Tải về')}
      </Button>
    </Card>
  );
}
