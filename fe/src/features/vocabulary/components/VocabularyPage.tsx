import { useState } from 'react';
import { VocabLevel } from '@enghabit/shared';
import { getErrorMessage } from '../../../shared/lib/api-client';
import { Badge, Button, Card, EmptyState, ErrorMessage, SkeletonList, PageHeader } from '../../../shared/components/ui';
import { VOCAB_LEVEL_LABELS } from '../../../shared/lib/labels';
import { useLearnVocabulary } from '../../flashcards/flashcard.hooks';
import { useTopics, useTopicVocabulary } from '../vocabulary.hooks';

export function VocabularyPage(): JSX.Element {
  const topics = useTopics();
  const [selectedTopicId, setSelectedTopicId] = useState<number | null>(null);
  const vocabulary = useTopicVocabulary(selectedTopicId);
  const learnVocabulary = useLearnVocabulary();

  const selectedTopic = topics.data?.find((t) => t.id === selectedTopicId);

  if (topics.isLoading) return <SkeletonList rows={3} />;
  if (topics.isError) return <ErrorMessage>{getErrorMessage(topics.error)}</ErrorMessage>;

  // Danh sách chủ đề
  if (selectedTopicId === null) {
    return (
      <div>
        <PageHeader title="Từ vựng theo chủ đề" description="Chọn chủ đề để bắt đầu học từ mới" />

        {topics.data?.length === 0 && (
          <EmptyState title="Chưa có chủ đề nào" description="Quản trị viên cần thêm nội dung học tập" />
        )}

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {topics.data?.map((topic) => (
            <button key={topic.id} onClick={() => setSelectedTopicId(topic.id)} className="text-left">
              <Card className="h-full transition hover:shadow-md">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-content">{topic.name}</h3>
                  <Badge>{VOCAB_LEVEL_LABELS[topic.level]}</Badge>
                </div>
                {topic.description && <p className="mt-1 text-sm text-content-muted">{topic.description}</p>}
                <p className="mt-3 text-xs text-content-muted">{topic.vocabularyCount} từ vựng</p>
              </Card>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Danh sách từ trong một chủ đề
  return (
    <div>
      <PageHeader
        title={selectedTopic?.name ?? 'Từ vựng'}
        description={selectedTopic?.description ?? undefined}
        action={
          <Button variant="secondary" onClick={() => setSelectedTopicId(null)}>
            ← Chủ đề khác
          </Button>
        }
      />

      {vocabulary.isLoading && <SkeletonList rows={3} />}
      {vocabulary.isError && <ErrorMessage>{getErrorMessage(vocabulary.error)}</ErrorMessage>}
      {learnVocabulary.isError && <ErrorMessage>{getErrorMessage(learnVocabulary.error)}</ErrorMessage>}

      {vocabulary.data?.length === 0 && <EmptyState title="Chủ đề này chưa có từ vựng" />}

      <div className="space-y-2">
        {vocabulary.data?.map((word) => (
          <Card key={word.id}>
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="text-lg font-semibold text-content">{word.word}</span>
                  {word.phonetic && <span className="text-sm text-content-muted">{word.phonetic}</span>}
                </div>
                <p className="text-content-soft">{word.meaning}</p>
                {word.example && <p className="mt-1 text-sm italic text-content-muted">"{word.example}"</p>}
              </div>

              {word.isLearning ? (
                <Badge tone="green">Đang học</Badge>
              ) : (
                <Button
                  variant="secondary"
                  onClick={() => learnVocabulary.mutate(word.id)}
                  disabled={learnVocabulary.isPending}
                >
                  + Học từ này
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
