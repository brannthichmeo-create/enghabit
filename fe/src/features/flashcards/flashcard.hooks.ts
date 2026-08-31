import { useMutation, useQuery, useQueryClient, type UseMutationResult, type UseQueryResult } from '@tanstack/react-query';
import type { ReviewFlashcardInput, SrsState } from '@enghabit/shared';
import { statisticsKeys } from '../statistics/statistics.hooks';
import { vocabularyKeys } from '../vocabulary/vocabulary.hooks';
import * as flashcardApi from './flashcard.api';
import type { DueCard } from './flashcard.api';

export const flashcardKeys = {
  all: ['flashcards'] as const,
  due: () => ['flashcards', 'due'] as const,
  dueCount: () => ['flashcards', 'due', 'count'] as const,
};

export function useDueCards(): UseQueryResult<DueCard[]> {
  return useQuery({ queryKey: flashcardKeys.due(), queryFn: flashcardApi.getDueCards });
}

export function useDueCount(enabled = true): UseQueryResult<number> {
  return useQuery({ queryKey: flashcardKeys.dueCount(), queryFn: flashcardApi.getDueCount, enabled });
}

/** Ôn tập ghi ActivityLog nên phải làm mới cả thống kê/streak. */
export function useSubmitReview(): UseMutationResult<SrsState, Error, ReviewFlashcardInput> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: flashcardApi.submitReview,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: flashcardKeys.dueCount() });
      void queryClient.invalidateQueries({ queryKey: statisticsKeys.all });
    },
  });
}

export function useLearnVocabulary(): UseMutationResult<SrsState, Error, number> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: flashcardApi.learnVocabulary,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: flashcardKeys.all });
      void queryClient.invalidateQueries({ queryKey: vocabularyKeys.all });
      void queryClient.invalidateQueries({ queryKey: statisticsKeys.all });
    },
  });
}
