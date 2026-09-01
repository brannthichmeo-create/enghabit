import cron from 'node-cron';
import { jobLogger } from '../lib/logger.js';
import { prisma } from '../lib/prisma.js';
import * as rewardsService from '../modules/rewards/rewards.service.js';

/**
 * Cron tiêu vật phẩm giữ chuỗi cho những ngày người dùng nghỉ.
 *
 * Vì sao là job chứ không phải một nút bấm: vật phẩm chỉ có giá trị khi nó tự cứu
 * chuỗi. Bắt người dùng nhớ vào app bấm "dùng vật phẩm" thì đúng những hôm họ quên
 * học — cũng là hôm họ không mở app — vật phẩm sẽ vô dụng.
 *
 * Quét mỗi 30 phút chứ không phải mỗi ngày một lần: mỗi user một timezone, "hôm nay"
 * của họ bắt đầu vào những giờ khác nhau. Chạy lại nhiều lần vô hại vì ràng buộc
 * unique (user_id, used_on_date) chặn việc bù hai lần cho cùng một ngày.
 *
 * Điều kiện bù nằm ở `freezableDate` trong shared/streak: chỉ cứu khi bỏ lỡ ĐÚNG một
 * ngày. Nghỉ hai ngày liền thì chuỗi đã đứt, không cứu nữa.
 */

const CRON_EXPRESSION = '*/30 * * * *';

export function startStreakFreezeJob(): void {
  jobLogger.info({ schedule: CRON_EXPRESSION }, 'Khởi động job vật phẩm giữ chuỗi');
  cron.schedule(CRON_EXPRESSION, () => {
    void runStreakFreezeTick().catch((error: unknown) => {
      jobLogger.error({ err: error }, 'Job vật phẩm giữ chuỗi lỗi');
    });
  });
}

export interface StreakFreezeTickResult {
  /** Số chuỗi đã được cứu trong lượt quét này. */
  saved: number;
  /** Số user có vật phẩm trong kho đã được xét. */
  checked: number;
}

/** Tách riêng khỏi cron để test được và chạy tay khi cần debug. */
export async function runStreakFreezeTick(): Promise<StreakFreezeTickResult> {
  // Chỉ xét người còn vật phẩm chưa dùng — không có vật phẩm thì không có gì để làm,
  // quét toàn bộ user mỗi 30 phút là lãng phí.
  const owners = await prisma.streakFreeze.findMany({
    where: { usedOnDate: null },
    distinct: ['userId'],
    select: { user: { select: { id: true, timezone: true } } },
  });

  const result: StreakFreezeTickResult = { saved: 0, checked: owners.length };

  for (const { user } of owners) {
    const savedDate = await rewardsService.consumeFreezeIfNeeded(user.id, user.timezone);
    if (savedDate) {
      result.saved += 1;
      jobLogger.info({ userId: user.id, savedDate }, 'Đã dùng vật phẩm giữ chuỗi');
    }
  }

  jobLogger.debug(result, 'Kết thúc lượt quét vật phẩm giữ chuỗi');
  return result;
}
