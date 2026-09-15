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
import { apiClient } from '../../shared/lib/api-client';

/** Thư viện bộ thẻ. Quyền truy cập do backend quyết định — bộ riêng tư của người khác trả 404. */

export async function searchSets(query: Partial<StudySetSearchInput>): Promise<Paginated<StudySetSummary>> {
  const { data } = await apiClient.get<Paginated<StudySetSummary>>('/library/sets', { params: query });
  return data;
}

export async function listMySets(): Promise<StudySetSummary[]> {
  const { data } = await apiClient.get<StudySetSummary[]>('/library/sets/mine');
  return data;
}

export async function getSet(setId: number): Promise<StudySetDetail> {
  const { data } = await apiClient.get<StudySetDetail>(`/library/sets/${setId}`);
  return data;
}

export async function createSet(input: CreateStudySetInput): Promise<StudySetSummary> {
  const { data } = await apiClient.post<StudySetSummary>('/library/sets', input);
  return data;
}

export async function updateSet(setId: number, input: UpdateStudySetInput): Promise<StudySetSummary> {
  const { data } = await apiClient.patch<StudySetSummary>(`/library/sets/${setId}`, input);
  return data;
}

export async function deleteSet(setId: number): Promise<void> {
  await apiClient.delete(`/library/sets/${setId}`);
}

export async function addCard(setId: number, input: StudySetCardInput): Promise<StudySetCard> {
  const { data } = await apiClient.post<StudySetCard>(`/library/sets/${setId}/cards`, input);
  return data;
}

export async function importSet(input: ImportStudySetInput): Promise<ImportStudySetResult> {
  const { data } = await apiClient.post<ImportStudySetResult>('/library/sets/import', input);
  return data;
}

export async function importCards(setId: number, input: ImportStudySetCardsInput): Promise<ImportStudySetCardsResult> {
  const { data } = await apiClient.post<ImportStudySetCardsResult>(`/library/sets/${setId}/cards/import`, input);
  return data;
}

export async function updateCard(cardId: number, input: UpdateStudySetCardInput): Promise<StudySetCard> {
  const { data } = await apiClient.patch<StudySetCard>(`/library/cards/${cardId}`, input);
  return data;
}

export async function deleteCard(cardId: number): Promise<void> {
  await apiClient.delete(`/library/cards/${cardId}`);
}

export async function reportSet(setId: number, input: ReportStudySetInput): Promise<void> {
  await apiClient.post(`/library/sets/${setId}/reports`, input);
}
