import type {
  CreateAnnouncementInput,
  NotificationQueryInput,
  NotificationRow,
  NotificationSetting,
  Paginated,
  UpdateNotificationSettingInput,
  UserRole,
} from '@enghabit/shared';
import { apiClient } from '../../shared/lib/api-client';

/** Thông báo trong ứng dụng và cấu hình nhắc nhở. */

export async function listNotifications(
  query: Partial<NotificationQueryInput> = {},
): Promise<Paginated<NotificationRow>> {
  const { data } = await apiClient.get<Paginated<NotificationRow>>('/notifications', { params: query });
  return data;
}

export async function getUnreadCount(): Promise<number> {
  const { data } = await apiClient.get<{ count: number }>('/notifications/unread-count');
  return data.count;
}

export async function markRead(id: number): Promise<NotificationRow> {
  const { data } = await apiClient.patch<NotificationRow>(`/notifications/${id}/read`);
  return data;
}

export async function markAllRead(): Promise<{ updated: number }> {
  const { data } = await apiClient.post<{ updated: number }>('/notifications/read-all');
  return data;
}

export async function deleteNotification(id: number): Promise<void> {
  await apiClient.delete(`/notifications/${id}`);
}

export async function getSetting(): Promise<NotificationSetting> {
  const { data } = await apiClient.get<NotificationSetting>('/notifications/settings');
  return data;
}

export async function updateSetting(input: UpdateNotificationSettingInput): Promise<NotificationSetting> {
  const { data } = await apiClient.put<NotificationSetting>('/notifications/settings', input);
  return data;
}

// --- Dành cho quản trị viên ---

export async function countAudience(role?: UserRole): Promise<number> {
  const { data } = await apiClient.get<{ count: number }>('/admin/announcements/audience', {
    params: role ? { role } : {},
  });
  return data.count;
}

export async function sendAnnouncement(input: CreateAnnouncementInput): Promise<{ recipients: number }> {
  const { data } = await apiClient.post<{ recipients: number }>('/admin/announcements', input);
  return data;
}
