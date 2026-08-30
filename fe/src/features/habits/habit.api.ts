import type { CheckInHabitInput, CreateHabitInput, HabitFrequency, LocalDate, UpdateHabitInput } from '@enghabit/shared';
import { apiClient } from '../../shared/lib/api-client';

/** Bản ghi thói quen trả về từ API. */
export interface Habit {
  id: number;
  name: string;
  frequency: HabitFrequency;
  customDays: number[] | null;
  reminderTime: string | null;
  isActive: boolean;
  createdAt: string;
  /** Backend tính sẵn theo timezone user — client không tự đoán để tránh bấm nhầm gây lỗi 409. */
  checkedInToday: boolean;
  /** Các ngày đã check-in trong 7 ngày gần nhất, để vẽ dải mức độ đều đặn. */
  recentCheckIns: LocalDate[];
}

export interface CheckInRecord {
  date: LocalDate;
  note: string | null;
}

export interface CompletionRate {
  expected: number;
  completed: number;
  rate: number;
}

export async function listHabits(): Promise<Habit[]> {
  const { data } = await apiClient.get<Habit[]>('/habits');
  return data;
}

export async function createHabit(input: CreateHabitInput): Promise<Habit> {
  const { data } = await apiClient.post<Habit>('/habits', input);
  return data;
}

export async function updateHabit(id: number, input: UpdateHabitInput): Promise<Habit> {
  const { data } = await apiClient.patch<Habit>(`/habits/${id}`, input);
  return data;
}

export async function deleteHabit(id: number): Promise<void> {
  await apiClient.delete(`/habits/${id}`);
}

export async function checkIn(id: number, input: CheckInHabitInput = {}): Promise<{ date: LocalDate }> {
  const { data } = await apiClient.post<{ date: LocalDate }>(`/habits/${id}/check-in`, input);
  return data;
}

export async function listCheckIns(id: number, from?: LocalDate, to?: LocalDate): Promise<CheckInRecord[]> {
  const { data } = await apiClient.get<CheckInRecord[]>(`/habits/${id}/check-ins`, { params: { from, to } });
  return data;
}

export async function getCompletionRate(id: number, from: LocalDate, to: LocalDate): Promise<CompletionRate> {
  const { data } = await apiClient.get<CompletionRate>(`/habits/${id}/completion-rate`, {
    params: { from, to },
  });
  return data;
}
