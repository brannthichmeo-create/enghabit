import {
  CoinDirection,
  CoinReason,
  shopItemDedupeKey,
  todayLocalDate,
  type InventoryView,
  type OwnedItemView,
  type Paginated,
  type PurchaseResult,
  type ShopItemQueryInput,
  type ShopItemView,
  type ShopTypeView,
  type WalletEntry,
  type WalletQueryInput,
  type WalletView,
} from '@enghabit/shared';
import type { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { toDbDate, fromDbDate } from '../../common/utils/db-date.js';
import { BadRequestError, ConflictError, NotFoundError } from '../../common/errors/app-error.js';

/**
 * Cửa hàng vật phẩm, ví cá nhân và kho vật phẩm.
 *
 * Bốn quy tắc phải giữ khi sửa module này (xem docs/ke-hoach-cua-hang-vat-pham.md):
 *
 * 1. **Không ghi ActivityLog.** Mua một con linh vật không phải hoạt động học; ghi vào
 *    đó thì bấm nút mua là đủ giữ chuỗi ngày và mọi thống kê học tập sẽ nói dối.
 * 2. **Không cộng/trừ XP.** XP suy ra từ ActivityLog. Ở đây chỉ có xu, sổ cái riêng.
 * 3. **Trừ xu là ghi MỘT DÒNG ÂM** vào coin_transactions. Không có cột số dư ở đâu cả;
 *    số dư luôn là SUM(amount).
 * 4. **Chống mua trùng bằng ràng buộc unique của DB**, không bằng đọc-rồi-ghi: hai
 *    request bấm cùng lúc đều đọc thấy "chưa sở hữu" và sẽ cùng ghi.
 */

// ---------------------------------------------------------------------------
// Cửa hàng
// ---------------------------------------------------------------------------

/** Các loại đang bật, kèm số vật phẩm đang bán — dùng cho dải tab của cửa hàng. */
export async function listTypes(): Promise<ShopTypeView[]> {
  const types = await prisma.shopItemType.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    include: { _count: { select: { items: { where: { isActive: true } } } } },
  });

  return types.map((type) => ({
    id: type.id,
    slug: type.slug,
    label: type.label,
    description: type.description,
    itemCount: type._count.items,
  }));
}

/**
 * Danh sách vật phẩm kèm ba cờ trạng thái của người đang xem.
 *
 * Ba cờ `isOwned` / `isFavorite` / `isEquipped` trả THẲNG ở đây chứ không để FE gọi
 * thêm một API "các id đã mua" rồi tự ghép — ghép ở FE là chỗ sinh ra cảnh mua xong mà
 * nút vẫn ghi "Mua", và là lý do hai màn hình có thể nói khác nhau về cùng một thẻ.
 */
export async function listItems(
  userId: number,
  query: ShopItemQueryInput,
): Promise<Paginated<ShopItemView>> {
  const where: Prisma.ShopItemWhereInput = {
    /*
      Vật phẩm đã ngừng bán vẫn hiện NẾU người này sở hữu nó.

      Người đã trả xu không được thấy món đồ của mình biến mất chỉ vì quản trị viên
      ngừng bán — cùng tinh thần với tắt tính năng: đảo ngược được, không mất dữ liệu.
    */
    OR: [
      { isActive: true, type: { isActive: true } },
      { owners: { some: { userId } } },
    ],
    ...(query.typeId ? { typeId: query.typeId } : {}),
    ...(query.favorite ? { favorites: { some: { userId } } } : {}),
    ...(query.owned ? { owners: { some: { userId } } } : {}),
    ...(query.q ? { name: { contains: query.q } } : {}),
  };

  const [total, rows, equipped] = await Promise.all([
    prisma.shopItem.count({ where }),
    prisma.shopItem.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      include: itemInclude(userId),
    }),
    listEquippedItemIds(userId),
  ]);

  return {
    items: rows.map((row) => toItemView(row, equipped)),
    total,
    page: query.page,
    pageSize: query.pageSize,
  };
}

/**
 * Mua một vật phẩm.
 *
 * Toàn bộ nằm trong một transaction có KHOÁ DÒNG user, đúng như `buyStreakFreeze`:
 * đọc số dư rồi mới ghi dòng trừ. Không khoá thì hai lệnh mua hai vật phẩm KHÁC NHAU
 * về cùng lúc đều thấy đủ tiền và số dư thành âm — khoá `dedupeKey` không cứu được
 * trường hợp đó vì hai khoá khác nhau.
 */
export async function buyItem(
  userId: number,
  itemId: number,
  timezone: string,
): Promise<PurchaseResult> {
  const today = todayLocalDate(timezone);

  await prisma.$transaction(async (tx) => {
    // Prisma không có API khoá dòng nên phải dùng raw. Ngoại lệ có chủ ý của quy tắc
    // "mọi truy vấn qua Prisma Client" — vẫn đi qua kết nối của Prisma.
    await tx.$executeRaw`SELECT id FROM users WHERE id = ${userId} FOR UPDATE`;

    const item = await tx.shopItem.findUnique({
      where: { id: itemId },
      include: { type: { select: { isActive: true } } },
    });

    // Vật phẩm không tồn tại và vật phẩm đã ngừng bán đều trả 404: với người mua, thứ
    // không bán nữa là thứ không tồn tại.
    if (!item) throw new NotFoundError('Vật phẩm không tồn tại');
    if (!item.isActive || !item.type.isActive) {
      throw new NotFoundError('Vật phẩm này đã ngừng bán');
    }

    const owned = await tx.userItem.findUnique({
      where: { userId_itemId: { userId, itemId } },
      select: { id: true },
    });
    if (owned) throw new ConflictError('Bạn đã sở hữu vật phẩm này');

    const coins = await getCoinBalance(userId, tx);
    if (coins < item.price) {
      throw new BadRequestError(`Cần ${item.price} xu, bạn mới có ${coins}`);
    }

    /*
      Ghi dòng trừ xu TRƯỚC khi ghi sở hữu.

      Ràng buộc @@unique([userId, dedupeKey]) của sổ cái là thứ DUY NHẤT đảm bảo hai
      request về cùng lúc không trừ tiền hai lần. Câu `findUnique` ở trên chỉ để có
      thông báo lỗi tử tế, không phải để chống trùng — nó vẫn lọt khi hai request cùng
      đọc thấy "chưa sở hữu".
    */
    await tx.coinTransaction.create({
      data: {
        userId,
        amount: -item.price,
        reason: CoinReason.SHOP_PURCHASE,
        dedupeKey: shopItemDedupeKey(itemId),
        localDate: toDbDate(today),
      },
    });

    await tx.userItem.create({
      data: { userId, itemId, pricePaid: item.price },
    });
  }).catch((error: unknown) => {
    if (isUniqueViolation(error)) throw new ConflictError('Bạn đã sở hữu vật phẩm này');
    throw error;
  });

  const [item, coins] = await Promise.all([getItemView(userId, itemId), getCoinBalance(userId)]);

  return { coins, delta: -item.price, item };
}

/**
 * Bật/tắt yêu thích.
 *
 * Nhận trạng thái ĐÍCH (`favorite`) chứ không phải lệnh "đảo trạng thái": bấm nhanh hai
 * lần, hoặc bấm ở tab Yêu thích trong lúc tab Cửa hàng còn dữ liệu cũ, đều cho ra cùng
 * một kết quả. Kiểu toggle thì hai request chồng nhau quay về đúng chỗ cũ và người dùng
 * thấy trái tim tự bật lại.
 *
 * Yêu thích ĐỘC LẬP với sở hữu: bỏ thích không đụng gì tới vật phẩm đã mua.
 */
export async function setFavorite(
  userId: number,
  itemId: number,
  favorite: boolean,
): Promise<ShopItemView> {
  await assertItemVisible(userId, itemId);

  if (favorite) {
    // Trùng khoá nghĩa là đã thích rồi — đúng trạng thái mong muốn, không phải lỗi.
    await prisma.userItemFavorite
      .create({ data: { userId, itemId } })
      .catch((error: unknown) => {
        if (!isUniqueViolation(error)) throw error;
      });
  } else {
    await prisma.userItemFavorite.deleteMany({ where: { userId, itemId } });
  }

  return getItemView(userId, itemId);
}

// ---------------------------------------------------------------------------
// Kho vật phẩm
// ---------------------------------------------------------------------------

/** Vật phẩm đã mua, kèm bản đồ vật phẩm đang dùng của từng loại. */
export async function getInventory(userId: number): Promise<InventoryView> {
  const [rows, equippedRows] = await Promise.all([
    prisma.userItem.findMany({
      where: { userId },
      orderBy: { purchasedAt: 'desc' },
      include: { item: { include: itemInclude(userId) } },
    }),
    prisma.userEquippedItem.findMany({ where: { userId }, select: { typeId: true, itemId: true } }),
  ]);

  const equippedIds = new Set(equippedRows.map((row) => row.itemId));

  const items: OwnedItemView[] = rows.map((row) => ({
    ...toItemView(row.item, equippedIds),
    pricePaid: row.pricePaid,
    purchasedAt: row.purchasedAt.toISOString(),
  }));

  const equipped: Record<number, number> = {};
  for (const row of equippedRows) equipped[row.typeId] = row.itemId;

  /*
    Bản đồ theo slug để các chỗ hiển thị (linh vật trên trang Tổng quan) không phải tự
    dò trong mảng. Slug lạ vẫn nằm trong bản đồ — FE có nhánh mặc định và bỏ qua, chứ
    không được vỡ vì một loại chưa có code hiển thị.
  */
  const equippedBySlug: Record<string, OwnedItemView> = {};
  for (const item of items) {
    if (equipped[item.typeId] === item.id) equippedBySlug[item.typeSlug] = item;
  }

  return { items, equipped, equippedBySlug };
}

/**
 * Chọn vật phẩm dùng cho một loại. Mỗi loại đúng một vật phẩm.
 *
 * `upsert` theo khoá chính (userId, typeId) — quy tắc "một loại một cái" nằm ở ràng
 * buộc của DB. Xoá-rồi-ghi trong service thì hai request cùng lúc để lại hai dòng cho
 * cùng một loại và giao diện vẽ hai con linh vật chồng nhau.
 */
export async function equipItem(
  userId: number,
  typeId: number,
  itemId: number,
): Promise<InventoryView> {
  const owned = await prisma.userItem.findUnique({
    where: { userId_itemId: { userId, itemId } },
    include: { item: { select: { typeId: true } } },
  });

  // Chưa sở hữu thì trả 404 chứ không 403: với người dùng, vật phẩm chưa mua là vật
  // phẩm không có trong kho của họ.
  if (!owned) throw new NotFoundError('Vật phẩm không có trong kho của bạn');

  if (owned.item.typeId !== typeId) {
    throw new BadRequestError('Vật phẩm không thuộc loại này');
  }

  await prisma.userEquippedItem.upsert({
    where: { userId_typeId: { userId, typeId } },
    create: { userId, typeId, itemId },
    update: { itemId },
  });

  return getInventory(userId);
}

/** Bỏ dùng vật phẩm của một loại. Không xoá gì khỏi kho. */
export async function unequipItem(userId: number, typeId: number): Promise<InventoryView> {
  await prisma.userEquippedItem.deleteMany({ where: { userId, typeId } });
  return getInventory(userId);
}

// ---------------------------------------------------------------------------
// Ví
// ---------------------------------------------------------------------------

/**
 * Số dư và lịch sử biến động xu.
 *
 * KHÔNG có bảng ví: số dư là SUM(amount) và lịch sử chính là các dòng của sổ cái
 * coin_transactions. Thêm bảng riêng chỉ tạo một nguồn số liệu thứ hai để lệch.
 */
export async function getWallet(userId: number, query: WalletQueryInput): Promise<WalletView> {
  /*
    Dòng 0 xu (mua vật phẩm tặng miễn phí) xếp vào CHI, không xếp vào THU.

    Phải dùng `lte: 0` cho Chi chứ không phải `lt: 0`: nếu Thu là `> 0` mà Chi là `< 0`
    thì dòng 0 xu không khớp bộ lọc nào và biến mất khỏi CẢ HAI tab — người dùng mua
    món miễn phí xong không tìm lại được dòng nào trong ví.
  */
  const where: Prisma.CoinTransactionWhereInput = {
    userId,
    ...(query.direction === CoinDirection.IN ? { amount: { gt: 0 } } : {}),
    ...(query.direction === CoinDirection.OUT ? { amount: { lte: 0 } } : {}),
    ...(query.from || query.to
      ? {
          localDate: {
            ...(query.from ? { gte: toDbDate(query.from) } : {}),
            ...(query.to ? { lte: toDbDate(query.to) } : {}),
          },
        }
      : {}),
  };

  const [total, rows, inSum, outSum] = await Promise.all([
    prisma.coinTransaction.count({ where }),
    prisma.coinTransaction.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    // Tổng thu và tổng chi tính trên TOÀN BỘ lịch sử, không theo bộ lọc đang chọn: hai
    // con số này là thông tin nền của cái ví, đổi theo bộ lọc thì không còn nghĩa gì.
    prisma.coinTransaction.aggregate({ where: { userId, amount: { gt: 0 } }, _sum: { amount: true } }),
    prisma.coinTransaction.aggregate({ where: { userId, amount: { lt: 0 } }, _sum: { amount: true } }),
  ]);

  const itemNames = await namesOfPurchasedItems(rows);

  const entries: WalletEntry[] = rows.map((row) => ({
    id: row.id,
    amount: row.amount,
    // Khớp đúng bộ lọc ở trên: chỉ số DƯƠNG là Thu, 0 và số âm là Chi.
    direction: row.amount > 0 ? CoinDirection.IN : CoinDirection.OUT,
    reason: row.reason as WalletEntry['reason'],
    itemName: itemNames.get(row.dedupeKey) ?? null,
    localDate: fromDbDate(row.localDate),
    createdAt: row.createdAt.toISOString(),
  }));

  const totalIn = inSum._sum.amount ?? 0;
  const totalOut = outSum._sum.amount ?? 0;

  return {
    // Số dư = tổng sổ cái, đúng như getCoinBalance — cộng lại từ hai vế đã tính sẵn
    // thay vì hỏi DB thêm một lần nữa cho cùng con số.
    balance: totalIn + totalOut,
    totalIn,
    // Đổi dấu để FE hiện "đã tiêu 500" thay vì "−500" — chiều đã nằm ở nhãn cột.
    totalOut: Math.abs(totalOut),
    entries,
    total,
    page: query.page,
    pageSize: query.pageSize,
  };
}

// ---------------------------------------------------------------------------
// Ảnh vật phẩm
// ---------------------------------------------------------------------------

export interface ShopImagePayload {
  data: Buffer;
  mimeType: string;
  /** Mốc sửa gần nhất — dùng dựng ETag để trình duyệt khỏi tải lại ảnh không đổi. */
  updatedAt: Date;
}

export async function getItemImage(itemId: number): Promise<ShopImagePayload> {
  const image = await prisma.shopItemImage.findUnique({ where: { itemId } });
  if (!image) throw new NotFoundError('Vật phẩm chưa có ảnh');

  return { data: Buffer.from(image.data), mimeType: image.mimeType, updatedAt: image.updatedAt };
}

// ---------------------------------------------------------------------------
// Dùng chung
// ---------------------------------------------------------------------------

/** Số dư = tổng sổ cái. Không có bảng lưu số dư (xem ghi chú ở schema.prisma). */
export async function getCoinBalance(
  userId: number,
  client: Prisma.TransactionClient | typeof prisma = prisma,
): Promise<number> {
  const result = await client.coinTransaction.aggregate({
    where: { userId },
    _sum: { amount: true },
  });

  return result._sum.amount ?? 0;
}

/** Đường dẫn ảnh kèm tham số phiên bản, để cache dài mà vẫn đổi ngay khi thay ảnh. */
export function imageUrlFor(itemId: number, updatedAt: Date | null | undefined): string | null {
  if (!updatedAt) return null;
  return `/api/v1/shop/items/${itemId}/image?v=${updatedAt.getTime()}`;
}

const itemInclude = (userId: number) =>
  ({
    type: { select: { slug: true, label: true } },
    image: { select: { updatedAt: true } },
    favorites: { where: { userId }, select: { id: true } },
    owners: { where: { userId }, select: { id: true } },
  }) satisfies Prisma.ShopItemInclude;

type ItemWithFlags = Prisma.ShopItemGetPayload<{ include: ReturnType<typeof itemInclude> }>;

function toItemView(row: ItemWithFlags, equippedIds: Set<number>): ShopItemView {
  return {
    id: row.id,
    typeId: row.typeId,
    typeSlug: row.type.slug,
    typeLabel: row.type.label,
    name: row.name,
    description: row.description,
    price: row.price,
    imageUrl: imageUrlFor(row.id, row.image?.updatedAt),
    isOwned: row.owners.length > 0,
    isFavorite: row.favorites.length > 0,
    isEquipped: equippedIds.has(row.id),
  };
}

async function getItemView(userId: number, itemId: number): Promise<ShopItemView> {
  const [row, equipped] = await Promise.all([
    prisma.shopItem.findUnique({ where: { id: itemId }, include: itemInclude(userId) }),
    listEquippedItemIds(userId),
  ]);

  if (!row) throw new NotFoundError('Vật phẩm không tồn tại');
  return toItemView(row, equipped);
}

async function listEquippedItemIds(userId: number): Promise<Set<number>> {
  const rows = await prisma.userEquippedItem.findMany({ where: { userId }, select: { itemId: true } });
  return new Set(rows.map((row) => row.itemId));
}

/** Vật phẩm phải đang bán hoặc đã thuộc về người này, nếu không coi như không tồn tại. */
async function assertItemVisible(userId: number, itemId: number): Promise<void> {
  const item = await prisma.shopItem.findFirst({
    where: {
      id: itemId,
      OR: [{ isActive: true, type: { isActive: true } }, { owners: { some: { userId } } }],
    },
    select: { id: true },
  });

  if (!item) throw new NotFoundError('Vật phẩm không tồn tại');
}

/**
 * Tên vật phẩm cho các dòng mua hàng của một trang lịch sử ví.
 *
 * Lấy id từ chính `dedupeKey` ("SHOP_ITEM:<id>") thay vì join sang user_items: dòng sổ
 * cái là bản ghi tài chính, nó phải đọc được kể cả khi vật phẩm sau này bị gỡ khỏi kho.
 * Một truy vấn cho cả trang, không phải mỗi dòng một truy vấn.
 */
async function namesOfPurchasedItems(
  rows: { reason: string; dedupeKey: string }[],
): Promise<Map<string, string>> {
  const byItemId = new Map<number, string>();

  for (const row of rows) {
    if (row.reason !== CoinReason.SHOP_PURCHASE) continue;
    const id = Number(row.dedupeKey.split(':')[1]);
    if (Number.isInteger(id) && id > 0) byItemId.set(id, row.dedupeKey);
  }

  if (byItemId.size === 0) return new Map();

  const items = await prisma.shopItem.findMany({
    where: { id: { in: [...byItemId.keys()] } },
    select: { id: true, name: true },
  });

  return new Map(items.map((item) => [byItemId.get(item.id) as string, item.name]));
}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: string }).code === 'P2002'
  );
}
