import { crc32, deflateSync } from 'node:zlib';

/**
 * Vẽ ảnh PNG cho dữ liệu mẫu — không tải tệp, không gọi mạng.
 *
 * Dùng bởi CẢ `seed.ts` và `scripts/seed-shop.ts`, nên đặt ở đây chứ không để private
 * trong seed: hai bản triển khai của cùng một hình vẽ thì DB dev và DB production sẽ có
 * hai bộ linh vật trông khác nhau.
 */

/** Một khối dữ liệu PNG: độ dài, tên khối, nội dung, rồi CRC của tên cộng nội dung. */
export function pngChunk(type: string, data: Buffer): Buffer {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);

  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);

  return Buffer.concat([length, body, crc]);
}

/**
 * Vẽ một linh vật PNG nền TRONG SUỐT: thân tròn, hai má, hai mắt.
 *
 * Nền trong suốt nên phải dùng kiểu màu 6 (RGBA) chứ không phải kiểu 2 (RGB) như
 * `makeBandedPng`. Đây cũng là lý do ảnh vật phẩm ở màn quản trị không đi qua canvas:
 * xuất JPEG là mất hết phần trong suốt và linh vật sẽ có một khung vuông quanh mình.
 */
export function makeMascotPng(
  body: readonly [number, number, number],
  accent: readonly [number, number, number],
): Buffer {
  const size = 128;
  const raw = Buffer.alloc(size * (1 + size * 4));

  const center = size / 2;
  const bodyRadius = size * 0.42;

  for (let y = 0; y < size; y += 1) {
    const rowStart = y * (1 + size * 4);
    raw[rowStart] = 0; // byte kiểu lọc

    for (let x = 0; x < size; x += 1) {
      const pixel = rowStart + 1 + x * 4;
      const dx = x - center;
      const dy = y - center;

      // Ngoài thân thì để trong suốt hoàn toàn.
      if (Math.hypot(dx, dy) > bodyRadius) continue;

      let [r, g, b] = body as [number, number, number];

      // Hai má, đối xứng quanh trục dọc.
      for (const side of [-1, 1]) {
        const cheek = Math.hypot(
          x - (center + side * bodyRadius * 0.55),
          y - (center + bodyRadius * 0.3),
        );
        if (cheek < bodyRadius * 0.22) [r, g, b] = accent as [number, number, number];
      }

      // Hai mắt: lòng trắng rồi con ngươi.
      for (const side of [-1, 1]) {
        const eye = Math.hypot(
          x - (center + side * bodyRadius * 0.32),
          y - (center - bodyRadius * 0.15),
        );
        if (eye < bodyRadius * 0.2) [r, g, b] = [255, 255, 255];
        if (eye < bodyRadius * 0.09) [r, g, b] = [40, 44, 52];
      }

      raw[pixel] = r;
      raw[pixel + 1] = g;
      raw[pixel + 2] = b;
      raw[pixel + 3] = 255;
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // 8 bit mỗi kênh màu
  ihdr[9] = 6; // kiểu màu 6 = RGBA

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', deflateSync(raw)),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}
