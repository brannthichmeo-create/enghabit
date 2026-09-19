import { FeatureKey, KnownItemSlug } from '@enghabit/shared';
import { prisma } from '../../lib/prisma.js';
import { isEnabled } from '../feature-flags/feature.service.js';
import { imageUrlFor } from './shop.service.js';

/**
 * Khung viền ảnh đại diện đang dùng của NHIỀU người, bằng một truy vấn.
 *
 * Khác linh vật (chỉ chủ nhân thấy), khung viền là thứ NGƯỜI KHÁC nhìn thấy — đó là lý
 * do người ta bỏ xu ra mua. Nên nó phải đi kèm mọi chỗ hiện một người dùng khác: tác giả
 * bài đăng và bình luận (`community`, gồm cả bảng tin nhóm), bảng xếp hạng
 * (`leaderboard`) và danh sách thành viên nhóm (`groups`).
 *
 * Định nghĩa đúng MỘT lần ở đây để ba module đó không tự viết truy vấn riêng: tự viết
 * thì sẽ có chỗ quên lọc cờ tính năng, và cùng một người hiện khung ở bảng xếp hạng
 * nhưng không hiện ở bài đăng.
 *
 * Gọi MỘT lần cho cả trang, không gọi theo từng dòng — trang bình luận 50 người là
 * 1 truy vấn, không phải 50.
 */
export async function getEquippedFrameUrls(userIds: readonly number[]): Promise<Map<number, string>> {
  const ids = [...new Set(userIds)];
  if (ids.length === 0) return new Map();

  /*
    Tắt Cửa hàng thì KHÔNG hiện khung của ai cả, kể cả người đã mua.

    Tắt là đảo ngược được (xem CLAUDE.md > Quản lý tính năng): khung vẫn nằm trong
    `user_equipped_items`, bật lại là hiện lại đúng như cũ. Nhưng trong lúc tắt thì mọi
    màn hình phải nhất quán — chính người dùng không thấy khung của mình (FE không gọi
    `/shop/inventory` khi cờ tắt) mà người khác lại thấy thì rất khó giải thích.
  */
  if (!(await isEnabled(FeatureKey.SHOP))) return new Map();

  const rows = await prisma.userEquippedItem.findMany({
    where: {
      userId: { in: ids },
      type: { slug: KnownItemSlug.AVATAR_FRAME },
    },
    select: {
      userId: true,
      itemId: true,
      item: { select: { image: { select: { updatedAt: true } } } },
    },
  });

  const frames = new Map<number, string>();
  for (const row of rows) {
    // Khung chưa có ảnh (quản trị viên chưa tải) thì coi như khung mặc định, không vẽ
    // một ô vỡ quanh mặt người dùng.
    const url = imageUrlFor(row.itemId, row.item.image?.updatedAt);
    if (url) frames.set(row.userId, url);
  }

  return frames;
}
