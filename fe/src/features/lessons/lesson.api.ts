import type {
  LessonDetail,
  LessonResult,
  MistakeItem,
  PathTopic,
  SubmitExamInput,
  SubmitLessonInput,
} from '@enghabit/shared';
import { apiClient } from '../../shared/lib/api-client';

export async function getPath(): Promise<PathTopic[]> {
  const { data } = await apiClient.get<PathTopic[]>('/lessons/path');
  return data;
}

export async function getLesson(topicId: number, index: number): Promise<LessonDetail> {
  const { data } = await apiClient.get<LessonDetail>(`/lessons/${topicId}/${index}`);
  return data;
}

export async function submitLesson(input: SubmitLessonInput): Promise<LessonResult> {
  const { data } = await apiClient.post<LessonResult>('/lessons/submit', input);
  return data;
}

export async function getMistakes(limit = 10): Promise<MistakeItem[]> {
  const { data } = await apiClient.get<MistakeItem[]>('/lessons/mistakes', { params: { limit } });
  return data;
}

export async function getMistakeCount(): Promise<number> {
  const { data } = await apiClient.get<{ count: number }>('/lessons/mistakes/count');
  return data.count;
}

export async function getMistakePractice(limit = 10): Promise<LessonDetail> {
  const { data } = await apiClient.get<LessonDetail>('/lessons/mistakes/practice', {
    params: { limit },
  });
  return data;
}

/** Đề bài Kiểm tra của một chủ đề — sinh từ toàn bộ từ vựng, ưu tiên từ đang sai. */
export async function getTopicExam(topicId: number): Promise<LessonDetail> {
  const { data } = await apiClient.get<LessonDetail>(`/lessons/exam/${topicId}`);
  return data;
}

export async function submitExam(input: SubmitExamInput): Promise<LessonResult> {
  const { data } = await apiClient.post<LessonResult>('/lessons/exam/submit', input);
  return data;
}
