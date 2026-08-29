import type { VocabLevel } from '@enghabit/shared';
import { apiClient } from '../../shared/lib/api-client';

export interface Topic {
  id: number;
  name: string;
  description: string | null;
  level: VocabLevel;
  vocabularyCount: number;
}

export interface Vocabulary {
  id: number;
  topicId: number;
  word: string;
  meaning: string;
  phonetic: string | null;
  example: string | null;
  audioUrl: string | null;
  /** User đã đưa từ này vào danh sách ôn tập chưa. */
  isLearning: boolean;
}

export async function listTopics(): Promise<Topic[]> {
  const { data } = await apiClient.get<Topic[]>('/topics');
  return data;
}

export async function listVocabularyByTopic(topicId: number): Promise<Vocabulary[]> {
  const { data } = await apiClient.get<Vocabulary[]>(`/topics/${topicId}/vocabulary`);
  return data;
}
