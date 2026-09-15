import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';
import type {
  CreateStudySetInput,
  ImportStudySetCardsInput,
  ImportStudySetCardsResult,
  ImportStudySetInput,
  ImportStudySetResult,
  Paginated,
  ReportStudySetInput,
  StudySetCard,
  StudySetCardInput,
  StudySetDetail,
  StudySetSearchInput,
  StudySetSummary,
  UpdateStudySetCardInput,
  UpdateStudySetInput,
} from '@enghabit/shared';
import { studyKeys } from '../study/study.hooks';
import * as libraryApi from './library.api';

export const libraryKeys = {
  all: ['library'] as const,
  search: (query: Partial<StudySetSearchInput>) => ['library', 'search', query] as const,
  mine: () => ['library', 'mine'] as const,
  detail: (setId: number) => ['library', 'detail', setId] as const,
};

export function useStudySetSearch(
  query: Partial<StudySetSearchInput>,
  enabled = true,
): UseQueryResult<Paginated<StudySetSummary>> {
  return useQuery({
    queryKey: libraryKeys.search(query),
    queryFn: () => libraryApi.searchSets(query),
    enabled,
    // Giữ trang cũ trong lúc tải trang mới để lưới không nháy trắng khi gõ tìm kiếm
    placeholderData: (previous) => previous,
  });
}

export function useMyStudySets(enabled = true): UseQueryResult<StudySetSummary[]> {
  return useQuery({ queryKey: libraryKeys.mine(), queryFn: libraryApi.listMySets, enabled });
}

/** `retry: false`: bộ riêng tư của người khác trả 404 — thử lại chỉ làm người dùng chờ lâu hơn. */
export function useStudySet(setId: number | null): UseQueryResult<StudySetDetail> {
  return useQuery({
    queryKey: libraryKeys.detail(setId ?? 0),
    queryFn: () => libraryApi.getSet(setId as number),
    enabled: setId !== null,
    retry: false,
  });
}

/**
 * Soạn bộ thẻ làm đổi cả nhóm ôn (thẻ mới, thẻ bị xoá, bộ chuyển riêng tư) nên làm mới
 * luôn dữ liệu của Học và Ôn tập, không chỉ thư viện.
 */
function useLibraryMutation<TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>,
): UseMutationResult<TData, Error, TVariables> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: libraryKeys.all });
      void queryClient.invalidateQueries({ queryKey: studyKeys.all });
    },
  });
}

export function useCreateStudySet(): UseMutationResult<StudySetSummary, Error, CreateStudySetInput> {
  return useLibraryMutation(libraryApi.createSet);
}

export function useUpdateStudySet(): UseMutationResult<
  StudySetSummary,
  Error,
  { setId: number; input: UpdateStudySetInput }
> {
  return useLibraryMutation(({ setId, input }) => libraryApi.updateSet(setId, input));
}

export function useDeleteStudySet(): UseMutationResult<void, Error, number> {
  return useLibraryMutation(libraryApi.deleteSet);
}

export function useAddCard(): UseMutationResult<StudySetCard, Error, { setId: number; input: StudySetCardInput }> {
  return useLibraryMutation(({ setId, input }) => libraryApi.addCard(setId, input));
}

export function useImportStudySet(): UseMutationResult<ImportStudySetResult, Error, ImportStudySetInput> {
  return useLibraryMutation(libraryApi.importSet);
}

export function useImportCards(): UseMutationResult<
  ImportStudySetCardsResult,
  Error,
  { setId: number; input: ImportStudySetCardsInput }
> {
  return useLibraryMutation(({ setId, input }) => libraryApi.importCards(setId, input));
}

export function useUpdateCard(): UseMutationResult<
  StudySetCard,
  Error,
  { cardId: number; input: UpdateStudySetCardInput }
> {
  return useLibraryMutation(({ cardId, input }) => libraryApi.updateCard(cardId, input));
}

export function useDeleteCard(): UseMutationResult<void, Error, number> {
  return useLibraryMutation(libraryApi.deleteCard);
}

export function useReportStudySet(): UseMutationResult<void, Error, { setId: number; input: ReportStudySetInput }> {
  return useLibraryMutation(({ setId, input }) => libraryApi.reportSet(setId, input));
}
