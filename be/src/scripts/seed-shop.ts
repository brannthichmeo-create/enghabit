import { prisma } from '../lib/prisma.js';
import { seedShopCatalog } from '../modules/shop/shop.catalog.js';

/**
 * Nạp danh mục cửa hàng vào DB đang trỏ tới.
 *
 *   pnpm --filter @enghabit/be db:seed-shop            # chạy tay, dev
 *   node dist/scripts/seed-shop.js --soft              # trong startCommand của Render
 *
 * Nằm ở `src/scripts/` chứ không phải `prisma/scripts/` như `recompute-streak.ts`, vì
 * đây là thứ DUY NHẤT trong nhóm script phải chạy được trên production: `rootDir` của
 * tsconfig là `src`, nên chỉ file ở đây mới được biên dịch vào `dist` và gọi bằng `node`.
 * Đặt ở `prisma/` thì production phải gọi qua `tsx` — một devDependency.
 *
 * `--soft`: lỗi chỉ ghi log rồi thoát với mã 0. Bắt buộc có khi chạy trong
 * `startCommand`, vì lệnh nối bằng `&&`: không có nó thì một lỗi DB tạm thời lúc nạp
 * danh mục sẽ chặn luôn `node dist/server.js` và cả API sập, chỉ vì mấy con linh vật.
 */

async function main(): Promise<void> {
  /*
    In HOST đang ghi vào, không in cả chuỗi kết nối vì trong đó có mật khẩu.

    Cần dòng này vì script chạy được lên cả dev lẫn production, chỉ khác biến môi trường —
    nạp nhầm chỗ là chuyện dễ xảy ra nhất khi dùng nó bằng tay.
  */
  const host = process.env.DATABASE_URL?.replace(/^.*@/, '').replace(/\?.*$/, '') ?? '(chưa đặt)';
  console.log(`Nạp danh mục cửa hàng vào: ${host}`);

  const result = await seedShopCatalog(prisma);

  if (result.skipped) {
    console.log(`  Đã có đủ danh mục (${result.keptItems} vật phẩm) — không làm gì.`);
    return;
  }

  const types = Object.entries(result.typeIds).map(([slug, id]) => `${slug} (id ${id})`);
  console.log(`  Loại vật phẩm: ${types.join(', ')}`);
  console.log(`  Thêm mới: ${result.createdItems} vật phẩm, ${result.createdImages} ảnh`);
  console.log(`  Đã có sẵn, giữ nguyên: ${result.keptItems} vật phẩm`);
}

const soft = process.argv.includes('--soft');

main()
  .catch((error: unknown) => {
    console.error('Nạp danh mục cửa hàng lỗi:', error);
    // Chạy tay thì phải đỏ để người gõ lệnh biết; chạy trong startCommand thì không được
    // kéo cả server sập theo.
    process.exit(soft ? 0 : 1);
  })
  .finally(() => void prisma.$disconnect());
