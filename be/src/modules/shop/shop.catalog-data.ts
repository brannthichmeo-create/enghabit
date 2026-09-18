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
  slug: 'MASCOT',
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
