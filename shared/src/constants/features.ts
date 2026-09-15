/**
 * Danh mục tính năng bật/tắt được của người học.
 *
 * NGUỒN SỰ THẬT cho "hệ thống có những tính năng nào" nằm ở đây, trong mã nguồn.
 * Bảng `feature_flags` dưới DB chỉ giữ TRẠNG THÁI bật/tắt. Hai thứ này tách nhau vì:
 * thêm tính năng mới là thêm code, không phải thêm một dòng trong DB — nếu danh sách
 * nằm dưới DB thì deploy bản mới xong tính năng sẽ im lặng không chạy chỉ vì quên
 * chèn dòng vào production, một lỗi không ai thấy cho tới khi người dùng phàn nàn.
 *
 * Thiếu dòng trong `feature_flags` nghĩa là BẬT (xem be/src/modules/features).
 */

/** Khoá tính năng — khớp cột `key` của bảng feature_flags. */
export const FeatureKey = {
  /** Thư viện bộ thẻ. Giữ khoá cũ để trạng thái bật/tắt đã lưu dưới DB vẫn còn hiệu lực. */
  VOCABULARY: 'VOCABULARY',
  LEARN: 'LEARN',
  /** Ôn tập. Giữ khoá cũ vì cùng lý do với VOCABULARY. */
  FLASHCARDS: 'FLASHCARDS',
  HABITS: 'HABITS',
  GOALS: 'GOALS',
  REPORT: 'REPORT',
  LEADERBOARD: 'LEADERBOARD',
  COMMUNITY: 'COMMUNITY',
  GROUPS: 'GROUPS',
  REWARDS: 'REWARDS',
} as const;
export type FeatureKey = (typeof FeatureKey)[keyof typeof FeatureKey];

export interface FeatureDefinition {
  key: FeatureKey;
  /**
   * Nhãn hiển thị. Với tính năng có màn hình riêng, nhãn này phải GIỐNG HỆT nhãn ở
   * Sidebar, ở TRAILS và ở `name` của route — một màn hình chỉ có một tên.
   */
  label: string;
  /** Một câu nói rõ người học mất gì khi tắt. Hiện dưới nhãn ở màn quản trị. */
  description: string;
  /** Đường dẫn FE bị khoá khi tắt. Rỗng nghĩa là tính năng không có màn hình riêng. */
  routes: string[];
  /** Tính năng này chỉ có nghĩa khi các tính năng dưới đây đang bật. */
  dependsOn?: FeatureKey[];
}

/**
 * Danh mục đầy đủ. Thứ tự ở đây là thứ tự hiện trên màn hình quản trị.
 *
 * CỐ Ý KHÔNG có trong danh mục: `auth`, `admin`, `profile`, `notifications` và trang
 * Tổng quan của người học. Tắt được chúng là tự khoá cửa nhà mình — tắt `auth` thì
 * không ai đăng nhập được kể cả quản trị viên, tắt `admin` thì mất luôn chính màn
 * hình để bật lại, tắt Tổng quan thì người học đăng nhập xong rơi thẳng vào 404.
 * Vì danh mục là một mảng hằng nên không có cách nào bấm nhầm: chúng không hiện ra.
 */
export const FEATURES: readonly FeatureDefinition[] = [
  {
    key: FeatureKey.VOCABULARY,
    label: 'Thư viện',
    description: 'Khám phá và tự tạo bộ thẻ. Tắt thì cả Học và Ôn tập cũng dừng theo.',
    routes: ['/library'],
  },
  {
    key: FeatureKey.LEARN,
    label: 'Học',
    description: 'Học một bộ thẻ bằng flashcard hoặc trắc nghiệm.',
    routes: ['/learn'],
    dependsOn: [FeatureKey.VOCABULARY],
  },
  {
    key: FeatureKey.FLASHCARDS,
    label: 'Ôn tập',
    description: 'Ôn thẻ tới hạn, quá hạn và thẻ yếu theo lịch lặp lại ngắt quãng.',
    routes: ['/review'],
    dependsOn: [FeatureKey.VOCABULARY],
  },
  {
    key: FeatureKey.HABITS,
    label: 'Thói quen',
    description: 'Tự đặt thói quen học và điểm danh hoàn thành mỗi ngày.',
    routes: ['/habits'],
  },
  {
    key: FeatureKey.GOALS,
    label: 'Mục tiêu',
    description: 'Đặt mục tiêu số từ, số phút hoặc độ dài chuỗi ngày học.',
    routes: ['/goals'],
  },
  {
    key: FeatureKey.REPORT,
    label: 'Báo cáo',
    description: 'Thống kê chi tiết theo ngày, tuần, tháng. Trang Tổng quan không bị ảnh hưởng.',
    routes: ['/report'],
  },
  {
    key: FeatureKey.LEADERBOARD,
    label: 'Bảng xếp hạng',
    description: 'So thứ hạng với người học khác theo tuần, tháng và toàn thời gian.',
    routes: ['/leaderboard'],
  },
  {
    key: FeatureKey.COMMUNITY,
    label: 'Cộng đồng',
    description: 'Diễn đàn chung. Tắt thì các nhóm lớp cũng dừng theo vì dùng chung bài đăng.',
    routes: ['/community'],
  },
  {
    key: FeatureKey.GROUPS,
    label: 'Nhóm lớp',
    description: 'Người học tự lập nhóm và trao đổi riêng trong nhóm.',
    routes: ['/groups'],
    dependsOn: [FeatureKey.COMMUNITY],
  },
  {
    key: FeatureKey.REWARDS,
    label: 'Phần thưởng',
    description: 'Điểm danh nhận xu, nhiệm vụ ngày và vật phẩm giữ chuỗi. Nằm trong trang Tổng quan.',
    routes: [],
  },
];

/** Tra một tính năng theo khoá. Trả undefined với khoá lạ (còn sót từ bản cũ). */
export function findFeature(key: string): FeatureDefinition | undefined {
  return FEATURES.find((f) => f.key === key);
}

/**
 * Các tính năng phụ thuộc trực tiếp vào `key` — tắt `key` thì phải tắt luôn chúng.
 *
 * Chỉ một cấp: danh mục hiện không có chuỗi phụ thuộc dài hơn hai bậc, và service
 * gọi hàm này đệ quy nên thêm bậc nữa vẫn đúng.
 */
export function dependentsOf(key: FeatureKey): FeatureKey[] {
  return FEATURES.filter((f) => f.dependsOn?.includes(key)).map((f) => f.key);
}

/** Trạng thái mọi tính năng, dạng bản đồ khoá → bật/tắt. */
export type FeatureFlagMap = Record<FeatureKey, boolean>;

/** Bản đồ mặc định: mọi tính năng đều bật. */
export function allFeaturesEnabled(): FeatureFlagMap {
  return Object.fromEntries(FEATURES.map((f) => [f.key, true])) as FeatureFlagMap;
}
