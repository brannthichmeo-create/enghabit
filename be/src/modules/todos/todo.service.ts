import {
  MAX_OVERDUE_TODOS,
  MAX_TODOS_PER_DAY,
  todayLocalDate,
  type CreateTodoInput,
  type LocalDate,
  type TodoDay,
  type TodoRow,
  type UpdateTodoInput,
} from '@enghabit/shared';
import type { Todo } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { BadRequestError, NotFoundError } from '../../common/errors/app-error.js';
import { fromDbDate, toDbDate } from '../../common/utils/db-date.js';

/**
 * Việc cần làm trong ngày.
 *
 * KHÔNG GHI `ActivityLog` Ở BẤT KỲ ĐÂU TRONG FILE NÀY — cùng luật với module `rewards`.
 * Tạo hay đánh dấu xong một việc không phải hoạt động học: gõ "abc" rồi bấm tích là
 * chuỗi ngày vẫn còn và XP vẫn lên, trong khi người dùng không học chữ nào. Việc lặp
 * lại có lịch và CÓ tính vào chuỗi ngày là module `habits`, đã tồn tại.
 *
 * Mọi truy vấn lọc theo `userId` ngay trong câu lệnh: việc cần làm là ghi chú riêng tư,
 * không ai đọc của ai. Không có bất kỳ endpoint nào đọc việc của người khác.
 */

/** Todo dưới DB → dạng trả cho client (ngày là chuỗi `YYYY-MM-DD`, không phải Date). */
function toRow(todo: Todo): TodoRow {
  return {
    id: todo.id,
    title: todo.title,
    date: fromDbDate(todo.localDate),
    isDone: todo.isDone,
    doneAt: todo.doneAt?.toISOString() ?? null,
    createdAt: todo.createdAt.toISOString(),
  };
}

/**
 * Danh sách của một ngày, kèm việc còn nợ từ các ngày trước.
 *
 * Thứ tự là `createdAt` tăng dần, KHÔNG đẩy việc đã xong xuống cuối: danh sách nhảy chỗ
 * ngay lúc vừa bấm tích khiến người dùng mất dấu mình đang ở đâu, và bấm nhầm dòng kế
 * tiếp. Việc đã xong chỉ đổi cách hiển thị.
 */
export async function listTodos(
  userId: number,
  timezone: string,
  date?: LocalDate,
): Promise<TodoDay> {
  const today = todayLocalDate(timezone);
  const target = date ?? today;

  const items = await prisma.todo.findMany({
    where: { userId, localDate: toDbDate(target) },
    orderBy: { createdAt: 'asc' },
  });

  /*
    Chỉ tính việc quá hạn khi đang xem HÔM NAY. Lật về một ngày trong quá khứ thì "quá
    hạn so với ngày đó" là một khái niệm không ai cần — người dùng mở ngày cũ để xem lại
    mình đã làm gì, không phải để dọn nợ.
  */
  const overdue = target === today
    ? await prisma.todo.findMany({
        where: { userId, isDone: false, localDate: { lt: toDbDate(today) } },
        orderBy: { localDate: 'desc' },
        take: MAX_OVERDUE_TODOS,
      })
    : [];

  return { date: target, items: items.map(toRow), overdue: overdue.map(toRow) };
}

export async function createTodo(
  userId: number,
  timezone: string,
  input: CreateTodoInput,
): Promise<TodoRow> {
  const date = input.date ?? todayLocalDate(timezone);

  const count = await prisma.todo.count({ where: { userId, localDate: toDbDate(date) } });
  if (count >= MAX_TODOS_PER_DAY) {
    throw new BadRequestError(`Mỗi ngày chỉ ghi được tối đa ${MAX_TODOS_PER_DAY} việc`);
  }

  const todo = await prisma.todo.create({
    data: { userId, title: input.title, localDate: toDbDate(date) },
  });
  return toRow(todo);
}

/**
 * Sửa tên, đánh dấu xong/chưa xong, hoặc dời việc sang ngày khác.
 *
 * `doneAt` do BACKEND đặt, không nhận từ client: nó là mốc thời gian thật, để client gửi
 * lên thì đồng hồ máy người dùng sai là dữ liệu sai theo.
 */
export async function updateTodo(
  userId: number,
  todoId: number,
  input: UpdateTodoInput,
): Promise<TodoRow> {
  const current = await assertOwnership(userId, todoId);

  // Bấm tích hai lần liên tiếp (mạng chậm, người dùng bấm lại) không được làm mới
  // `doneAt`: giữ nguyên mốc của lần đánh dấu đầu tiên.
  const doneAt =
    input.isDone === undefined || input.isDone === current.isDone
      ? undefined
      : input.isDone
        ? new Date()
        : null;

  const todo = await prisma.todo.update({
    where: { id: todoId },
    data: {
      title: input.title,
      isDone: input.isDone,
      doneAt,
      localDate: input.date ? toDbDate(input.date) : undefined,
    },
  });
  return toRow(todo);
}

export async function deleteTodo(userId: number, todoId: number): Promise<void> {
  await assertOwnership(userId, todoId);
  await prisma.todo.delete({ where: { id: todoId } });
}

/**
 * Xoá mọi việc ĐÃ XONG của một ngày.
 *
 * Có riêng endpoint này vì dọn tay từng dòng là việc lặp lại nhàm nhất của một danh sách
 * việc cần làm — bấm xoá mười lần cho mười dòng đã xong.
 */
export async function clearDoneTodos(
  userId: number,
  timezone: string,
  date?: LocalDate,
): Promise<{ deleted: number }> {
  const target = date ?? todayLocalDate(timezone);
  const result = await prisma.todo.deleteMany({
    where: { userId, isDone: true, localDate: toDbDate(target) },
  });
  return { deleted: result.count };
}

/** Việc không phải của mình trả 404, không trả 403 — không xác nhận là nó có tồn tại. */
async function assertOwnership(userId: number, todoId: number): Promise<Todo> {
  const todo = await prisma.todo.findFirst({ where: { id: todoId, userId } });
  if (!todo) throw new NotFoundError('Không tìm thấy việc cần làm');
  return todo;
}
