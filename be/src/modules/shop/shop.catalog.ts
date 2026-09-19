import type { Prisma, PrismaClient } from '@prisma/client';
import { logger } from '../../lib/logger.js';
import { FRAMES, FRAME_TYPE, MASCOTS, MASCOT_TYPE } from './shop.catalog-data.js';
import { makeFramePng } from './shop.frame-image.js';
import { makeMascotPng } from './shop.mascot-image.js';

/**
 * Nạp danh mục cửa hàng mặc định: mọi loại trong `CATALOGS` cùng vật phẩm và ảnh.
 *
 * Gọi từ hai chỗ:
 *   - `src/scripts/seed-shop.ts` — chạy tay, và chạy trong `startCommand` của Render nên
 *     **push git xong là production có dữ liệu**, không phải nạp tay lần nào.
 *   - `prisma/seed.ts` — phần cửa hàng của dữ liệu mẫu trên DB dev.
 *
 * Vì sao danh mục nằm trong mã nguồn chứ không nằm trong migration hay trong seed:
 *
 *  - **Migration tạo bảng, không mang dữ liệu.** Dựa vào migration thì ảnh PNG phải nhúng
 *    dạng hex vào file `.sql`, và mỗi lần thêm vật phẩm lại phải viết migration mới.
 *  - **Seed không chạy trên production.** Gói free của Render không có tab Shell, nên seed
 *    chỉ chạy tay từ máy dev — deploy xong cửa hàng sẽ rỗng cho tới khi có người nhớ ra.
 *
 * Cùng tinh thần với danh mục tính năng (`shared/constants/features.ts`): thêm vật phẩm
 * mới là thêm code, không phải thêm một dòng DB ở production.
 *
 * KHÔNG mua hộ tài khoản nào. Trên production, mua hộ là trừ xu thật trong ví một người
 * dùng thật; phần đó chỉ nằm ở `prisma/seed.ts` cho DB dev.
 */

interface CatalogItem {
  name: string;
  description: string;
  price: number;
  /** Vẽ ảnh khi cần — không vẽ trước cả 40 ảnh cho đường nhanh chẳng dùng tới. */
  draw: () => Uint8Array<ArrayBuffer>;
}

interface Catalog {
  type: { slug: string; label: string; description: string };
  /** Thứ tự tab trong cửa hàng. */
  sortOrder: number;
  items: readonly CatalogItem[];
}

/** Thêm loại mới vào cửa hàng mặc định = thêm một phần tử ở đây. */
const CATALOGS: readonly Catalog[] = [
  {
    type: MASCOT_TYPE,
    sortOrder: 0,
    items: MASCOTS.map((m) => ({ ...m, draw: () => makeMascotPng(m.body, m.accent) })),
  },
  {
    type: FRAME_TYPE,
    sortOrder: 1,
    items: FRAMES.map((f) => ({ ...f, draw: () => makeFramePng(f) })),
  },
];

export interface SeedCatalogResult {
  /** Id của từng loại theo slug — seed dev cần để mua hộ tài khoản mẫu. */
  typeIds: Record<string, number>;
  createdItems: number;
  keptItems: number;
  createdImages: number;
  /** Mọi loại đều đã đủ nên bỏ qua hẳn — đường chạy của mọi lần khởi động sau lần đầu. */
  skipped: boolean;
}

/** Prisma Client hoặc client trong transaction — script và seed truyền vào khác nhau. */
type Client = PrismaClient | Prisma.TransactionClient;

export async function seedShopCatalog(
  client: Client,
  options: { force?: boolean } = {},
): Promise<SeedCatalogResult> {
  const result: SeedCatalogResult = {
    typeIds: {},
    createdItems: 0,
    keptItems: 0,
    createdImages: 0,
    skipped: true,
  };

  for (const catalog of CATALOGS) {
    const outcome = await seedOneCatalog(client, catalog, options.force ?? false);
    result.typeIds[catalog.type.slug] = outcome.typeId;
    result.createdItems += outcome.createdItems;
    result.keptItems += outcome.keptItems;
    result.createdImages += outcome.createdImages;
    if (!outcome.skipped) result.skipped = false;
  }

  if (result.createdItems > 0 || result.createdImages > 0) {
    logger.info(
      { createdItems: result.createdItems, createdImages: result.createdImages, keptItems: result.keptItems },
      'Đã nạp danh mục cửa hàng',
    );
  }

  return result;
}

async function seedOneCatalog(
  client: Client,
  catalog: Catalog,
  force: boolean,
): Promise<{ typeId: number; createdItems: number; keptItems: number; createdImages: number; skipped: boolean }> {
  /*
    Đường nhanh — xét RIÊNG TỪNG LOẠI, không xét cả bảng.

    Bản trước so `tổng số vật phẩm >= 20`. Production đã có đủ 20 linh vật, nên khi thêm
    loại Khung viền, đường nhanh đó sẽ thấy "đủ rồi" và bỏ qua luôn — deploy xong không có
    khung nào mà không một dòng log nào báo. Đếm theo từng loại thì loại mới luôn được nạp.

    Cần đường nhanh vì hàm này chạy ở MỖI lần server khởi động, mà gói free của Render ngủ
    sau 15 phút không có request — tức là tỉnh lại rất nhiều lần mỗi ngày.

    Đếm cả ảnh chứ không chỉ vật phẩm: vật phẩm có mà thiếu ảnh thì vẫn phải chạy tiếp để
    bù, nếu không thẻ đó mãi mãi là ô giữ chỗ.
  */
  if (!force) {
    const existingType = await client.shopItemType.findUnique({
      where: { slug: catalog.type.slug },
      select: { id: true },
    });

    if (existingType) {
      const [items, images] = await Promise.all([
        client.shopItem.count({ where: { typeId: existingType.id } }),
        client.shopItemImage.count({ where: { item: { typeId: existingType.id } } }),
      ]);

      if (items >= catalog.items.length && images >= items) {
        return { typeId: existingType.id, createdItems: 0, keptItems: items, createdImages: 0, skipped: true };
      }
    }
  }

  // update: {} — chạy lại không ghi đè nhãn hay trạng thái quản trị viên đã sửa.
  const type = await client.shopItemType.upsert({
    where: { slug: catalog.type.slug },
    update: {},
    create: {
      slug: catalog.type.slug,
      label: catalog.type.label,
      description: catalog.type.description,
      sortOrder: catalog.sortOrder,
    },
  });

  let createdItems = 0;
  let keptItems = 0;
  let createdImages = 0;

  for (const [index, entry] of catalog.items.entries()) {
    const existing = await client.shopItem.findFirst({
      where: { typeId: type.id, name: entry.name },
      select: { id: true },
    });

    if (existing) {
      /*
        GIỮ NGUYÊN vật phẩm đã có, chỉ bù ảnh nếu thiếu.

        Quản trị viên sửa giá hay đổi ảnh ở /admin/shop thì lần khởi động sau không được
        xoá công sửa đó — nếu ghi đè, mọi lần service tỉnh lại là một lần đặt lại giá về
        mặc định, và không ai hiểu vì sao.
      */
      keptItems += 1;

      const image = await client.shopItemImage.findUnique({
        where: { itemId: existing.id },
        select: { itemId: true },
      });

      if (!image) {
        await client.shopItemImage.create({
          data: { itemId: existing.id, data: entry.draw(), mimeType: 'image/png' },
        });
        createdImages += 1;
      }

      continue;
    }

    const item = await client.shopItem.create({
      data: {
        typeId: type.id,
        name: entry.name,
        description: entry.description,
        price: entry.price,
        sortOrder: index,
        // createdById để trống: danh mục do hệ thống nạp, không phải một quản trị viên
        // cụ thể soạn ra. Cột này nullable sẵn cho đúng tình huống đó.
      },
    });

    await client.shopItemImage.create({
      data: { itemId: item.id, data: entry.draw(), mimeType: 'image/png' },
    });

    createdItems += 1;
    createdImages += 1;
  }

  return { typeId: type.id, createdItems, keptItems, createdImages, skipped: false };
}
