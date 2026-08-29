import type {
  CreateQuizInput,
  CreateQuizQuestionInput,
  CreateTopicInput,
  CreateVocabularyInput,
  PaginationInput,
  Paginated,
  PublicUser,
} from '@enghabit/shared';
import { apiClient } from '../../shared/lib/api-client';
import type { Topic, Vocabulary } from '../vocabulary/vocabulary.api';

export interface SystemStats {
  userCount: number;
  topicCount: number;
  vocabularyCount: number;
  quizCount: number;
  activityCount: number;
  activeLast7Days: number;
}

export async function getSystemStats(): Promise<SystemStats> {
  const { data } = await apiClient.get<SystemStats>('/admin/stats');
  return data;
}

export async function listUsers(pagination: Partial<PaginationInput> = {}): Promise<Paginated<PublicUser>> {
  const { data } = await apiClient.get<Paginated<PublicUser>>('/admin/users', { params: pagination });
  return data;
}

export async function deleteUser(id: number): Promise<void> {
  await apiClient.delete(`/admin/users/${id}`);
}

export async function createTopic(input: CreateTopicInput): Promise<Topic> {
  const { data } = await apiClient.post<Topic>('/admin/topics', input);
  return data;
}

export async function deleteTopic(id: number): Promise<void> {
  await apiClient.delete(`/admin/topics/${id}`);
}

export async function createVocabulary(input: CreateVocabularyInput): Promise<Vocabulary> {
  const { data } = await apiClient.post<Vocabulary>('/admin/vocabulary', input);
  return data;
}

export async function deleteVocabulary(id: number): Promise<void> {
  await apiClient.delete(`/admin/vocabulary/${id}`);
}

export async function createQuiz(input: CreateQuizInput): Promise<{ id: number; title: string }> {
  const { data } = await apiClient.post<{ id: number; title: string }>('/admin/quizzes', input);
  return data;
}

export async function addQuizQuestion(quizId: number, input: CreateQuizQuestionInput): Promise<{ id: number }> {
  const { data } = await apiClient.post<{ id: number }>(`/admin/quizzes/${quizId}/questions`, input);
  return data;
}
