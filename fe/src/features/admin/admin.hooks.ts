import { useMutation, useQuery, useQueryClient, type UseMutationResult, type UseQueryResult } from '@tanstack/react-query';
import type { CreateTopicInput, CreateVocabularyInput, Paginated, PublicUser } from '@enghabit/shared';
import { vocabularyKeys } from '../vocabulary/vocabulary.hooks';
import type { Topic, Vocabulary } from '../vocabulary/vocabulary.api';
import * as adminApi from './admin.api';
import type { SystemStats } from './admin.api';

export const adminKeys = {
  all: ['admin'] as const,
  stats: () => ['admin', 'stats'] as const,
  users: (page: number) => ['admin', 'users', page] as const,
};

export function useSystemStats(): UseQueryResult<SystemStats> {
  return useQuery({ queryKey: adminKeys.stats(), queryFn: adminApi.getSystemStats });
}

export function useAdminUsers(page: number): UseQueryResult<Paginated<PublicUser>> {
  return useQuery({ queryKey: adminKeys.users(page), queryFn: () => adminApi.listUsers({ page }) });
}

export function useDeleteUser(): UseMutationResult<void, Error, number> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: adminApi.deleteUser,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: adminKeys.all }),
  });
}

/** Tạo chủ đề ảnh hưởng cả danh sách chủ đề phía người học nên invalidate cả hai key. */
export function useCreateTopic(): UseMutationResult<Topic, Error, CreateTopicInput> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: adminApi.createTopic,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.all });
      void queryClient.invalidateQueries({ queryKey: vocabularyKeys.all });
    },
  });
}

export function useDeleteTopic(): UseMutationResult<void, Error, number> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: adminApi.deleteTopic,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.all });
      void queryClient.invalidateQueries({ queryKey: vocabularyKeys.all });
    },
  });
}

export function useCreateVocabulary(): UseMutationResult<Vocabulary, Error, CreateVocabularyInput> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: adminApi.createVocabulary,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.all });
      void queryClient.invalidateQueries({ queryKey: vocabularyKeys.all });
    },
  });
}
