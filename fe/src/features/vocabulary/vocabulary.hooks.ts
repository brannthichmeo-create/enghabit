import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import * as vocabularyApi from './vocabulary.api';
import type { Topic, Vocabulary } from './vocabulary.api';

export const vocabularyKeys = {
  all: ['vocabulary'] as const,
  topics: () => ['vocabulary', 'topics'] as const,
  byTopic: (topicId: number) => ['vocabulary', 'topic', topicId] as const,
};

export function useTopics(): UseQueryResult<Topic[]> {
  return useQuery({ queryKey: vocabularyKeys.topics(), queryFn: vocabularyApi.listTopics });
}

export function useTopicVocabulary(topicId: number | null): UseQueryResult<Vocabulary[]> {
  return useQuery({
    queryKey: vocabularyKeys.byTopic(topicId ?? 0),
    queryFn: () => vocabularyApi.listVocabularyByTopic(topicId as number),
    enabled: topicId !== null,
  });
}
