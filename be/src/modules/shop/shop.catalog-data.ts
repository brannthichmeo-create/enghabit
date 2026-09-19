import { KnownItemSlug } from '@enghabit/shared';
import type { FrameSpec } from './shop.frame-image.js';

/**
 * Danh mục cửa hàng mặc định: một loại "Linh vật" và 20 vật phẩm.
 *
 * Nằm trong `src/` chứ không phải `prisma/seed-data/` vì đây là dữ liệu của ỨNG DỤNG,
 * không phải dữ liệu mẫu: `startCommand` của Render nạp nó vào production mỗi lần khởi
 * động (xem shop.catalog.ts), nên nó phải được biên dịch vào `dist`. Để ở `prisma/` thì
 * production chỉ chạy được nó qua `tsx` — một devDependency, và cả server sẽ không khởi
 * động nổi ở bất kỳ môi trường nào cài đặt bằng `--prod`.
 *
 * Ảnh KHÔNG lấy từ nguồn trên mạng. Mỗi linh vật là một hình PNG nền trong suốt do
 * chính seed vẽ ra từ `body` và `accent` (xem `makeMascotPng` trong seed.ts). Hai lý do:
 *
 *  - **Bản quyền.** Đồ án có thể công bố, mà ảnh tải từ một trang bất kỳ thì không rõ
 *    giấy phép. Hình tự sinh thì chắc chắn dùng được.
 *  - **Không có tệp nhị phân trong repo.** Nhìn mảng màu là biết linh vật trông thế nào,
 *    còn 20 tệp PNG nằm trong git thì không ai xem được trong lúc đọc diff.
 *
 * Muốn dùng ảnh thật thì không phải sửa gì ở đây: quản trị viên tải ảnh lên ở
 * /admin/shop và ảnh đó ghi đè hình tự sinh.
 *
 * Ba bậc giá theo `docs/ke-hoach-cua-hang-vat-pham.md` (thu tối đa 110 xu/ngày):
 *   300 xu  ≈ 3 ngày   — mua được sớm, để cửa hàng dùng được ngay
 *   800 xu  ≈ 7 ngày   — mục tiêu một tuần
 *   2000 xu ≈ 18 ngày  — mục tiêu dài cho người học đều
 *
 * Cộng thêm MỘT linh vật giá 0 xu. Người mới có 0 xu nên nếu món rẻ nhất cũng là 300 thì
 * ngày đầu cửa hàng chỉ là một quầy hàng để ngắm, và kho vật phẩm rỗng trơn — món miễn
 * phí cho họ đi trọn một vòng mua, chọn dùng, thấy linh vật hiện ở trang Tổng quan.
 */

export interface MascotSeed {
  name: string;
  description: string;
  price: number;
  /** Màu thân, dạng RGB. */
  body: readonly [number, number, number];
  /** Màu điểm nhấn (má, tai). */
  accent: readonly [number, number, number];
}

export const MASCOT_TYPE = {
  slug: KnownItemSlug.MASCOT,
  label: 'Linh vật',
  description: 'Bạn đồng hành nhỏ hiện ở trang Tổng quan và trang cá nhân của bạn.',
} as const;

export const MASCOTS: readonly MascotSeed[] = [
  // --- Tặng người mới ---
  { name: 'Cú Xanh', description: 'Chú cú chăm chỉ, thức khuya học cùng bạn. Quà cho người mới.', price: 0, body: [96, 144, 207], accent: [231, 239, 250] },

  // --- 300 xu ---
  { name: 'Mèo Cam', description: 'Ngủ nhiều nhưng nhớ từ vựng rất nhanh.', price: 300, body: [230, 145, 68], accent: [255, 226, 190] },
  { name: 'Gấu Trúc', description: 'Ăn tre, đọc sách, không bao giờ bỏ buổi ôn.', price: 300, body: [70, 78, 92], accent: [240, 242, 246] },
  { name: 'Thỏ Tuyết', description: 'Nhảy một bước mỗi ngày, chuỗi dài dần.', price: 300, body: [222, 228, 238], accent: [246, 182, 196] },
  { name: 'Ếch Học Bài', description: 'Kêu to mỗi lần bạn trả lời đúng.', price: 300, body: [104, 176, 122], accent: [226, 244, 230] },
  { name: 'Vịt Vàng', description: 'Bơi qua mọi bài kiểm tra mà không chìm.', price: 300, body: [237, 199, 74], accent: [255, 240, 190] },
  { name: 'Cá Vàng', description: 'Nhớ được nhiều hơn ba giây, hứa đấy.', price: 300, body: [236, 140, 96], accent: [255, 231, 214] },
  { name: 'Ong Siêng', description: 'Mỗi ngày một chút, mật đầy tổ.', price: 300, body: [232, 184, 64], accent: [62, 62, 70] },

  // --- 800 xu ---
  { name: 'Cáo Lửa', description: 'Nhanh nhẹn với những từ khó nhớ nhất.', price: 800, body: [216, 114, 62], accent: [255, 236, 214] },
  { name: 'Chim Cánh Cụt', description: 'Đi chậm nhưng chưa từng bỏ ngày nào.', price: 800, body: [58, 70, 92], accent: [240, 196, 92] },
  { name: 'Sói Đêm', description: 'Bạn đồng hành của những buổi học muộn.', price: 800, body: [96, 104, 126], accent: [198, 214, 240] },
  { name: 'Rùa Thông Thái', description: 'Chậm mà chắc — đúng tinh thần ôn tập ngắt quãng.', price: 800, body: [110, 152, 118], accent: [226, 208, 152] },
  { name: 'Voi Nhớ Dai', description: 'Không quên một từ nào bạn đã học.', price: 800, body: [140, 150, 170], accent: [246, 196, 208] },
  { name: 'Hổ Con', description: 'Gầm lên khi bạn hoàn thành cả ba nhiệm vụ.', price: 800, body: [226, 152, 66], accent: [62, 62, 70] },
  { name: 'Khỉ Tinh Nghịch', description: 'Leo lên bảng xếp hạng nhanh hơn bạn tưởng.', price: 800, body: [172, 132, 96], accent: [255, 226, 196] },

  // --- 2000 xu ---
  { name: 'Rồng Nhỏ', description: 'Chuỗi 30 ngày mới xứng với một con rồng.', price: 2000, body: [124, 108, 200], accent: [246, 214, 118] },
  { name: 'Kỳ Lân', description: 'Hiếm như một tuần học đủ bảy ngày.', price: 2000, body: [232, 208, 240], accent: [156, 208, 232] },
  { name: 'Phượng Hoàng', description: 'Chuỗi đứt rồi vẫn bay lên lại được.', price: 2000, body: [220, 96, 84], accent: [246, 196, 96] },
  { name: 'Mèo Vũ Trụ', description: 'Học từ vựng ở tận dải ngân hà.', price: 2000, body: [72, 78, 132], accent: [196, 216, 248] },
  { name: 'Cú Vàng', description: 'Dành cho người coi việc học là thói quen.', price: 2000, body: [226, 186, 88], accent: [255, 244, 208] },
];

// ---------------------------------------------------------------------------
// Khung viền ảnh đại diện
// ---------------------------------------------------------------------------

/**
 * Loại "Khung viền": viền quanh ảnh đại diện, NGƯỜI KHÁC cũng thấy (bài đăng, bình luận,
 * bảng xếp hạng, thành viên nhóm).
 *
 * Không có khung giá 0 như linh vật: người chưa mua khung nào đã có sẵn khung MẶC ĐỊNH
 * viền trắng, vẽ bằng CSS ở component `Avatar`, không phải một vật phẩm trong kho.
 */
export const FRAME_TYPE = {
  slug: KnownItemSlug.AVATAR_FRAME,
  label: 'Khung viền',
  description: 'Viền quanh ảnh đại diện — người khác cũng thấy ở bài đăng, bảng xếp hạng và nhóm lớp.',
} as const;

export interface FrameSeed extends FrameSpec {
  name: string;
  description: string;
  price: number;
}

/**
 * 20 khung viền mẫu, cùng ba bậc giá với linh vật để hai loại dễ so sánh trong cửa hàng.
 * Kiểu càng cầu kỳ thì càng đắt: viền đặc/đôi/đứt → chuyển màu/hạt/đá → cầu vồng/quầng sáng.
 */
export const FRAMES: readonly FrameSeed[] = [
  // --- 300 xu ---
  // KHÔNG dùng đúng màu `--brand` (96, 144, 207): avatar chưa có ảnh vẽ chữ cái đầu trên
  // nền `bg-brand`, viền trùng màu nền là tan hẳn vào mặt — đã thấy khi xem tấm ghép thử.
  { name: 'Viền Xanh Dương', description: 'Viền đặc xanh đậm, gọn gàng.', price: 300, style: 'solid', colors: [[36, 82, 158]] },
  { name: 'Viền Hồng Phấn', description: 'Nhẹ nhàng, dịu mắt.', price: 300, style: 'solid', colors: [[240, 160, 186]] },
  { name: 'Viền Lá Non', description: 'Xanh tươi như ngày đầu học.', price: 300, style: 'solid', colors: [[108, 184, 120]] },
  { name: 'Viền Chanh Vàng', description: 'Tươi sáng cho những ngày học đều.', price: 300, style: 'solid', colors: [[236, 200, 70]] },
  { name: 'Viền Bạc Kép', description: 'Hai vòng bạc mảnh, tinh tế.', price: 300, style: 'double', colors: [[176, 186, 202]] },
  { name: 'Viền San Hô Kép', description: 'Hai vòng san hô ấm áp.', price: 300, style: 'double', colors: [[238, 128, 104]] },
  { name: 'Nét Đứt Tím', description: 'Mười hai nét tím xếp vòng.', price: 300, style: 'dashed', colors: [[150, 118, 214]], count: 12 },
  { name: 'Chấm Bi Cam', description: 'Mười sáu chấm cam vui mắt.', price: 300, style: 'beads', colors: [[240, 146, 60]], count: 16 },

  // --- 800 xu ---
  { name: 'Hoàng Hôn', description: 'Cam chuyển dần sang hồng.', price: 800, style: 'gradient', colors: [[246, 150, 70], [228, 92, 140]] },
  { name: 'Đại Dương', description: 'Xanh biển sâu chuyển sang ngọc lam.', price: 800, style: 'gradient', colors: [[46, 92, 184], [64, 196, 190]] },
  { name: 'Bạc Hà', description: 'Mát lạnh như một buổi sáng sớm.', price: 800, style: 'gradient', colors: [[150, 226, 200], [92, 172, 214]] },
  { name: 'Chuỗi Ngọc Trai', description: 'Hai mươi hạt ngọc trai trắng.', price: 800, style: 'beads', colors: [[246, 242, 236]], count: 20 },
  { name: 'Hoa Anh Đào', description: 'Mười bốn cánh hồng quanh ảnh.', price: 800, style: 'beads', colors: [[244, 170, 196]], count: 14 },
  { name: 'Kim Cương Xanh', description: 'Viền bạc gắn bốn viên đá xanh.', price: 800, style: 'gem', colors: [[196, 204, 218], [70, 150, 236]], count: 4 },
  { name: 'Rừng Thông', description: 'Nét đứt xanh rêu, dày dặn.', price: 800, style: 'dashed', colors: [[62, 128, 88]], count: 20 },

  // --- 2000 xu ---
  { name: 'Cầu Vồng', description: 'Đủ bảy sắc cầu vồng.', price: 2000, style: 'rainbow', colors: [] },
  { name: 'Vàng Hoàng Gia', description: 'Viền vàng gắn sáu viên hồng ngọc.', price: 2000, style: 'gem', colors: [[226, 182, 72], [206, 48, 80]], count: 6 },
  { name: 'Dải Ngân Hà', description: 'Tím sang xanh, toả quầng sáng.', price: 2000, style: 'glow', colors: [[124, 92, 220], [70, 150, 240]] },
  { name: 'Lửa Rồng', description: 'Đỏ rực sang cam, toả nhiệt quanh ảnh.', price: 2000, style: 'glow', colors: [[222, 58, 48], [250, 170, 50]] },
  { name: 'Cực Quang', description: 'Xanh lục sang tím, lung linh như bầu trời phương Bắc.', price: 2000, style: 'glow', colors: [[70, 214, 150], [160, 96, 224]] },
];
