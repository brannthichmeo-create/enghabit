import {
  AdminAction,
  FEATURES,
  FeatureKey,
  allFeaturesEnabled,
  dependentsOf,
  findFeature,
  type AdminFeatureRow,
  type FeatureFlagMap,
  type UpdateFeatureFlagResult,
} from '@enghabit/shared';
import { prisma } from '../../lib/prisma.js';
import { BadRequestError } from '../../common/errors/app-error.js';
import { recordAdminAction } from '../admin/admin-audit.service.js';

/**
 * Trạng thái bật/tắt tính năng.
 *
 * Danh mục nằm ở shared/constants/features.ts; bảng feature_flags chỉ giữ trạng thái,
 * và THIẾU DÒNG NGHĨA LÀ BẬT (xem chú thích model FeatureFlag trong schema.prisma).
 */

/**
 * Cache trong bộ nhớ tiến trình.
 *
 * Guard chạy trên mọi request của các nhánh bị khoá; đọc DB mỗi lần là thêm một truy
 * vấn cho mỗi request, trong khi dữ liệu này đổi vài tháng một lần. Đổi bằng PATCH thì
 * cache của tiến trình đang chạy bị xoá ngay, nên độ trễ TTL chỉ áp cho tiến trình
 * KHÁC (khi chạy nhiều instance). Màn hình quản trị ghi rõ "hiệu lực trong 30 giây" —
 * không nói thì quản trị viên bấm tắt, thử ngay, thấy vẫn vào được rồi bấm lại vài lần.
 */
const CACHE_TTL_MS = 30_000;
let cache: { flags: FeatureFlagMap; expiresAt: number } | null = null;

/** Xoá cache của tiến trình này. Gọi sau mỗi lần ghi. */
export function invalidateCache(): void {
  cache = null;
}

/** Đọc thẳng từ DB, không qua cache. */
async function readFlags(): Promise<FeatureFlagMap> {
  const rows = await prisma.featureFlag.findMany({ select: { key: true, isEnabled: true } });

  const flags = allFeaturesEnabled();
  for (const row of rows) {
    // Khoá lạ (còn sót từ bản cũ) bị bỏ qua chứ không ném lỗi — dọn lúc nào cũng được.
    if (findFeature(row.key)) flags[row.key as FeatureKey] = row.isEnabled;
  }
  return flags;
}

/** Trạng thái mọi tính năng. Dùng cache. */
export async function getFlags(): Promise<FeatureFlagMap> {
  if (cache && cache.expiresAt > Date.now()) return cache.flags;

  const flags = await readFlags();
  cache = { flags, expiresAt: Date.now() + CACHE_TTL_MS };
  return flags;
}

/** Một tính năng có đang bật không. */
export async function isEnabled(key: FeatureKey): Promise<boolean> {
  return (await getFlags())[key];
}

/** Số ngày nhìn lại khi đếm người dùng gần đây của một tính năng. */
const RECENT_DAYS = 7;

/**
 * Danh sách đầy đủ cho màn hình quản trị.
 *
 * `blockedBy` và `recentUsers` tính ở đây để FE không phải lặp lại luật phụ thuộc lần
 * thứ hai, và để hộp xác nhận tắt nói được "bao nhiêu người đang dùng".
 */
export async function listForAdmin(): Promise<AdminFeatureRow[]> {
  const [rows, flags, recent] = await Promise.all([
    prisma.featureFlag.findMany({
      select: { key: true, updatedAt: true, updatedBy: { select: { name: true } } },
    }),
    getFlags(),
    countRecentUsers(),
  ]);

  const byKey = new Map(rows.map((row) => [row.key, row]));

  return FEATURES.map((feature) => {
    const row = byKey.get(feature.key);
    return {
      key: feature.key,
      isEnabled: flags[feature.key],
      updatedByName: row?.updatedBy?.name ?? null,
      // Chưa ai đụng tới thì `updatedAt` của dòng seed không nói lên điều gì —
      // trả null để giao diện im lặng thay vì hiện một mốc thời gian vô nghĩa.
      updatedAt: row?.updatedBy ? row.updatedAt.toISOString() : null,
      blockedBy: (feature.dependsOn ?? []).filter((dep) => !flags[dep]),
      recentUsers: recent[feature.key] ?? 0,
    };
  });
}

/**
 * Số người học có hoạt động thuộc mỗi tính năng trong RECENT_DAYS ngày qua.
 *
 * Đếm từ ActivityLog — nguồn sự thật duy nhất cho hoạt động học. Tính năng không sinh
 * ActivityLog (Báo cáo, Bảng xếp hạng, Cộng đồng, Nhóm lớp, Phần thưởng) trả 0: con số
 * này chỉ để cảnh báo "tắt cái này là cắt ngang việc học của N người", nên thà không
 * có số còn hơn có một số đếm nhầm thứ khác.
 */
async function countRecentUsers(): Promise<Partial<Record<FeatureKey, number>>> {
  const since = new Date(Date.now() - RECENT_DAYS * 24 * 60 * 60 * 1000);

  const rows = await prisma.activityLog.groupBy({
    by: ['type', 'userId'],
    where: { occurredAt: { gte: since } },
    _count: { _all: true },
  });

  const byType = new Map<string, Set<number>>();
  for (const row of rows) {
    const set = byType.get(row.type) ?? new Set<number>();
    set.add(row.userId);
    byType.set(row.type, set);
  }

  return {
    [FeatureKey.VOCABULARY]: byType.get('VOCAB_LEARNED')?.size ?? 0,
    // Mỗi phiên Học kết thúc ghi một dòng QUIZ_COMPLETED — đếm người có phiên Học.
    [FeatureKey.LEARN]: byType.get('QUIZ_COMPLETED')?.size ?? 0,
    [FeatureKey.FLASHCARDS]: byType.get('FLASHCARD_REVIEWED')?.size ?? 0,
    [FeatureKey.HABITS]: byType.get('HABIT_CHECKIN')?.size ?? 0,
  };
}

/**
 * Bật hoặc tắt một tính năng.
 *
 * Tắt thì tắt lây các tính năng phụ thuộc, trong CÙNG một transaction: tắt Từ vựng mà
 * để Ôn tập bật là người học mở Ôn tập ra và thấy màn hình rỗng vĩnh viễn, không có từ
 * nào để ôn.
 *
 * Bật thì KHÔNG bật lây theo chiều ngược lại — bật thêm thứ quản trị viên không yêu cầu
 * là làm thay họ. Thiếu điều kiện thì báo lỗi kèm tên tính năng cần bật trước.
 */
export async function setEnabled(
  key: FeatureKey,
  isEnabled: boolean,
  adminId: number,
): Promise<UpdateFeatureFlagResult> {
  const flags = await getFlags();

  if (isEnabled) {
    const blockedBy = (findFeature(key)?.dependsOn ?? []).filter((dep) => !flags[dep]);
    if (blockedBy.length > 0) {
      const names = blockedBy.map((dep) => findFeature(dep)?.label ?? dep).join(', ');
      throw new BadRequestError(`Phải bật ${names} trước khi bật tính năng này`);
    }
  }

  // Tắt: gom cả cây phụ thuộc. Đệ quy nên chuỗi dài hơn hai bậc vẫn đúng.
  const alsoDisabled = isEnabled ? [] : collectDependents(key);
  const keys = [key, ...alsoDisabled];

  await prisma.$transaction(async (tx) => {
    for (const k of keys) {
      await tx.featureFlag.upsert({
        where: { key: k },
        create: { key: k, isEnabled, updatedById: adminId },
        update: { isEnabled, updatedById: adminId },
      });
    }

    // Bấm vào công tắc đang ở đúng trạng thái đó thì không có gì đổi để ghi.
    if (flags[key] !== isEnabled) {
      await recordAdminAction(
        {
          actorId: adminId,
          action: isEnabled ? AdminAction.FEATURE_ENABLED : AdminAction.FEATURE_DISABLED,
          targetId: key,
          targetLabel: findFeature(key)?.label ?? key,
          changes: {
            isEnabled: { from: flags[key], to: isEnabled },
            // Tắt một tính năng là tắt kèm cả cây phụ thuộc — ghi rõ, không thì nhìn nhật
            // ký sẽ không hiểu vì sao những tính năng kia cũng tắt theo.
            ...(alsoDisabled.length > 0
              ? {
                  alsoDisabled: {
                    from: null,
                    to: alsoDisabled.map((dep) => findFeature(dep)?.label ?? dep).join(', '),
                  },
                }
              : {}),
          },
        },
        tx,
      );
    }
  });

  invalidateCache();
  return { flags: await getFlags(), alsoDisabled };
}

/** Mọi tính năng phụ thuộc vào `key`, trực tiếp lẫn gián tiếp. */
function collectInto(key: FeatureKey, seen: Set<FeatureKey>): void {
  for (const dep of dependentsOf(key)) {
    if (seen.has(dep)) continue;
    seen.add(dep);
    collectInto(dep, seen);
  }
}

function collectDependents(key: FeatureKey): FeatureKey[] {
  const seen = new Set<FeatureKey>();
  collectInto(key, seen);
  return [...seen];
}
