import type { PrismaClient } from '@prisma/client';
import { prisma } from '../../src/lib/prisma.js';
import { MASCOTS, MASCOT_TYPE } from '../seed-data/shop.js';
import { makeMascotPng } from '../seed-data/mascot-image.js';

/**
 * Nạp DANH MỤC cửa hàng: loại vật phẩm + 20 linh vật + ảnh.
 *
 *   pnpm --filter @enghabit/be db:seed-shop
 *
 * Tách khỏi `seed.ts` vì đây là thứ duy nhất cần chạy lên **production**: bảng cửa hàng
 * do `migrate deploy` tạo ra lúc Render khởi động, nhưng migration không mang dữ liệu —
 * deploy xong cửa hàng vẫn rỗng cho tới khi có người nạp danh mục.
 *
 * Script này **chỉ ghi danh mục**, cố ý KHÔNG mua hộ tài khoản nào:
 *
 *  - Trên production, "mua hộ" là trừ xu thật trong ví của một người dùng thật.
 *  - `seed.ts` vẫn mua hộ tài khoản demo, nhưng đó là DB dev và mục đích là có dữ liệu
 *    mẫu để xem màn Ví và tab "Của tôi" — không phải mục đích của production.
 *
 * Idempotent: tra theo (loại, tên) rồi mới tạo, nên chạy lại không nhân đôi. Cũng KHÔNG
 * ghi đè vật phẩm đã có — quản trị viên sửa giá hay đổi ảnh trên production thì lần chạy
 * sau phải giữ nguyên công sửa đó, cùng tinh thần với `update: {}` của các phần seed khác.
 */

export interface SeedShopResult {
  typeId: number;
  createdItems: number;
  skippedItems: number;
  createdImages: number;
}

export async function seedShopCatalog(client: PrismaClient): Promise<SeedShopResult> {
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
  let skippedItems = 0;
  let createdImages = 0;

  for (const [index, mascot] of MASCOTS.entries()) {
    const existing = await client.shopItem.findFirst({
      where: { typeId: type.id, name: mascot.name },
      select: { id: true },
    });

    if (existing) {
      skippedItems += 1;

      /*
        Vật phẩm đã có nhưng thiếu ảnh thì bù ảnh.

        Trường hợp này xảy ra thật: quản trị viên tự thêm một vật phẩm trùng tên rồi chưa
        tải ảnh, hoặc một lần chạy trước bị dừng giữa hai câu ghi. Không bù thì thẻ đó
        mãi mãi là ô giữ chỗ mà không ai hiểu vì sao.
      */
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
        // createdById để trống: danh mục do script nạp, không phải do một quản trị viên
        // cụ thể soạn. Cột này nullable sẵn cho đúng tình huống đó.
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

  return { typeId: type.id, createdItems, skippedItems, createdImages };
}

async function main(): Promise<void> {
  /*
    In ra HOST đang ghi vào, không in cả chuỗi kết nối vì trong đó có mật khẩu.

    Cần dòng này vì script chạy được lên cả dev lẫn production, chỉ khác nhau biến môi
    trường — nạp nhầm chỗ là chuyện dễ xảy ra nhất khi dùng nó.
  */
  const host = process.env.DATABASE_URL?.replace(/^.*@/, '').replace(/\?.*$/, '') ?? '(chưa đặt)';
  console.log(`Nạp danh mục cửa hàng vào: ${host}\n`);

  const result = await seedShopCatalog(prisma);

  console.log(`  Loại vật phẩm "${MASCOT_TYPE.label}" (id ${result.typeId})`);
  console.log(`  Thêm mới: ${result.createdItems} vật phẩm, ${result.createdImages} ảnh`);
  console.log(`  Đã có sẵn, giữ nguyên: ${result.skippedItems} vật phẩm`);

  const [types, items] = await Promise.all([
    prisma.shopItemType.count(),
    prisma.shopItem.count(),
  ]);
  console.log(`\nTổng trong DB: ${types} loại, ${items} vật phẩm.`);
}

/*
  Chỉ chạy `main` khi gọi trực tiếp bằng dòng lệnh.

  `seed.ts` import `seedShopCatalog` từ file này, nên nếu `main` chạy ở mức module thì
  một lần `db:seed` sẽ kéo theo cả script này chạy hai lần.
*/
const invokedDirectly = process.argv[1]?.replace(/\\/g, '/').endsWith('prisma/scripts/seed-shop.ts');

if (invokedDirectly) {
  main()
    .catch((error: unknown) => {
      console.error('Nạp danh mục cửa hàng lỗi:', error);
      process.exit(1);
    })
    .finally(() => void prisma.$disconnect());
}
