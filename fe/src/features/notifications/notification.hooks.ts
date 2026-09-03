import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';
import type {
  CreateAnnouncementInput,
  NotificationQueryInput,
  NotificationRow,
  NotificationSetting,
  Paginated,
  CreateReminderInput,
  Reminder,
  UpdateNotificationSettingInput,
  UpdateReminderInput,
  UserRole,
} from '@enghabit/shared';
import * as notificationApi from './notification.api';

export const notificationKeys = {
  all: ['notifications'] as const,
  list: (query: Partial<NotificationQueryInput>) => ['notifications', 'list', query] as const,
  unreadCount: () => ['notifications', 'unread-count'] as const,
  settings: () => ['notifications', 'settings'] as const,
  reminders: () => ['notifications', 'reminders'] as const,
  audience: (role?: UserRole) => ['notifications', 'audience', role ?? 'all'] as const,
};

/**
 * Số thông báo chưa đọc, hiện trên chuông.
 *
 * Hỏi lại mỗi phút vì thông báo do cron ở server sinh ra — client không có cách nào
 * biết là có cái mới nếu không hỏi. Một phút là đủ nhanh cho nhắc nhở học tập, và
 * rẻ hơn nhiều so với mở kết nối realtime chỉ để đếm một con số.
 */
const UNREAD_REFETCH_MS = 60_000;

export function useUnreadCount(enabled = true): UseQueryResult<number> {
  return useQuery({
    queryKey: notificationKeys.unreadCount(),
    queryFn: notificationApi.getUnreadCount,
    refetchInterval: UNREAD_REFETCH_MS,
    enabled,
  });
}

export function useNotifications(
  query: Partial<NotificationQueryInput>,
): UseQueryResult<Paginated<NotificationRow>> {
  return useQuery({
    queryKey: notificationKeys.list(query),
    queryFn: () => notificationApi.listNotifications(query),
    placeholderData: (previous) => previous,
  });
}

export function useMarkRead(): UseMutationResult<NotificationRow, Error, number> {
  return useNotificationMutation(notificationApi.markRead);
}

export function useMarkAllRead(): UseMutationResult<{ updated: number }, Error, void> {
  return useNotificationMutation(notificationApi.markAllRead);
}

export function useDeleteNotification(): UseMutationResult<void, Error, number> {
  return useNotificationMutation(notificationApi.deleteNotification);
}

export function useNotificationSetting(): UseQueryResult<NotificationSetting> {
  return useQuery({ queryKey: notificationKeys.settings(), queryFn: notificationApi.getSetting });
}

export function useUpdateNotificationSetting(): UseMutationResult<
  NotificationSetting,
  Error,
  UpdateNotificationSettingInput
> {
  return useNotificationMutation(notificationApi.updateSetting);
}

// --- Các mốc nhắc nhở ---

export function useReminders(): UseQueryResult<Reminder[]> {
  return useQuery({ queryKey: notificationKeys.reminders(), queryFn: notificationApi.listReminders });
}

export function useCreateReminder(): UseMutationResult<Reminder, Error, CreateReminderInput> {
  return useNotificationMutation(notificationApi.createReminder);
}

export function useUpdateReminder(): UseMutationResult<
  Reminder,
  Error,
  { id: number; input: UpdateReminderInput }
> {
  return useNotificationMutation(notificationApi.updateReminder);
}

export function useDeleteReminder(): UseMutationResult<void, Error, number> {
  return useNotificationMutation(notificationApi.deleteReminder);
}

// --- Dành cho quản trị viên ---

export function useAudienceCount(role?: UserRole): UseQueryResult<number> {
  return useQuery({
    queryKey: notificationKeys.audience(role),
    queryFn: () => notificationApi.countAudience(role),
  });
}

export function useSendAnnouncement(): UseMutationResult<
  { recipients: number },
  Error,
  CreateAnnouncementInput
> {
  return useNotificationMutation(notificationApi.sendAnnouncement);
}

/** Mọi thao tác đều làm lệch cả danh sách lẫn số chưa đọc nên invalidate chung một gốc. */
function useNotificationMutation<TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>,
): UseMutationResult<TData, Error, TVariables> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: notificationKeys.all }),
  });
}
