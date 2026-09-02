import { useState } from 'react';
import { Check, Lock, Play, RotateCw, Sparkles } from 'lucide-react';
import type { LessonSummary, PathTopic } from '@enghabit/shared';
import { getErrorMessage } from '../../../shared/lib/api-client';
import { Badge, Button, Card, EmptyState, ErrorMessage, PageHeader, SkeletonList } from '../../../shared/components/ui';
import { VOCAB_LEVEL_LABELS } from '../../../shared/lib/labels';
import type { VocabLevel } from '@enghabit/shared';
import { useLesson, useMistakeCount, useMistakePractice, usePath } from '../lesson.hooks';
import { LessonPlayer } from './LessonPlayer';
import { useT } from '../../../shared/i18n/language';

/**
 * Lộ trình học: mỗi chủ đề là một hàng bài, mở khoá dần theo thứ tự.
 *
 * Bài học sinh ra từ chính từ vựng của chủ đề nên thêm từ là lộ trình tự dài ra.
 */
export function PathPage(): JSX.Element {
  const t = useT();
  const path = usePath();
  const mistakeCount = useMistakeCount();
  const [active, setActive] = useState<{ topicId: number; index: number } | null>(null);
  const [practicing, setPracticing] = useState(false);

  if (practicing) return <MistakePractice onExit={() => setPracticing(false)} />;
  if (active) return <ActiveLesson {...active} onExit={() => setActive(null)} />;

  return (
    <div>
      <PageHeader
        title={t('Lộ trình học')}
        description={t('Hoàn thành từng bài để mở khoá bài tiếp theo')}
      />

      {mistakeCount.data !== undefined && mistakeCount.data > 0 && (
        <button onClick={() => setPracticing(true)} className="mb-6 block w-full text-left">
          <div className="flex items-center gap-3 rounded-xl border border-accent/40 bg-accent-soft px-5 py-4 transition-colors hover:bg-accent/20">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/20">
              <RotateCw className="h-4 w-4 text-accent-ink" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-accent-ink">
                {t('{n} từ bạn từng trả lời sai', { n: mistakeCount.data })}
              </p>
              <p className="text-sm text-accent-ink">{t('Luyện lại để nhớ chắc hơn')}</p>
            </div>
            <Play className="h-4 w-4 shrink-0 text-accent-ink" aria-hidden />
          </div>
        </button>
      )}

      {path.isLoading && <SkeletonList rows={3} />}
      {path.isError && <ErrorMessage>{getErrorMessage(path.error)}</ErrorMessage>}

      {path.data?.length === 0 && (
        <EmptyState
          icon={Sparkles}
          title={t('Chưa có nội dung học')}
          description={t('Quản trị viên cần thêm chủ đề và từ vựng trước.')}
        />
      )}

      <div className="space-y-4">
        {path.data?.map((topic) => (
          <TopicRow key={topic.topicId} topic={topic} onStart={setActive} />
        ))}
      </div>
    </div>
  );
}

function TopicRow({
  topic,
  onStart,
}: {
  topic: PathTopic;
  onStart: (lesson: { topicId: number; index: number }) => void;
}): JSX.Element {
  const t = useT();
  const allDone = topic.completedLessons === topic.lessons.length && topic.lessons.length > 0;

  return (
    <Card>
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-content">{topic.name}</h3>
            <Badge>{VOCAB_LEVEL_LABELS[topic.level as VocabLevel]}</Badge>
            {allDone && (
              <Badge tone="green" icon={Check}>
                {t('Hoàn thành')}
              </Badge>
            )}
          </div>
          {topic.description && <p className="mt-1 text-sm text-content-muted">{topic.description}</p>}
        </div>

        <span className="shrink-0 text-sm tabular-nums text-content-muted">
          {t('{done}/{total} bài', { done: topic.completedLessons, total: topic.lessons.length })}
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {topic.lessons.map((lesson) => (
          <LessonNode key={lesson.index} lesson={lesson} onStart={onStart} />
        ))}
      </div>
    </Card>
  );
}

/**
 * Một bài trên lộ trình.
 * Ba trạng thái: đã xong (xanh), đang mở (viền đậm), còn khoá (xám + ổ khoá).
 */
function LessonNode({
  lesson,
  onStart,
}: {
  lesson: LessonSummary;
  onStart: (lesson: { topicId: number; index: number }) => void;
}): JSX.Element {
  const t = useT();
  if (!lesson.isUnlocked) {
    return (
      <div
        className="flex h-[68px] w-[92px] cursor-not-allowed flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-line text-content-muted"
        title={t('Hoàn thành bài trước để mở khoá')}
      >
        <Lock className="h-4 w-4" aria-hidden />
        <span className="text-xs">{lesson.title}</span>
      </div>
    );
  }

  return (
    <button
      onClick={() => onStart({ topicId: lesson.topicId, index: lesson.index })}
      className={`flex h-[68px] w-[92px] flex-col items-center justify-center gap-1 rounded-xl border-2 transition-colors ${
        lesson.isCompleted
          ? 'border-success/40 bg-success-soft text-success hover:border-success/60'
          : 'border-brand bg-brand-soft text-brand-strong hover:bg-brand-soft/70'
      }`}
    >
      {lesson.isCompleted ? <Check className="h-4 w-4" aria-hidden /> : <Play className="h-4 w-4" aria-hidden />}
      <span className="text-xs font-medium">{lesson.title}</span>
      {lesson.bestScore !== null && <span className="text-[10px] tabular-nums">{lesson.bestScore}%</span>}
    </button>
  );
}

function ActiveLesson({
  topicId,
  index,
  onExit,
}: {
  topicId: number;
  index: number;
  onExit: () => void;
}): JSX.Element {
  const t = useT();
  const lesson = useLesson(topicId, index);

  if (lesson.isLoading) return <SkeletonList rows={2} />;
  if (lesson.isError) return <ErrorMessage>{getErrorMessage(lesson.error)}</ErrorMessage>;
  if (!lesson.data) return <ErrorMessage>{t('Không tải được bài học')}</ErrorMessage>;

  return <LessonPlayer lesson={lesson.data} onExit={onExit} />;
}

function MistakePractice({ onExit }: { onExit: () => void }): JSX.Element {
  const t = useT();
  const practice = useMistakePractice(true);

  if (practice.isLoading) return <SkeletonList rows={2} />;

  if (practice.isError || !practice.data) {
    return (
      <div>
        <PageHeader title={t('Ôn lại từ sai')} />
        <EmptyState
          icon={Check}
          title={t('Bạn không còn từ nào cần ôn lại')}
          description={t('Trả lời đúng 2 lần liên tiếp là một từ được gỡ khỏi danh sách này.')}
          action={
            <Button variant="secondary" onClick={onExit}>
              {t('Về lộ trình')}
            </Button>
          }
        />
      </div>
    );
  }

  return <LessonPlayer lesson={practice.data} onExit={onExit} />;
}
