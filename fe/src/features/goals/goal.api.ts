import type {
  CreateGoalInput,
  FinishGoalInput,
  GoalPeriod,
  GoalProgress,
  GoalStatus,
  GoalType,
  UpdateGoalInput,
} from '@enghabit/shared';
import { apiClient } from '../../shared/lib/api-client';

export interface Goal {
  id: number;
  type: GoalType;
  targetValue: number;
  period: GoalPeriod;
  startDate: string;
  endDate: string | null;
  status: GoalStatus;
  /** Ngày bắt đầu tạm dừng, null = đang chạy. */
  pausedAt: string | null;
  createdAt: string;
}

export async function listGoals(): Promise<Goal[]> {
  const { data } = await apiClient.get<Goal[]>('/goals');
  return data;
}

export async function getProgress(): Promise<GoalProgress[]> {
  const { data } = await apiClient.get<GoalProgress[]>('/goals/progress');
  return data;
}

export async function createGoal(input: CreateGoalInput): Promise<Goal> {
  const { data } = await apiClient.post<Goal>('/goals', input);
  return data;
}

export async function updateGoal(id: number, input: UpdateGoalInput): Promise<Goal> {
  const { data } = await apiClient.patch<Goal>(`/goals/${id}`, input);
  return data;
}

export async function finishGoal(id: number, input: FinishGoalInput): Promise<Goal> {
  const { data } = await apiClient.post<Goal>(`/goals/${id}/finish`, input);
  return data;
}

export async function pauseGoal(id: number): Promise<Goal> {
  const { data } = await apiClient.post<Goal>(`/goals/${id}/pause`);
  return data;
}

export async function resumeGoal(id: number): Promise<Goal> {
  const { data } = await apiClient.post<Goal>(`/goals/${id}/resume`);
  return data;
}

export async function deleteGoal(id: number): Promise<void> {
  await apiClient.delete(`/goals/${id}`);
}
