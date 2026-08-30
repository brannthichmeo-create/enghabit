import { useState } from 'react';
import { Check, Lock, Play, RotateCw, Sparkles } from 'lucide-react';
import type { LessonSummary, PathTopic } from '@enghabit/shared';
import { getErrorMessage } from '../../../shared/lib/api-client';
import { Badge, Button, Card, EmptyState, ErrorMessage, PageHeader, SkeletonList } from '../../../shared/components/ui';
import { VOCAB_LEVEL_LABELS } from '../../../shared/lib/labels';
import type { VocabLevel } from '@enghabit/shared';
import { useLesson, useMistakeCount, useMistakePractice, usePath } from '../lesson.hooks';
import { LessonPlayer } from './LessonPlayer';

/**
 * Lộ trình học: mỗi chủ đề là một hàng bài, mở khoá dần theo thứ tự.
 *
 * Bài học sinh ra từ chính từ vựng của chủ đề nên thêm từ là lộ trình tự dài ra.
 */
export function PathPage(): JSX.Element {
  const path = usePath();
  const mistakeCount = useMistakeCount();
  const [active, setActive] = useState<{ topicId: number; index: number } | null>(null);
  const [practicing, setPracticing] = useState(false);

  if (practicing) return <MistakePractice onExit={() => setPracticing(false)} />;
  if (active) return <ActiveLesson {...active} onExit={() => setActive(null)} />;

  return (
    <div>
      <PageHeader
        title="Lộ trình học"
        description="Hoàn thành từng bài để mở khoá bài tiếp theo"
      />

      {mistakeCount.data !== undefined && mistakeCount.data > 0 && (
        <button onClick={() => setPracticing(true)} className="mb-6 block w-full text-left">
          <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 transition-colors hover:bg-amber-100">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100">
              <RotateCw className="h-4 w-4 text-amber-700" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-amber-900">
                {mistakeCount.data} từ bạn từng trả lời sai
              </p>
              <p className="text-sm text-amber-700">Luyện lại để nhớ chắc hơn</p>
            </div>
            <Play className="h-4 w-4 shrink-0 text-amber-600" aria-hidden />
          </div>
        </button>
      )}

      {path.isLoading && <SkeletonList rows={3} />}
      {path.isError && <ErrorMessage>{getErrorMessage(path.error)}</ErrorMessage>}

      {path.data?.length === 0 && (
        <EmptyState
          icon={Sparkles}
          title="Chưa có nội dung học"
          description="Quản trị viên cần thêm chủ đề và từ vựng trước."
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
  const allDone = topic.completedLessons === topic.lessons.length && topic.lessons.length > 0;

  return (
    <Card>
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-slate-900">{topic.name}</h3>
            <Badge>{VOCAB_LEVEL_LABELS[topic.level as VocabLevel]}</Badge>
            {allDone && (
              <Badge tone="green" icon={Check}>
                Hoàn thành
              </Badge>
            )}
          </div>
          {topic.description && <p className="mt-1 text-sm text-slate-500">{topic.description}</p>}
        </div>

        <span className="shrink-0 text-sm tabular-nums text-slate-500">
          {topic.completedLessons}/{topic.lessons.length} bài
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
  if (!lesson.isUnlocked) {
    return (
      <div
        className="flex h-[68px] w-[92px] cursor-not-allowed flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-slate-200 text-slate-300"
        title="Hoàn thành bài trước để mở khoá"
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
          ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-300'
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
  const lesson = useLesson(topicId, index);

  if (lesson.isLoading) return <SkeletonList rows={2} />;
  if (lesson.isError) return <ErrorMessage>{getErrorMessage(lesson.error)}</ErrorMessage>;
  if (!lesson.data) return <ErrorMessage>Không tải được bài học</ErrorMessage>;

  return <LessonPlayer lesson={lesson.data} onExit={onExit} />;
}

function MistakePractice({ onExit }: { onExit: () => void }): JSX.Element {
  const practice = useMistakePractice(true);

  if (practice.isLoading) return <SkeletonList rows={2} />;

  if (practice.isError || !practice.data) {
    return (
      <div>
        <PageHeader title="Ôn lại từ sai" />
        <EmptyState
          icon={Check}
          title="Bạn không còn từ nào cần ôn lại"
          description="Trả lời đúng 2 lần liên tiếp là một từ được gỡ khỏi danh sách này."
          action={
            <Button variant="secondary" onClick={onExit}>
              Về lộ trình
            </Button>
          }
        />
      </div>
    );
  }

  return <LessonPlayer lesson={practice.data} onExit={onExit} />;
}
