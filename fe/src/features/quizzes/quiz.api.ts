import type { QuizResult, SubmitQuizInput } from '@enghabit/shared';
import { apiClient } from '../../shared/lib/api-client';

export interface QuizListItem {
  id: number;
  title: string;
  topic: { id: number; name: string };
  _count: { questions: number };
}

/** Đề bài — backend không trả correctIndex trước khi nộp. */
export interface QuizForAttempt {
  id: number;
  title: string;
  questions: { id: number; questionText: string; options: string[] }[];
}

export interface QuizAttemptRecord {
  id: number;
  score: number;
  total: number;
  completedAt: string;
  quiz: { id: number; title: string };
}

export async function listQuizzes(topicId?: number): Promise<QuizListItem[]> {
  const { data } = await apiClient.get<QuizListItem[]>('/quizzes', { params: { topicId } });
  return data;
}

export async function getQuiz(id: number): Promise<QuizForAttempt> {
  const { data } = await apiClient.get<QuizForAttempt>(`/quizzes/${id}`);
  return data;
}

export async function submitQuiz(id: number, input: SubmitQuizInput): Promise<QuizResult> {
  const { data } = await apiClient.post<QuizResult>(`/quizzes/${id}/submit`, input);
  return data;
}

export async function listAttempts(quizId?: number): Promise<QuizAttemptRecord[]> {
  const { data } = await apiClient.get<QuizAttemptRecord[]>('/quizzes/attempts', { params: { quizId } });
  return data;
}
