import type {
  CheckInHabitInput,
  CreateHabitInput,
  GoalPeriod,
  GoalStatus,
  GoalType,
  HabitAutoActivity,
  HabitDayLevel,
  HabitFrequency,
  LocalDate,
  UpdateHabitInput,
} from '@enghabit/shared';
import { apiClient } from '../../shared/lib/api-client';

/** Bản ghi thói quen trả về từ API. */
export interface Habit {
  id: number;
  name: string;
  frequency: HabitFrequency;
  customDays: number[] | null;
  reminderTime: string | null;
  isActive: boolean;
  /** Null = tự tích. Có giá trị = tự hoàn thành từ hoạt động học trong app. */
  autoActivity: HabitAutoActivity | null;
  targetAmount: number | null;
  minAmount: number | null;
  unit: string | null;
  timesPerWeek: number | null;
  goalId: number | null;
  goal: { id: number; type: GoalType; period: GoalPeriod; targetValue: number; status: GoalStatus } | null;
  createdAt: string;
  /** Hôm nay đã đạt ít nhất mức tối thiểu chưa — backend tính theo timezone user. */
  checkedInToday: boolean;
  /** Lượng đã làm hôm nay, null nếu chưa làm gì. */
  todayAmount: number | null;
  /** Các ngày có làm trong 7 ngày gần nhất, kèm lượng và ghi chú — để vẽ dải 7 ngày. */
  recentDays: HabitDay[];
}

export interface HabitDay {
  date: LocalDate;
  amount: number | null;
  note: string | null;
  /** Null = có làm nhưng chưa tới mức tối thiểu (chỉ gặp ở thói quen tự động). */
  level: HabitDayLevel | null;
}

export interface CheckInRecord {
  date: LocalDate;
  amount: number | null;
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
