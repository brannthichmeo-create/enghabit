import type { ReviewFlashcardInput, SrsState } from '@enghabit/shared';
import { apiClient } from '../../shared/lib/api-client';

export interface DueCard {
  vocabularyId: number;
  word: string;
  meaning: string;
  phonetic: string | null;
  example: string | null;
  audioUrl: string | null;
  topicName: string;
}

export async function getDueCards(): Promise<DueCard[]> {
  const { data } = await apiClient.get<DueCard[]>('/flashcards/due');
  return data;
}

export async function getDueCount(): Promise<number> {
  const { data } = await apiClient.get<{ count: number }>('/flashcards/due/count');
  return data.count;
}

export async function submitReview(input: ReviewFlashcardInput): Promise<SrsState> {
  const { data } = await apiClient.post<SrsState>('/flashcards/review', input);
  return data;
}

/** Đưa một từ vào danh sách ôn tập SRS. */
export async function learnVocabulary(vocabularyId: number): Promise<SrsState> {
  const { data } = await apiClient.post<SrsState>('/flashcards/learn', { vocabularyId });
  return data;
}
