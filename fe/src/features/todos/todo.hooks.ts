import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';
import {
  todayLocalDate,
  type CreateTodoInput,
  type LocalDate,
  type TodoDay,
  type TodoRow,
  type UpdateTodoInput,
} from '@enghabit/shared';
import { useCurrentUser } from '../auth/auth.store';
import * as todoApi from './todo.api';

/**
 * Một khoá cache cho MỖI NGÀY, và mọi nơi hiện việc cần làm đều dùng đúng khoá đó.
 *
 * Đây là thứ giữ cho bảng trên thanh trên cùng và trang `/todos` luôn khớp nhau: hai
 * component không giữ state riêng, chúng đọc cùng một ô cache của TanStack Query. Bấm
 * tích ở bảng thả xuống là trang đổi theo ngay cả khi trang đang mở phía sau.
 */
export const todoKeys = {
  all: ['todos'] as const,
  day: (date: LocalDate) => ['todos', 'day', date] as const,
};

/**
 * Hôm nay theo timezone của user.
 *
 * Tính lúc render nên app mở xuyên qua nửa đêm vẫn giữ ngày cũ cho tới lần render kế
 * tiếp. Chấp nhận được: mọi thao tác đều gọi API, mà backend tự tính lại ngày theo
 * timezone của user nên dữ liệu ghi xuống không bao giờ sai ngày.
 */
export function useTodayLocalDate(): LocalDate {
  const user = useCurrentUser();
  return todayLocalDate(user?.timezone ?? 'Asia/Ho_Chi_Minh');
}

export function useTodos(date: LocalDate, enabled = true): UseQueryResult<TodoDay> {
  return useQuery({
    queryKey: todoKeys.day(date),
    queryFn: () => todoApi.listTodos(date),
    enabled,
  });
}

/** Số việc CÒN LẠI hôm nay (chưa xong + quá hạn) — con số trên huy hiệu. */
export function remainingCount(day: TodoDay | undefined): number {
  if (!day) return 0;
  return day.items.filter((item) => !item.isDone).length + day.overdue.length;
}

export function useCreateTodo(): UseMutationResult<TodoRow, Error, CreateTodoInput> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: todoApi.createTodo,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: todoKeys.all }),
  });
}

/**
 * Sửa một việc — đổi tên, bấm tích, hoặc dời sang ngày khác.
 *
 * Bấm tích được cập nhật LẠC QUAN: đây là thao tác người dùng lặp nhiều nhất và họ bấm
 * liên tiếp vài dòng một lúc, chờ mạng trả lời mới đánh dấu thì ô tích nhấp nháy theo
 * độ trễ và dễ bấm trượt sang dòng đã đổi chỗ.
 *
 * Vá vào MỌI ngày đang có trong cache chứ không riêng ngày đang xem: một việc quá hạn
 * nằm đồng thời ở khối `overdue` của hôm nay và ở `items` của ngày nó thuộc về.
 */
export function useUpdateTodo(): UseMutationResult<
  TodoRow,
  Error,
  { id: number; input: UpdateTodoInput },
  { previous: [readonly unknown[], TodoDay][] }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }) => todoApi.updateTodo(id, input),

    onMutate: async ({ id, input }) => {
      await queryClient.cancelQueries({ queryKey: todoKeys.all });
      const previous = queryClient.getQueriesData<TodoDay>({ queryKey: todoKeys.all });

      queryClient.setQueriesData<TodoDay>({ queryKey: todoKeys.all }, (day) =>
        day ? patchDay(day, id, input) : day,
      );

      return { previous: previous.filter((entry): entry is [readonly unknown[], TodoDay] => Boolean(entry[1])) };
    },

    // Hỏng thì trả cache về đúng như trước khi bấm. Không có bước này, ô tích giữ
    // nguyên trạng thái mới trong khi server vẫn lưu trạng thái cũ.
    onError: (_error, _variables, context) => {
      context?.previous.forEach(([key, day]) => queryClient.setQueryData(key, day));
    },

    // Chạy cả khi thành công lẫn thất bại: chốt lại bằng số liệu thật của server.
    onSettled: () => void queryClient.invalidateQueries({ queryKey: todoKeys.all }),
  });
}

export function useDeleteTodo(): UseMutationResult<void, Error, number> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: todoApi.deleteTodo,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: todoKeys.all }),
  });
}

export function useClearDoneTodos(): UseMutationResult<{ deleted: number }, Error, LocalDate> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (date: LocalDate) => todoApi.clearDoneTodos(date),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: todoKeys.all }),
  });
}

/** Áp thay đổi lạc quan lên một ngày đã nằm trong cache. */
function patchDay(day: TodoDay, id: number, input: UpdateTodoInput): TodoDay {
  const patch = (item: TodoRow): TodoRow =>
    item.id === id
      ? {
          ...item,
          ...(input.title !== undefined && { title: input.title }),
          ...(input.date !== undefined && { date: input.date }),
          ...(input.isDone !== undefined && {
            isDone: input.isDone,
            // Mốc tạm để dòng hiện đúng ngay; `onSettled` thay bằng mốc thật của server.
            doneAt: input.isDone ? new Date().toISOString() : null,
          }),
        }
      : item;

  return {
    ...day,
    items: day.items.map(patch),
    // Việc quá hạn vừa đánh dấu xong thì bỏ khỏi khối quá hạn luôn — để lại một dòng đã
    // gạch ngang trong mục "còn nợ" là tự mâu thuẫn.
    overdue: day.overdue.map(patch).filter((item) => !item.isDone),
  };
}
