import { useState, type FormEvent } from 'react';
import { Check, Flag, Globe, Lock, Plus, X } from 'lucide-react';
import {
  StudySetVisibility,
  VocabLevel,
  createStudySetSchema,
  reportStudySetSchema,
  studySetCardSchema,
  type CreateStudySetInput,
  type StudySetCard,
  type StudySetCardInput,
  type StudySetSummary,
} from '@enghabit/shared';
import { getErrorMessage } from '../../../shared/lib/api-client';
import { Button, ErrorMessage, Field, Input, Select } from '../../../shared/components/ui';
import { Modal } from '../../../shared/components/Modal';
import { useToast } from '../../../shared/components/Toast';
import { VOCAB_LEVEL_LABELS } from '../../../shared/lib/labels';
import { useT } from '../../../shared/i18n/language';
import {
  useAddCard,
  useCreateStudySet,
  useReportStudySet,
  useUpdateCard,
  useUpdateStudySet,
} from '../library.hooks';

const TEXTAREA_CLASS =
  'mt-1.5 w-full rounded-lg border border-line-control bg-surface px-3 py-2 text-sm text-content outline-none transition-colors placeholder:text-content-muted focus:border-brand focus:ring-4 focus:ring-brand/10';

// ---------------------------------------------------------------------------
// Tạo / sửa bộ thẻ
// ---------------------------------------------------------------------------

/**
 * Bộ thẻ của người học ở Thư viện: nối `StudySetFormDialog` với API thư viện.
 */
export function StudySetFormModal({
  open,
  onClose,
  initial,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  /** Có giá trị là sửa bộ này; không có là tạo bộ mới. */
  initial?: StudySetSummary;
  onSaved?: (set: StudySetSummary) => void;
}): JSX.Element {
  const create = useCreateStudySet();
  const update = useUpdateStudySet();

  return (
    <StudySetFormDialog
      open={open}
      onClose={onClose}
      initial={initial}
      onSubmit={async (input) => {
        const set = initial
          ? await update.mutateAsync({ setId: initial.id, input })
          : await create.mutateAsync(input);
        onSaved?.(set);
      }}
    />
  );
}

/**
 * Biểu mẫu tạo / sửa bộ thẻ — CHỈ phần hiển thị, không tự gọi API.
 *
 * Dùng chung cho Thư viện của người học và màn Nội dung học tập của quản trị viên: hai
 * nơi soạn cùng một thứ (một dòng `topics`) thì phải cùng một biểu mẫu, cùng một luật
 * kiểm tra. Mỗi nơi tự nối `onSubmit` với API của mình.
 */
export function StudySetFormDialog({
  open,
  onClose,
  initial,
  onSubmit,
  publicOnly = false,
}: {
  open: boolean;
  onClose: () => void;
  initial?: Pick<StudySetSummary, 'name' | 'description' | 'level' | 'visibility'>;
  /** Ném lỗi thì biểu mẫu hiện lỗi đó và giữ nguyên những gì đã gõ. */
  onSubmit: (input: CreateStudySetInput) => Promise<void>;
  /**
   * Bộ "Hệ thống" của quản trị viên LUÔN công khai: bỏ hẳn lựa chọn chế độ thay vì để một
   * nút "Riêng tư" bấm được mà máy chủ bỏ qua.
   */
  publicOnly?: boolean;
}): JSX.Element {
  const t = useT();
  const toast = useToast();

  const [name, setName] = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [level, setLevel] = useState<VocabLevel>(initial?.level ?? VocabLevel.BEGINNER);
  const [visibility, setVisibility] = useState<StudySetVisibility>(
    publicOnly ? StudySetVisibility.PUBLIC : (initial?.visibility ?? StudySetVisibility.PRIVATE),
  );
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  const submit = async (event: FormEvent): Promise<void> => {
    event.preventDefault();
    const parsed = createStudySetSchema.safeParse({ name, description, level, visibility });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? t('Dữ liệu không hợp lệ'));
      return;
    }

    setPending(true);
    try {
      await onSubmit(parsed.data);
      toast.success(initial ? t('Đã lưu bộ thẻ') : t('Đã tạo bộ thẻ'));
      onClose();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setPending(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={initial ? t('Sửa bộ thẻ') : t('Tạo bộ thẻ')} closeOnBackdrop={false}>
      <form noValidate onSubmit={(e) => void submit(e)} className="space-y-4">
        {error && <ErrorMessage>{error}</ErrorMessage>}

        <Field label={t('Tên bộ thẻ')}>
          <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={120} autoFocus />
        </Field>

        <label className="block">
          <span className="text-sm font-medium text-content-soft">{t('Mô tả (không bắt buộc)')}</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            maxLength={1000}
            className={TEXTAREA_CLASS}
          />
        </label>

        <Field label={t('Trình độ')}>
          <Select value={level} onChange={(e) => setLevel(e.target.value as VocabLevel)}>
            {Object.values(VocabLevel).map((value) => (
              <option key={value} value={value}>
                {t(VOCAB_LEVEL_LABELS[value])}
              </option>
            ))}
          </Select>
        </Field>

        {publicOnly ? (
          <p className="flex items-start gap-2 rounded-lg bg-sunken px-3 py-2.5 text-sm text-content-soft">
            <Globe className="mt-0.5 h-4 w-4 shrink-0 text-brand-strong" aria-hidden />
            {t('Bộ thẻ Hệ thống luôn công khai: mọi người học thấy ngay trong Thư viện, tác giả hiện là "Hệ thống".')}
          </p>
        ) : (
          <fieldset>
            <legend className="text-sm font-medium text-content-soft">{t('Ai được xem')}</legend>
            <div className="mt-1.5 grid gap-2 sm:grid-cols-2">
              <VisibilityOption
                selected={visibility === StudySetVisibility.PRIVATE}
                icon={Lock}
                label={t('Riêng tư')}
                hint={t('Chỉ mình bạn xem và học')}
                onClick={() => setVisibility(StudySetVisibility.PRIVATE)}
              />
              <VisibilityOption
                selected={visibility === StudySetVisibility.PUBLIC}
                icon={Globe}
                label={t('Công khai')}
                hint={t('Ai cũng tìm thấy, học và chia sẻ được')}
                onClick={() => setVisibility(StudySetVisibility.PUBLIC)}
              />
            </div>
          </fieldset>
        )}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            {t('Huỷ')}
          </Button>
          <Button type="submit" icon={Check} loading={pending}>
            {initial ? t('Lưu') : t('Tạo bộ thẻ')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function VisibilityOption({
  selected,
  icon: Icon,
  label,
  hint,
  onClick,
}: {
  selected: boolean;
  icon: typeof Lock;
  label: string;
  hint: string;
  onClick: () => void;
}): JSX.Element {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onClick}
      className={`flex items-start gap-2.5 rounded-xl border-2 px-3 py-2.5 text-left transition-colors ${
        selected ? 'border-brand bg-brand-soft' : 'border-line hover:border-line-strong'
      }`}
    >
      <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${selected ? 'text-brand-strong' : 'text-content-muted'}`} aria-hidden />
      <span>
        <span className={`block text-sm font-medium ${selected ? 'text-brand-strong' : 'text-content'}`}>{label}</span>
        <span className="block text-xs text-content-muted">{hint}</span>
      </span>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Thêm / sửa thẻ
// ---------------------------------------------------------------------------

/** Thẻ trong bộ của người học ở Thư viện: nối `CardFormView` với API thư viện. */
export function CardForm({
  setId,
  card,
  onDone,
}: {
  setId: number;
  /** Có giá trị là sửa thẻ này; không có là thêm thẻ mới (form giữ mở để thêm tiếp). */
  card?: StudySetCard;
  onDone?: () => void;
}): JSX.Element {
  const add = useAddCard();
  const update = useUpdateCard();

  return (
    <CardFormView
      card={card}
      onDone={onDone}
      onSubmit={async (input) => {
        if (card) await update.mutateAsync({ cardId: card.id, input });
        else await add.mutateAsync({ setId, input });
      }}
    />
  );
}

/**
 * Biểu mẫu thêm / sửa một thẻ — CHỈ phần hiển thị, không tự gọi API. Dùng chung cho
 * Thư viện và màn Nội dung học tập của quản trị viên (xem `StudySetFormDialog`).
 */
export function CardFormView({
  card,
  onSubmit,
  onDone,
}: {
  card?: StudySetCard;
  /** Ném lỗi thì biểu mẫu hiện lỗi đó và giữ nguyên những gì đã gõ. */
  onSubmit: (input: StudySetCardInput) => Promise<void>;
  onDone?: () => void;
}): JSX.Element {
  const t = useT();
  const empty = { word: '', meaning: '', phonetic: '', example: '' };
  const [form, setForm] = useState(
    card
      ? { word: card.word, meaning: card.meaning, phonetic: card.phonetic ?? '', example: card.example ?? '' }
      : empty,
  );
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  const submit = async (event: FormEvent): Promise<void> => {
    event.preventDefault();
    setError('');
    const parsed = studySetCardSchema.safeParse(form);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? t('Dữ liệu không hợp lệ'));
      return;
    }

    setPending(true);
    try {
      await onSubmit(parsed.data);
      if (card) onDone?.();
      // Thêm xong thì xoá trắng để gõ thẻ kế tiếp luôn — soạn bộ thẻ là gõ liên tiếp nhiều thẻ.
      else setForm(empty);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setPending(false);
    }
  };

  return (
    <form noValidate onSubmit={(e) => void submit(e)} className="space-y-3">
      {error && <ErrorMessage>{error}</ErrorMessage>}
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={t('Từ')}>
          <Input value={form.word} onChange={(e) => setForm({ ...form, word: e.target.value })} maxLength={100} />
        </Field>
        <Field label={t('Nghĩa')}>
          <Input value={form.meaning} onChange={(e) => setForm({ ...form, meaning: e.target.value })} maxLength={500} />
        </Field>
        <Field label={t('Phiên âm (không bắt buộc)')}>
          <Input value={form.phonetic} onChange={(e) => setForm({ ...form, phonetic: e.target.value })} maxLength={100} />
        </Field>
        <Field label={t('Câu ví dụ (không bắt buộc)')}>
          <Input value={form.example} onChange={(e) => setForm({ ...form, example: e.target.value })} maxLength={500} />
        </Field>
      </div>
      <div className="flex gap-2">
        <Button type="submit" size="sm" icon={card ? Check : Plus} loading={pending}>
          {card ? t('Lưu thẻ') : t('Thêm thẻ')}
        </Button>
        {card && (
          <Button type="button" size="sm" variant="ghost" icon={X} onClick={onDone}>
            {t('Huỷ')}
          </Button>
        )}
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Báo cáo vi phạm
// ---------------------------------------------------------------------------

export function ReportStudySetModal({
  setId,
  open,
  onClose,
}: {
  setId: number;
  open: boolean;
  onClose: () => void;
}): JSX.Element {
  const t = useT();
  const toast = useToast();
  const report = useReportStudySet();
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const submit = (event: FormEvent): void => {
    event.preventDefault();
    const parsed = reportStudySetSchema.safeParse({ reason });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? t('Dữ liệu không hợp lệ'));
      return;
    }
    report.mutate(
      { setId, input: parsed.data },
      {
        onSuccess: () => {
          toast.success(t('Đã gửi báo cáo. Quản trị viên sẽ xem xét.'));
          onClose();
        },
        onError: (err) => setError(getErrorMessage(err)),
      },
    );
  };

  return (
    <Modal open={open} onClose={onClose} title={t('Báo cáo bộ thẻ')} closeOnBackdrop={false}>
      <form noValidate onSubmit={submit} className="space-y-3">
        {error && <ErrorMessage>{error}</ErrorMessage>}
        <label className="block">
          <span className="text-sm font-medium text-content-soft">{t('Bộ thẻ này vi phạm điều gì?')}</span>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={4}
            maxLength={500}
            autoFocus
            placeholder={t('Ví dụ: Nội dung phản cảm, sai lệch cố ý hoặc quảng cáo.')}
            className={TEXTAREA_CLASS}
          />
        </label>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            {t('Huỷ')}
          </Button>
          <Button type="submit" variant="danger" icon={Flag} loading={report.isPending}>
            {t('Gửi báo cáo')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
