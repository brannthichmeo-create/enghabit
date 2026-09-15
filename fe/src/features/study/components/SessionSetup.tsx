import { useState } from 'react';
import { AlarmClock, CalendarClock, Layers, ListChecks, Play, Sparkles, TriangleAlert, type LucideIcon } from 'lucide-react';
import { MIN_CARDS_FOR_MULTIPLE_CHOICE, StudyGroup, StudyMode } from '@enghabit/shared';
import { Button, Card } from '../../../shared/components/ui';
import { useT } from '../../../shared/i18n/language';

/**
 * Chọn nhóm thẻ và chế độ trước khi vào phiên. Dùng chung cho Học và Ôn tập.
 *
 * Người học TỰ CHỌN nhóm (D-11), không trộn tự động — nên mỗi nhóm hiện rõ số thẻ, và
 * nhóm không còn thẻ nào thì khoá lại thay vì cho bấm rồi nhận màn hình trống.
 */

export type GroupCounts = Record<'NEW' | 'DUE' | 'OVERDUE' | 'WEAK', number>;

type SelectableGroup = keyof GroupCounts;

const GROUPS: { group: SelectableGroup; label: string; hint: string; icon: LucideIcon }[] = [
  { group: StudyGroup.NEW, label: 'Thẻ mới', hint: 'Chưa học lần nào', icon: Sparkles },
  { group: StudyGroup.DUE, label: 'Tới hạn', hint: 'Đến lịch ôn hôm nay', icon: CalendarClock },
  { group: StudyGroup.OVERDUE, label: 'Quá hạn', hint: 'Đã quá ngày cần ôn', icon: AlarmClock },
  { group: StudyGroup.WEAK, label: 'Thẻ yếu', hint: 'Hay quên hoặc sai nhiều', icon: TriangleAlert },
];

const MODES: { mode: StudyMode; label: string; hint: string; icon: LucideIcon }[] = [
  { mode: StudyMode.FLASHCARD, label: 'Flashcard', hint: 'Lật thẻ rồi tự chấm mức nhớ', icon: Layers },
  { mode: StudyMode.MULTIPLE_CHOICE, label: 'Trắc nghiệm', hint: 'Chọn đáp án đúng trong 4 phương án', icon: ListChecks },
];

export function SessionSetup({
  counts,
  canMultipleChoice,
  multipleChoiceHint,
  onStart,
}: {
  counts: GroupCounts;
  canMultipleChoice: boolean;
  /** Lý do trắc nghiệm bị khoá, hiện dưới lựa chọn đó. */
  multipleChoiceHint?: string;
  onStart: (group: SelectableGroup, mode: StudyMode) => void;
}): JSX.Element {
  const t = useT();
  const firstAvailable = GROUPS.find((item) => counts[item.group] > 0)?.group ?? StudyGroup.NEW;
  const [group, setGroup] = useState<SelectableGroup>(firstAvailable);
  const [mode, setMode] = useState<StudyMode>(StudyMode.FLASHCARD);

  const effectiveMode = mode === StudyMode.MULTIPLE_CHOICE && !canMultipleChoice ? StudyMode.FLASHCARD : mode;

  return (
    <Card>
      <h2 className="font-semibold text-content">{t('Chọn nhóm thẻ')}</h2>
      <div className="mt-3 grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label={t('Chọn nhóm thẻ')}>
        {GROUPS.map((item) => {
          const count = counts[item.group];
          const selected = group === item.group;
          return (
            <OptionButton
              key={item.group}
              selected={selected}
              disabled={count === 0}
              icon={item.icon}
              label={t(item.label)}
              hint={t(item.hint)}
              trailing={<span className="text-lg font-semibold tabular-nums">{count}</span>}
              onClick={() => setGroup(item.group)}
            />
          );
        })}
      </div>

      <h2 className="mt-5 font-semibold text-content">{t('Chọn chế độ')}</h2>
      <div className="mt-3 grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label={t('Chọn chế độ')}>
        {MODES.map((item) => {
          const locked = item.mode === StudyMode.MULTIPLE_CHOICE && !canMultipleChoice;
          return (
            <OptionButton
              key={item.mode}
              selected={effectiveMode === item.mode}
              disabled={locked}
              icon={item.icon}
              label={t(item.label)}
              hint={
                locked
                  ? (multipleChoiceHint ??
                    t('Cần ít nhất {n} thẻ trong bộ để làm trắc nghiệm', { n: MIN_CARDS_FOR_MULTIPLE_CHOICE }))
                  : t(item.hint)
              }
              onClick={() => setMode(item.mode)}
            />
          );
        })}
      </div>

      <Button
        className="mt-5 w-full sm:w-auto"
        icon={Play}
        disabled={counts[group] === 0}
        onClick={() => onStart(group, effectiveMode)}
      >
        {t('Bắt đầu')}
      </Button>
    </Card>
  );
}

function OptionButton({
  selected,
  disabled,
  icon: Icon,
  label,
  hint,
  trailing,
  onClick,
}: {
  selected: boolean;
  disabled: boolean;
  icon: LucideIcon;
  label: string;
  hint: string;
  trailing?: JSX.Element;
  onClick: () => void;
}): JSX.Element {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      disabled={disabled}
      onClick={onClick}
      className={`flex items-center gap-3 rounded-xl border-2 px-4 py-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
        selected && !disabled ? 'border-brand bg-brand-soft' : 'border-line hover:border-line-strong'
      }`}
    >
      <Icon className={`h-5 w-5 shrink-0 ${selected ? 'text-brand-strong' : 'text-content-muted'}`} aria-hidden />
      <span className="min-w-0 flex-1">
        <span className={`block text-sm font-medium ${selected ? 'text-brand-strong' : 'text-content'}`}>{label}</span>
        <span className="block text-xs text-content-muted">{hint}</span>
      </span>
      {trailing && <span className={selected ? 'text-brand-strong' : 'text-content-soft'}>{trailing}</span>}
    </button>
  );
}
