import type { Prisma, PrismaClient } from '@prisma/client';
import { logger } from '../../lib/logger.js';
import { MASCOTS, MASCOT_TYPE } from './shop.catalog-data.js';
import { makeMascotPng } from './shop.mascot-image.js';

/**
 * Nạp danh mục cửa hàng mặc định (loại "Linh vật" + 20 vật phẩm + ảnh).
 *
 * Gọi từ hai chỗ:
 *   - `src/scripts/seed-shop.ts` — chạy tay, và chạy trong `startCommand` của Render nên
 *     **push git xong là production có dữ liệu**, không phải nạp tay lần nào.
 *   - `prisma/seed.ts` — phần cửa hàng của dữ liệu mẫu trên DB dev.
 *
 * Vì sao danh mục nằm trong mã nguồn chứ không nằm trong migration hay trong seed:
 *
 *  - **Migration tạo bảng, không mang dữ liệu.** Dựa vào migration thì 20 ảnh PNG phải
 *    nhúng dạng hex vào file `.sql`, và mỗi lần thêm linh vật lại phải viết migration mới.
 *  - **Seed không chạy trên production.** Gói free của Render không có tab Shell, nên seed
 *    chỉ chạy tay từ máy dev — deploy xong cửa hàng sẽ rỗng cho tới khi có người nhớ ra.
 *
 * Cùng tinh thần với danh mục tính năng (`shared/constants/features.ts`): thêm vật phẩm
 * mới là thêm code, không phải thêm một dòng DB ở production.
 *
 * KHÔNG mua hộ tài khoản nào. Trên production, mua hộ là trừ xu thật trong ví một người
 * dùng thật; phần đó chỉ nằm ở `prisma/seed.ts` cho DB dev.
 */

export interface SeedCatalogResult {
  typeId: number;
  createdItems: number;
  keptItems: number;
  createdImages: number;
  /** Đã có đủ danh mục nên bỏ qua hẳn — đường chạy của mọi lần khởi động sau lần đầu. */
  skipped: boolean;
}

/** Prisma Client hoặc client trong transaction — script và seed truyền vào khác nhau. */
type Client = PrismaClient | Prisma.TransactionClient;

export async function seedShopCatalog(
  client: Client,
  options: { force?: boolean } = {},
): Promise<SeedCatalogResult> {
  /*
    Đường nhanh: hai câu đếm rồi thoát.

    Cần nó vì hàm này chạy ở MỖI lần server khởi động, mà gói free của Render ngủ sau 15
    phút không có request — tức là tỉnh lại rất nhiều lần mỗi ngày. Không có đường nhanh
    thì mỗi lần tỉnh là 20+ câu truy vấn chỉ để xác nhận không có gì phải làm.

    Đếm cả ảnh chứ không chỉ vật phẩm: vật phẩm có mà thiếu ảnh thì vẫn phải chạy tiếp để
    bù, nếu không thẻ đó mãi mãi là ô giữ chỗ.
  */
  if (!options.force) {
    const [items, images] = await Promise.all([
      client.shopItem.count(),
      client.shopItemImage.count(),
    ]);

    if (items >= MASCOTS.length && images >= items) {
      const type = await client.shopItemType.findUnique({
        where: { slug: MASCOT_TYPE.slug },
        select: { id: true },
      });

      if (type) {
        return { typeId: type.id, createdItems: 0, keptItems: items, createdImages: 0, skipped: true };
      }
    }
  }

  // update: {} — chạy lại không ghi đè nhãn hay trạng thái quản trị viên đã sửa.
  const type = await client.shopItemType.upsert({
    where: { slug: MASCOT_TYPE.slug },
    update: {},
    create: {
      slug: MASCOT_TYPE.slug,
      label: MASCOT_TYPE.label,
      description: MASCOT_TYPE.description,
      sortOrder: 0,
    },
  });

  let createdItems = 0;
  let keptItems = 0;
  let createdImages = 0;

  for (const [index, mascot] of MASCOTS.entries()) {
    const existing = await client.shopItem.findFirst({
      where: { typeId: type.id, name: mascot.name },
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
          data: {
            itemId: existing.id,
            data: makeMascotPng(mascot.body, mascot.accent),
            mimeType: 'image/png',
          },
        });
        createdImages += 1;
      }

      continue;
    }

    const item = await client.shopItem.create({
      data: {
        typeId: type.id,
        name: mascot.name,
        description: mascot.description,
        price: mascot.price,
        sortOrder: index,
        // createdById để trống: danh mục do hệ thống nạp, không phải một quản trị viên
        // cụ thể soạn ra. Cột này nullable sẵn cho đúng tình huống đó.
      },
    });

    await client.shopItemImage.create({
      data: {
        itemId: item.id,
        data: makeMascotPng(mascot.body, mascot.accent),
        mimeType: 'image/png',
      },
    });

    createdItems += 1;
    createdImages += 1;
  }

  if (createdItems > 0 || createdImages > 0) {
    logger.info(
      { createdItems, createdImages, keptItems },
      'Đã nạp danh mục cửa hàng',
    );
  }

  return { typeId: type.id, createdItems, keptItems, createdImages, skipped: false };
}
