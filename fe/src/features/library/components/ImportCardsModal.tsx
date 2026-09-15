import { useRef, useState } from 'react';
import { Download, FileUp, Upload } from 'lucide-react';
import {
  CARD_IMPORT_MAX_FILE_BYTES,
  CARD_IMPORT_MAX_ROWS,
  CardImportRowStatus,
  buildCardImport,
  parseCsv,
  type CardImportPreview,
  type CardImportRow,
  type ImportCell,
  type StudySetCard,
} from '@enghabit/shared';
import { getErrorMessage } from '../../../shared/lib/api-client';
import { Badge, Button, ErrorMessage } from '../../../shared/components/ui';
import { Modal } from '../../../shared/components/Modal';
import { useToast } from '../../../shared/components/Toast';
import { useT } from '../../../shared/i18n/language';
import { useImportCards } from '../library.hooks';

/**
 * Nhập thẻ từ file .csv hoặc .xlsx.
 *
 * File đọc ngay trên trình duyệt, xem trước từng dòng rồi mới gửi danh sách thẻ lên BE.
 * Không tải file lên server: không có gì phải lưu, và người dùng thấy dòng lỗi trước khi
 * bấm nhập thay vì nhận về một câu "nhập thất bại" chung chung.
 */

/** Hiện tối đa ngần này dòng ở bảng xem trước — file 500 dòng vẽ hết thì hộp thoại rất nặng. */
const PREVIEW_ROW_LIMIT = 100;
const MAX_FILE_MB = CARD_IMPORT_MAX_FILE_BYTES / (1024 * 1024);

/** Câu lỗi là khoá dịch tiếng Việt, dịch ở chỗ hiển thị. */
class ImportFileError extends Error {}

function fileKindOf(name: string): 'csv' | 'xlsx' | null {
  const lower = name.toLowerCase();
  if (lower.endsWith('.csv')) return 'csv';
  if (lower.endsWith('.xlsx')) return 'xlsx';
  return null;
}

async function readRows(file: File): Promise<ImportCell[][]> {
  const kind = fileKindOf(file.name);
  if (!kind) throw new ImportFileError('Chỉ nhận file .csv hoặc .xlsx');
  if (file.size > CARD_IMPORT_MAX_FILE_BYTES) throw new ImportFileError('File lớn hơn {mb} MB');

  if (kind === 'csv') {
    let text: string;
    try {
      // `fatal`: Excel trên Windows lưu "CSV (Comma delimited)" bằng bảng mã cũ, giải mã
      // như UTF-8 sẽ ra chữ Việt vỡ nát mà không báo lỗi. Thà từ chối và chỉ cách sửa.
      text = new TextDecoder('utf-8', { fatal: true }).decode(await file.arrayBuffer());
    } catch {
      throw new ImportFileError('File CSV không ở dạng UTF-8. Hãy lưu lại bằng "CSV UTF-8" hoặc dùng file .xlsx.');
    }
    return parseCsv(text);
  }

  // Tải thư viện đọc xlsx lúc cần: phần lớn người dùng không bao giờ nhập file.
  const { readSheet } = await import('read-excel-file/browser');
  try {
    // Kiểu của thư viện khai báo ô ngày là `typeof Date`, nhưng lúc chạy trả về đối tượng Date.
    return (await readSheet(file)) as unknown as ImportCell[][];
  } catch {
    throw new ImportFileError('Không đọc được file .xlsx. File có thể bị hỏng hoặc đặt mật khẩu.');
  }
}

/** File mẫu có sẵn dòng tên cột và một ô chứa dấu phẩy, để người dùng thấy cách viết đúng. */
function downloadTemplate(): void {
  const csv = [
    'word,meaning,phonetic,example',
    'appointment,cuộc hẹn,/əˈpɔɪntmənt/,I have a doctor\'s appointment at 3pm.',
    'grocery,"hàng tạp hoá, thực phẩm",/ˈɡroʊsəri/,',
  ].join('\r\n');
  // BOM để Excel mở file mẫu nhận đúng UTF-8, không vỡ chữ Việt.
  const url = URL.createObjectURL(new Blob([`﻿${csv}\r\n`], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'mau-nhap-the.csv';
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function ImportCardsModal({
  setId,
  existingCards,
  open,
  onClose,
}: {
  setId: number;
  existingCards: StudySetCard[];
  open: boolean;
  onClose: () => void;
}): JSX.Element {
  const t = useT();
  const toast = useToast();
  const importCards = useImportCards();
  const inputRef = useRef<HTMLInputElement>(null);

  const [fileName, setFileName] = useState('');
  const [preview, setPreview] = useState<CardImportPreview | null>(null);
  const [reading, setReading] = useState(false);
  const [error, setError] = useState('');

  const pick = async (file: File | undefined): Promise<void> => {
    if (!file) return;
    setError('');
    setPreview(null);
    setFileName(file.name);
    setReading(true);
    try {
      const result = buildCardImport(await readRows(file), existingCards);
      if (result.rows.length === 0) setError(t('File không có dòng dữ liệu nào'));
      else setPreview(result);
    } catch (err) {
      setError(err instanceof ImportFileError ? t(err.message, { mb: MAX_FILE_MB }) : getErrorMessage(err));
    } finally {
      setReading(false);
      // Xoá giá trị để chọn lại đúng file đó (sau khi sửa trong Excel) vẫn kích hoạt onChange.
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const submit = (): void => {
    if (!preview || preview.cards.length === 0 || preview.tooMany) return;
    importCards.mutate(
      { setId, input: { cards: preview.cards } },
      {
        onSuccess: ({ created, skipped }) => {
          toast.success(
            skipped > 0
              ? t('Đã nhập {created} thẻ, bỏ qua {skipped} thẻ trùng', { created, skipped })
              : t('Đã nhập {n} thẻ', { n: created }),
          );
          onClose();
        },
        onError: (err) => setError(getErrorMessage(err)),
      },
    );
  };

  const validCount = preview?.cards.length ?? 0;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('Nhập thẻ từ file')}
      size="lg"
      closeOnBackdrop={false}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t('Huỷ')}
          </Button>
          <Button
            icon={FileUp}
            loading={importCards.isPending}
            disabled={!preview || validCount === 0 || preview.tooMany}
            onClick={submit}
          >
            {t('Nhập {n} thẻ', { n: validCount })}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="space-y-1">
          <p>
            {t('Mỗi dòng là một thẻ. Bắt buộc có cột Từ và Nghĩa; Phiên âm và Câu ví dụ không bắt buộc. Dòng đầu là tên cột thì hệ thống tự nhận ra.')}
          </p>
          <p className="text-xs text-content-muted">
            {t('Nhận file .csv (UTF-8) hoặc .xlsx, tối đa {mb} MB và {max} thẻ mỗi lần.', {
              mb: MAX_FILE_MB,
              max: CARD_IMPORT_MAX_ROWS,
            })}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={inputRef}
            type="file"
            accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            className="hidden"
            onChange={(event) => void pick(event.target.files?.[0])}
          />
          <Button variant="secondary" icon={Upload} loading={reading} onClick={() => inputRef.current?.click()}>
            {t('Chọn file')}
          </Button>
          <Button variant="ghost" icon={Download} onClick={downloadTemplate}>
            {t('Tải file mẫu')}
          </Button>
          {fileName && <span className="min-w-0 truncate text-content-muted">{fileName}</span>}
        </div>

        {error && <ErrorMessage>{error}</ErrorMessage>}

        {preview && (
          <PreviewTable preview={preview} />
        )}
      </div>
    </Modal>
  );
}

function PreviewTable({ preview }: { preview: CardImportPreview }): JSX.Element {
  const t = useT();

  // Dòng có vấn đề lên đầu: người dùng cần sửa chúng, còn dòng hợp lệ chỉ để đối chiếu.
  const ordered = [...preview.rows].sort(
    (a, b) => Number(a.status === CardImportRowStatus.VALID) - Number(b.status === CardImportRowStatus.VALID),
  );
  const shown = ordered.slice(0, PREVIEW_ROW_LIMIT);
  const hidden = ordered.length - shown.length;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Badge tone="green">{t('{n} thẻ hợp lệ', { n: preview.cards.length })}</Badge>
        {preview.duplicateCount > 0 && <Badge tone="amber">{t('{n} thẻ trùng', { n: preview.duplicateCount })}</Badge>}
        {preview.invalidCount > 0 && <Badge tone="red">{t('{n} dòng lỗi', { n: preview.invalidCount })}</Badge>}
      </div>

      {preview.tooMany && (
        <ErrorMessage>
          {t('File có {n} thẻ hợp lệ, vượt quá {max} thẻ mỗi lần. Hãy chia nhỏ file.', {
            n: preview.cards.length,
            max: CARD_IMPORT_MAX_ROWS,
          })}
        </ErrorMessage>
      )}
      {!preview.hasHeader && (
        <p className="text-xs text-content-muted">
          {t('Không thấy dòng tên cột nên đọc theo thứ tự: Từ, Nghĩa, Phiên âm, Câu ví dụ.')}
        </p>
      )}

      <div className="overflow-x-auto rounded-xl border border-line">
        <table className="w-full text-left text-sm">
          <thead className="bg-sunken text-xs text-content-muted">
            <tr>
              <th className="px-3 py-2 font-medium">{t('Dòng')}</th>
              <th className="px-3 py-2 font-medium">{t('Từ')}</th>
              <th className="px-3 py-2 font-medium">{t('Nghĩa')}</th>
              <th className="px-3 py-2 font-medium">{t('Trạng thái')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {shown.map((row) => (
              <tr key={row.rowNumber}>
                <td className="px-3 py-2 tabular-nums text-content-muted">{row.rowNumber}</td>
                <td className="max-w-[10rem] truncate px-3 py-2 text-content">{row.word}</td>
                <td className="max-w-[14rem] truncate px-3 py-2 text-content-soft">{row.meaning}</td>
                <td className="px-3 py-2">
                  <RowStatus row={row} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {hidden > 0 && <p className="text-xs text-content-muted">{t('… và {n} dòng khác', { n: hidden })}</p>}
    </div>
  );
}

function RowStatus({ row }: { row: CardImportRow }): JSX.Element {
  const t = useT();
  if (row.status === CardImportRowStatus.VALID) return <Badge tone="green">{t('Hợp lệ')}</Badge>;
  if (row.status === CardImportRowStatus.DUPLICATE) return <Badge tone="amber">{t('Trùng')}</Badge>;
  return (
    <span className="flex flex-col items-start gap-0.5">
      <Badge tone="red">{t('Lỗi')}</Badge>
      {row.error && <span className="text-xs text-danger">{t(row.error)}</span>}
    </span>
  );
}
