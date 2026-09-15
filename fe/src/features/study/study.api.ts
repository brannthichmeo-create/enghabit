import type {
  AnswerResult,
  CardReviewRow,
  FinishSessionResult,
  Paginated,
  ReviewHistoryQueryInput,
  StudyOverview,
  StudyQuestionsInput,
  StudyQuestionsResult,
  StudyStats,
  SubmitAnswerInput,
} from '@enghabit/shared';
import { apiClient } from '../../shared/lib/api-client';

/** Học, Ôn tập và Cram Mode. Đáp án đúng chỉ về sau khi đã trả lời. */

export async function getQuestions(input: StudyQuestionsInput): Promise<StudyQuestionsResult> {
  const { data } = await apiClient.post<StudyQuestionsResult>('/study/questions', input);
  return data;
}

export async function submitAnswer(input: SubmitAnswerInput): Promise<AnswerResult> {
  const { data } = await apiClient.post<AnswerResult>('/study/answers', input);
  return data;
}

export async function finishSession(sessionKey: string): Promise<FinishSessionResult> {
  const { data } = await apiClient.post<FinishSessionResult>('/study/sessions/finish', { sessionKey });
  return data;
}

export async function getOverview(): Promise<StudyOverview> {
  const { data } = await apiClient.get<StudyOverview>('/study/overview');
  return data;
}

export async function getDueCount(): Promise<number> {
  const { data } = await apiClient.get<{ count: number }>('/study/due-count');
  return data.count;
}

export async function getStats(): Promise<StudyStats> {
  const { data } = await apiClient.get<StudyStats>('/study/stats');
  return data;
}

export async function getHistory(query: Partial<ReviewHistoryQueryInput>): Promise<Paginated<CardReviewRow>> {
  const { data } = await apiClient.get<Paginated<CardReviewRow>>('/study/history', { params: query });
  return data;
}
