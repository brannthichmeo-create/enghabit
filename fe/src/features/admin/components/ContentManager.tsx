import { useState, type FormEvent } from 'react';
import { VocabLevel, createTopicSchema, createVocabularySchema } from '@enghabit/shared';
import { getErrorMessage } from '../../../shared/lib/api-client';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorMessage,
  Field,
  Input,
  SkeletonList,
  Select,
} from '../../../shared/components/ui';
import { VOCAB_LEVEL_LABELS } from '../../../shared/lib/labels';
import { useTopics, useTopicVocabulary } from '../../vocabulary/vocabulary.hooks';
import { useCreateTopic, useCreateVocabulary, useDeleteTopic } from '../admin.hooks';
import { useT } from '../../../shared/i18n/language';

/** Quản lý chủ đề và từ vựng. Chọn một chủ đề để thêm/xem từ trong chủ đề đó. */
export function ContentManager(): JSX.Element {
  const t = useT();
  const topics = useTopics();
  const deleteTopic = useDeleteTopic();
  const [selectedTopicId, setSelectedTopicId] = useState<number | null>(null);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section>
        <h2 className="mb-3 font-semibold text-on-page">{t('Chủ đề')}</h2>

        <div className="mb-4">
          <TopicForm />
        </div>

        {topics.isLoading && <SkeletonList rows={3} />}
        {topics.isError && <ErrorMessage>{getErrorMessage(topics.error)}</ErrorMessage>}
        {deleteTopic.isError && <ErrorMessage>{getErrorMessage(deleteTopic.error)}</ErrorMessage>}

        <div className="space-y-2">
          {topics.data?.map((topic) => (
            <Card key={topic.id} className={selectedTopicId === topic.id ? 'ring-2 ring-brand' : ''}>
              <div className="flex items-start justify-between gap-3">
                <button onClick={() => setSelectedTopicId(topic.id)} className="min-w-0 text-left">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-content">{topic.name}</span>
                    <Badge>{VOCAB_LEVEL_LABELS[topic.level]}</Badge>
                  </div>
                  <p className="mt-0.5 text-xs text-content-muted">{t('{n} từ vựng', { n: topic.vocabularyCount })}</p>
                </button>

                <Button
                  variant="ghost"
                  onClick={() => {
                    if (confirm(t('Xoá chủ đề "{name}"? Toàn bộ từ vựng và quiz thuộc chủ đề sẽ mất.', { name: topic.name }))) {
                      deleteTopic.mutate(topic.id);
                      if (selectedTopicId === topic.id) setSelectedTopicId(null);
                    }
                  }}
                >
                  {t('Xoá')}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-semibold text-on-page">{t('Từ vựng')}</h2>
        {selectedTopicId === null ? (
          <EmptyState title={t('Chọn một chủ đề')} description={t('Chọn chủ đề bên trái để quản lý từ vựng')} />
        ) : (
          <VocabularyManager topicId={selectedTopicId} />
        )}
      </section>
    </div>
  );
}

function TopicForm(): JSX.Element {
  const t = useT();
  const createTopic = useCreateTopic();
  const [name, setName] = useState('');
  const [level, setLevel] = useState<VocabLevel>(VocabLevel.BEGINNER);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = (event: FormEvent): void => {
    event.preventDefault();
    setValidationError(null);

    const parsed = createTopicSchema.safeParse({ name, level });
    if (!parsed.success) {
      setValidationError(parsed.error.issues[0]?.message ?? t('Dữ liệu không hợp lệ'));
      return;
    }

    createTopic.mutate(parsed.data, { onSuccess: () => setName('') });
  };

  return (
    <Card>
      <form onSubmit={handleSubmit} className="space-y-3">
        <ErrorMessage>{validationError ?? (createTopic.error ? getErrorMessage(createTopic.error) : null)}</ErrorMessage>

        <Field label={t('Tên chủ đề mới')}>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t('Ví dụ: Travel English')} />
        </Field>

        <Field label={t('Trình độ')}>
          <Select value={level} onChange={(e) => setLevel(e.target.value as VocabLevel)}>
            {Object.entries(VOCAB_LEVEL_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </Field>

        <Button type="submit" disabled={createTopic.isPending}>
          {createTopic.isPending ? t('Đang tạo...') : t('Thêm chủ đề')}
        </Button>
      </form>
    </Card>
  );
}

function VocabularyManager({ topicId }: { topicId: number }): JSX.Element {
  const t = useT();
  const vocabulary = useTopicVocabulary(topicId);
  const createVocabulary = useCreateVocabulary();
  const [form, setForm] = useState({ word: '', meaning: '', phonetic: '', example: '' });
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = (event: FormEvent): void => {
    event.preventDefault();
    setValidationError(null);

    const parsed = createVocabularySchema.safeParse({
      topicId,
      word: form.word,
      meaning: form.meaning,
      phonetic: form.phonetic || undefined,
      example: form.example || undefined,
    });

    if (!parsed.success) {
      setValidationError(parsed.error.issues[0]?.message ?? t('Dữ liệu không hợp lệ'));
      return;
    }

    createVocabulary.mutate(parsed.data, {
      onSuccess: () => setForm({ word: '', meaning: '', phonetic: '', example: '' }),
    });
  };

  return (
    <div>
      <Card className="mb-4">
        <form onSubmit={handleSubmit} className="space-y-3">
          <ErrorMessage>
            {validationError ?? (createVocabulary.error ? getErrorMessage(createVocabulary.error) : null)}
          </ErrorMessage>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={t('Từ')}>
              <Input value={form.word} onChange={(e) => setForm({ ...form, word: e.target.value })} />
            </Field>
            <Field label={t('Phiên âm (tuỳ chọn)')}>
              <Input value={form.phonetic} onChange={(e) => setForm({ ...form, phonetic: e.target.value })} />
            </Field>
          </div>

          <Field label={t('Nghĩa')}>
            <Input value={form.meaning} onChange={(e) => setForm({ ...form, meaning: e.target.value })} />
          </Field>

          <Field label={t('Câu ví dụ (tuỳ chọn)')}>
            <Input value={form.example} onChange={(e) => setForm({ ...form, example: e.target.value })} />
          </Field>

          <Button type="submit" disabled={createVocabulary.isPending}>
            {createVocabulary.isPending ? t('Đang thêm...') : t('Thêm từ vựng')}
          </Button>
        </form>
      </Card>

      {vocabulary.isLoading && <SkeletonList rows={3} />}
      {vocabulary.data?.length === 0 && <EmptyState title={t('Chủ đề này chưa có từ nào')} />}

      <div className="space-y-2">
        {vocabulary.data?.map((word) => (
          <Card key={word.id}>
            <p className="font-medium text-content">
              {word.word} {word.phonetic && <span className="text-sm text-content-muted">{word.phonetic}</span>}
            </p>
            <p className="text-sm text-content-soft">{word.meaning}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
