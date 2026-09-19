/**
 * Cửa hàng vật phẩm: khoá chống trùng, giới hạn ảnh và bản đồ chỗ hiển thị.
 *
 * DOMAIN LOGIC dùng chung — be là nơi chấm chính thức, fe dùng để kiểm trước và
 * hiển thị. Định nghĩa một lần tại đây để hai phía không bao giờ lệch nhau về
 * "ảnh tối đa bao nhiêu" hay "khoá chống mua trùng trông như thế nào".
 *
 * Hai nguyên tắc của cả nhóm tính năng này (xem docs/ke-hoach-cua-hang-vat-pham.md):
 *
 * 1. **Mua hàng KHÔNG ghi ActivityLog.** Mua một con linh vật không giúp ai nhớ thêm
 *    từ vựng; ghi vào đó thì bấm nút mua là đủ giữ chuỗi ngày và mọi thống kê học tập
 *    sẽ nói dối. Cùng nguyên tắc với điểm danh (xem shared/rewards).
 * 2. **Trừ xu là GHI MỘT DÒNG ÂM vào sổ cái**, không phải giảm một cột số dư — số dư
 *    luôn là SUM(amount) như trước giờ.
 */

import { base64ByteLength } from '../encoding/base64.js';

/**
 * Khoá chống trùng của một lần mua vật phẩm.
 *
 * Mỗi vật phẩm mua ĐÚNG MỘT LẦN và sở hữu vĩnh viễn, nên khoá không cần phần ngày hay
 * phần ngẫu nhiên: ràng buộc `@@unique([userId, dedupeKey])` của bảng coin_transactions
 * vừa chặn bấm hai lần, vừa chặn sở hữu trùng. Đây là thứ DUY NHẤT đảm bảo hai request
 * về cùng lúc không trừ tiền hai lần — kiểm tra bằng câu lệnh đọc trước khi ghi vẫn lọt.
 *
 * Nếu sau này có vật phẩm tiêu hao (mua được nhiều lần) thì khoá của RIÊNG loại đó phải
 * thêm phần ngẫu nhiên, như cách rewards làm với vật phẩm giữ chuỗi. Đừng đổi khoá này.
 */
export function shopItemDedupeKey(itemId: number): string {
  return `SHOP_ITEM:${itemId}`;
}

/**
 * Giới hạn ảnh vật phẩm sau khi giải mã base64.
 *
 * Rộng hơn avatar (200KB) vì ảnh linh vật hiển thị to hơn và cần nét ở màn hình retina,
 * nhưng vẫn đủ nhỏ để nằm gọn trong MEDIUMBLOB và tải nhanh. Ảnh KHÔNG đi kèm trong
 * danh sách cửa hàng — nó có endpoint riêng có cache, xem be/src/modules/shop.
 */
export const SHOP_IMAGE_MAX_BYTES = 300_000;

/**
 * Định dạng ảnh vật phẩm chấp nhận.
 *
 * Không nhận SVG, cùng lý do với avatar: SVG là tài liệu chạy được script, cho tải lên
 * rồi hiển thị lại cho mọi người là mở đường cho XSS.
 */
export const ALLOWED_SHOP_IMAGE_MIME = ['image/png', 'image/webp', 'image/jpeg'] as const;
export type ShopImageMimeType = (typeof ALLOWED_SHOP_IMAGE_MIME)[number];

export type ParsedShopImage =
  | { ok: true; mimeType: ShopImageMimeType; base64: string; byteLength: number }
  | { ok: false; reason: string };

const DATA_URL_PATTERN = /^data:([a-z]+\/[a-z0-9.+-]+);base64,([A-Za-z0-9+/]+={0,2})$/;

/**
 * Tách và kiểm tra data URL ảnh vật phẩm.
 *
 * Trả lý do bằng tiếng Việt để hiện thẳng cho quản trị viên thay vì ném lỗi — chọn nhầm
 * file là chuyện bình thường, không phải sự cố hệ thống.
 */
export function parseShopImageDataUrl(dataUrl: string): ParsedShopImage {
  const match = DATA_URL_PATTERN.exec(dataUrl.trim());
  if (!match) return { ok: false, reason: 'Ảnh không đúng định dạng' };

  const [, mimeType, base64] = match as unknown as [string, string, string];

  if (!ALLOWED_SHOP_IMAGE_MIME.includes(mimeType as ShopImageMimeType)) {
    return { ok: false, reason: 'Chỉ nhận ảnh PNG, WebP hoặc JPG' };
  }

  const byteLength = base64ByteLength(base64);
  if (byteLength === 0) return { ok: false, reason: 'Ảnh rỗng' };
  if (byteLength > SHOP_IMAGE_MAX_BYTES) {
    return {
      ok: false,
      reason: `Ảnh quá lớn (tối đa ${Math.round(SHOP_IMAGE_MAX_BYTES / 1000)}KB)`,
    };
  }

  return { ok: true, mimeType: mimeType as ShopImageMimeType, base64, byteLength };
}

/**
 * Mã loại vật phẩm mà giao diện BIẾT cách gắn vào một chỗ cụ thể.
 *
 * Danh sách LOẠI nằm dưới DB (bảng shop_item_types) vì quản trị viên tự thêm loại mới —
 * khác hẳn danh mục tính năng, vốn nằm trong mã nguồn vì thêm tính năng là thêm code.
 *
 * Hằng số dưới đây chỉ là "những slug mà FE đã có code hiển thị". Loại mang slug lạ vẫn
 * mua được, vẫn nằm trong kho, vẫn chọn dùng được — chỉ là chưa gắn vào đâu trong giao
 * diện cho tới khi có code cho nó. Loại lạ KHÔNG được làm vỡ màn hình, cùng tinh thần
 * với "dòng feature_flags mang khoá lạ thì bỏ qua khi đọc".
 */
export const KnownItemSlug = {
  /** Linh vật hiển thị ở trang Tổng quan và trang cá nhân. */
  MASCOT: 'MASCOT',
  /**
   * Khung viền quanh ảnh đại diện. KHÁC linh vật ở chỗ NGƯỜI KHÁC cũng thấy: nó đi kèm
   * tác giả bài đăng, bình luận, bảng xếp hạng và danh sách thành viên nhóm.
   */
  AVATAR_FRAME: 'AVATAR_FRAME',
} as const;
export type KnownItemSlug = (typeof KnownItemSlug)[keyof typeof KnownItemSlug];

/**
 * Ảnh khung viền to hơn ảnh đại diện bao nhiêu lần.
 *
 * Khung là một ảnh PNG VUÔNG, tâm trong suốt, phủ lên avatar. Avatar chiếm đúng vòng tròn
 * ở giữa có đường kính = cạnh ảnh / AVATAR_FRAME_SCALE; phần dư ra là chỗ để vẽ viền.
 *
 * Dùng chung vì hai phía phải khớp tuyệt đối: backend VẼ ảnh khung theo tỉ lệ này
 * (`shop.frame-image.ts`), frontend PHÓNG ảnh phủ theo đúng tỉ lệ này (`Avatar`). Lệch
 * nhau vài phần trăm là viền đè lên mặt người dùng hoặc hở một khe giữa viền và ảnh.
 *
 * Quản trị viên tự tải khung lên thì phải vẽ theo cùng tỉ lệ — màn /admin/shop có ghi.
 */
export const AVATAR_FRAME_SCALE = 1.3;

/** Slug này đã có chỗ hiển thị trong giao diện chưa. */
export function isKnownItemSlug(slug: string): slug is KnownItemSlug {
  return Object.values(KnownItemSlug).includes(slug as KnownItemSlug);
}

/** Độ dài tối đa của các trường người quản trị nhập — dùng lại trong Zod schema. */
export const SHOP_LIMITS = {
  typeSlug: 30,
  typeLabel: 60,
  typeDescription: 255,
  itemName: 100,
  itemDescription: 500,
  /** Trần giá. Đủ rộng cho mọi bậc giá hợp lý, chặn gõ nhầm thừa số 0. */
  itemPrice: 1_000_000,
} as const;

/**
 * Slug hợp lệ: CHỮ HOA, số và gạch dưới.
 *
 * Ràng buộc chặt vì slug là thứ FE dùng để tra bản đồ hiển thị — cho phép khoảng trắng
 * hay chữ thường thì hai loại chỉ khác nhau cái dấu cách sẽ thành hai loại khác nhau,
 * và không ai nhìn ra vì sao con linh vật không hiện.
 */
export const ITEM_SLUG_PATTERN = /^[A-Z][A-Z0-9_]*$/;
