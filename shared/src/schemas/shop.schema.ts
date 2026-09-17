import { z } from 'zod';
import { CoinDirection, CoinReason } from '../constants/enums.js';
import { type LocalDate } from '../date/local-date.js';
import { ITEM_SLUG_PATTERN, SHOP_LIMITS } from '../shop/shop.js';
import { idSchema, localDateSchema, paginationSchema } from './common.schema.js';

/**
 * Schema và kiểu dữ liệu của cửa hàng, ví và kho vật phẩm.
 *
 * Lưu ý về mọi bộ lọc dạng boolean dưới đây: query string luôn là CHUỖI, mà
 * `Boolean('false') === true` — dùng `z.coerce.boolean()` thì bộ lọc luôn bật và tab
 * "Tất cả" mất sạch bản ghi. Phải so khớp chuỗi tường minh bằng `z.preprocess`.
 */

const booleanQuery = z.preprocess(
  (value) => value === true || value === 'true' || value === '1',
  z.boolean(),
);

// ---------------------------------------------------------------------------
// Người học: cửa hàng, kho, ví
// ---------------------------------------------------------------------------

export const shopItemQuerySchema = paginationSchema.extend({
  /** Lọc theo loại. Bỏ trống là mọi loại. */
  typeId: z.coerce.number().int().positive().optional(),
  /** Chỉ vật phẩm người dùng đã bấm yêu thích — nguồn của tab Yêu thích trong kho. */
  favorite: booleanQuery.default(false),
  /** Chỉ vật phẩm đã sở hữu — nguồn của tab Của tôi. */
  owned: booleanQuery.default(false),
  /** Tìm theo tên vật phẩm. */
  q: z.string().trim().max(100).optional(),
});
export type ShopItemQueryInput = z.infer<typeof shopItemQuerySchema>;

export const walletQuerySchema = paginationSchema.extend({
  /** Thu (amount > 0) hay Chi (amount < 0). Bỏ trống là cả hai. */
  direction: z.nativeEnum(CoinDirection).optional(),
  from: localDateSchema.optional(),
  to: localDateSchema.optional(),
});
export type WalletQueryInput = z.infer<typeof walletQuerySchema>;

export const toggleFavoriteSchema = z.object({
  /**
   * Trạng thái MONG MUỐN sau thao tác, không phải "đảo trạng thái hiện tại".
   *
   * Gửi trạng thái đích khiến API idempotent: bấm nhanh hai lần, hoặc bấm ở tab Yêu
   * thích trong lúc tab Cửa hàng còn dữ liệu cũ, đều cho ra cùng một kết quả. Kiểu
   * "toggle" thì hai request chồng nhau sẽ quay về đúng chỗ cũ và người dùng thấy trái
   * tim tự bật lại.
   */
  favorite: z.boolean(),
});
export type ToggleFavoriteInput = z.infer<typeof toggleFavoriteSchema>;

export const equipItemSchema = z.object({
  itemId: idSchema,
});
export type EquipItemInput = z.infer<typeof equipItemSchema>;

/** Một loại vật phẩm như người học nhìn thấy. */
export interface ShopTypeView {
  id: number;
  /** Mã loại. FE tra bản đồ chỗ hiển thị theo giá trị này (xem shared/shop). */
  slug: string;
  label: string;
  description: string | null;
  /** Số vật phẩm đang bán của loại này. */
  itemCount: number;
}

/**
 * Một vật phẩm trong danh sách cửa hàng.
 *
 * Ba cờ `isOwned` / `isFavorite` / `isEquipped` trả THẲNG trong danh sách, không để FE
 * gọi thêm một API "các id đã mua" rồi tự ghép: ghép ở FE là chỗ sinh ra cảnh mua xong
 * mà nút vẫn ghi "Mua", và là lý do hai màn hình có thể nói khác nhau về cùng một thẻ.
 */
export interface ShopItemView {
  id: number;
  typeId: number;
  typeSlug: string;
  typeLabel: string;
  name: string;
  description: string | null;
  price: number;
  /** Đường dẫn ảnh kèm tham số phiên bản, hoặc null nếu quản trị viên chưa tải ảnh. */
  imageUrl: string | null;
  isOwned: boolean;
  isFavorite: boolean;
  isEquipped: boolean;
}

/** Một dòng trong tab "Của tôi" — vật phẩm đã mua, kèm thông tin lúc mua. */
export interface OwnedItemView extends ShopItemView {
  /** Giá ĐÃ TRẢ lúc mua, không phải giá hiện tại của vật phẩm. */
  pricePaid: number;
  purchasedAt: string;
}

/** Dữ liệu tab "Của tôi": vật phẩm đã mua, nhóm theo loại để chọn dùng. */
export interface InventoryView {
  items: OwnedItemView[];
  /** Vật phẩm đang dùng của từng loại: `typeId` → `itemId`. */
  equipped: Record<number, number>;
  /** Vật phẩm đang dùng theo slug, cho các chỗ hiển thị như linh vật trên trang chủ. */
  equippedBySlug: Record<string, OwnedItemView>;
}

/** Kết quả một lần mua: số dư mới và vật phẩm vừa nhận. */
export interface PurchaseResult {
  coins: number;
  /** Luôn âm — số xu vừa tiêu. */
  delta: number;
  item: ShopItemView;
}

/** Một dòng biến động xu trong màn Ví. */
export interface WalletEntry {
  id: number;
  /** Dương là Thu, âm là Chi. */
  amount: number;
  direction: CoinDirection;
  /**
   * Lý do dạng enum, KHÔNG phải câu tiếng Việt dựng sẵn ở BE.
   *
   * Nhãn hiển thị do FE dịch qua `t()`: trả câu tiếng Việt từ server thì giao diện
   * tiếng Anh sẽ lòi ra tiếng Việt ở đúng bảng mà người dùng nhìn nhiều nhất.
   */
  reason: CoinReason;
  /** Tên vật phẩm với dòng mua hàng — dữ liệu động, FE không đưa qua `t()`. */
  itemName: string | null;
  localDate: LocalDate;
  createdAt: string;
}

export interface WalletView {
  balance: number;
  /** Tổng thu và tổng chi của toàn bộ lịch sử, không phụ thuộc bộ lọc đang chọn. */
  totalIn: number;
  totalOut: number;
  entries: WalletEntry[];
  total: number;
  page: number;
  pageSize: number;
}

// ---------------------------------------------------------------------------
// Quản trị viên: CRUD cửa hàng
// ---------------------------------------------------------------------------

export const createShopTypeSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(1, 'Mã loại không được để trống')
    .max(SHOP_LIMITS.typeSlug)
    .regex(ITEM_SLUG_PATTERN, 'Mã loại chỉ gồm CHỮ HOA, số và gạch dưới, bắt đầu bằng chữ'),
  label: z.string().trim().min(1, 'Tên loại không được để trống').max(SHOP_LIMITS.typeLabel),
  description: z.string().trim().max(SHOP_LIMITS.typeDescription).optional(),
  sortOrder: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});
export type CreateShopTypeInput = z.infer<typeof createShopTypeSchema>;

/** Sửa loại. `slug` KHÔNG sửa được: FE đã gắn code hiển thị theo nó. */
export const updateShopTypeSchema = createShopTypeSchema.omit({ slug: true }).partial();
export type UpdateShopTypeInput = z.infer<typeof updateShopTypeSchema>;

export const createShopItemSchema = z.object({
  typeId: idSchema,
  name: z.string().trim().min(1, 'Tên vật phẩm không được để trống').max(SHOP_LIMITS.itemName),
  description: z.string().trim().max(SHOP_LIMITS.itemDescription).optional(),
  /** 0 nghĩa là tặng miễn phí — hợp lệ, dùng cho vật phẩm mặc định của người mới. */
  price: z.number().int().min(0, 'Giá không được âm').max(SHOP_LIMITS.itemPrice),
  sortOrder: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
  /** Ảnh dạng data URL. Kiểm kích thước và định dạng bằng `parseShopImageDataUrl`. */
  imageDataUrl: z.string().optional(),
});
export type CreateShopItemInput = z.infer<typeof createShopItemSchema>;

export const updateShopItemSchema = createShopItemSchema.partial();
export type UpdateShopItemInput = z.infer<typeof updateShopItemSchema>;

/** Một vật phẩm trong màn quản trị — có thêm số liệu vận hành. */
export interface AdminShopItemView {
  id: number;
  typeId: number;
  typeLabel: string;
  name: string;
  description: string | null;
  price: number;
  isActive: boolean;
  sortOrder: number;
  imageUrl: string | null;
  /** Số người đã mua. Khác 0 thì không xoá cứng được, chỉ ngừng bán. */
  ownerCount: number;
  createdAt: string;
}

export interface AdminShopTypeView extends ShopTypeView {
  isActive: boolean;
  sortOrder: number;
  /** Tổng vật phẩm kể cả đã ngừng bán — khác `itemCount` vốn chỉ đếm cái đang bán. */
  totalItemCount: number;
}
