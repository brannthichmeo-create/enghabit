import { env } from '../config/env.js';
import { jobLogger } from '../lib/logger.js';

/**
 * Client gửi push qua OneSignal. OneSignal chỉ là KÊNH GỬI —
 * quyết định gửi lúc nào là việc của reminder.job.ts (xem CLAUDE.md).
 */

export interface SendPushInput {
  playerIds: string[];
  title: string;
  message: string;
}

const ONESIGNAL_ENDPOINT = 'https://onesignal.com/api/v1/notifications';

export async function sendPush(input: SendPushInput): Promise<void> {
  // Chưa cấu hình OneSignal (vd môi trường dev) thì chỉ log, không làm job chết.
  if (!env.ONESIGNAL_APP_ID || !env.ONESIGNAL_API_KEY) {
    jobLogger.warn({ playerIds: input.playerIds.length }, 'Chưa cấu hình OneSignal — bỏ qua gửi push');
    return;
  }

  const response = await fetch(ONESIGNAL_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${env.ONESIGNAL_API_KEY}`,
    },
    body: JSON.stringify({
      app_id: env.ONESIGNAL_APP_ID,
      include_player_ids: input.playerIds,
      headings: { en: input.title },
      contents: { en: input.message },
    }),
  });

  if (!response.ok) {
    // Không ném lỗi ra ngoài: một user gửi lỗi không được làm dừng cả lượt quét.
    jobLogger.error(
      { status: response.status, body: await response.text().catch(() => '') },
      'Gửi push qua OneSignal thất bại',
    );
  }
}
