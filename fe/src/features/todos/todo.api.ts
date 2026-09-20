import type { CreateTodoInput, LocalDate, TodoDay, TodoRow, UpdateTodoInput } from '@enghabit/shared';
import { apiClient } from '../../shared/lib/api-client';

/**
 * Việc cần làm trong ngày.
 *
 * Kiểu dữ liệu (`TodoRow`, `TodoDay`) lấy thẳng từ `@enghabit/shared` chứ không khai lại
 * ở đây — backend trả đúng hai kiểu đó, khai hai lần là hai chỗ phải sửa khi đổi.
 */

export async function listTodos(date?: LocalDate): Promise<TodoDay> {
  const { data } = await apiClient.get<TodoDay>('/todos', { params: { date } });
  return data;
}

export async function createTodo(input: CreateTodoInput): Promise<TodoRow> {
  const { data } = await apiClient.post<TodoRow>('/todos', input);
  return data;
}

export async function updateTodo(id: number, input: UpdateTodoInput): Promise<TodoRow> {
  const { data } = await apiClient.patch<TodoRow>(`/todos/${id}`, input);
  return data;
}

export async function deleteTodo(id: number): Promise<void> {
  await apiClient.delete(`/todos/${id}`);
}

export async function clearDoneTodos(date?: LocalDate): Promise<{ deleted: number }> {
  const { data } = await apiClient.delete<{ deleted: number }>('/todos/done', { params: { date } });
  return data;
}
