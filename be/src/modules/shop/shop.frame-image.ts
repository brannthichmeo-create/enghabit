import { deflateSync } from 'node:zlib';
import { AVATAR_FRAME_SCALE } from '@enghabit/shared';
import { pngChunk } from './shop.mascot-image.js';

/**
 * Vẽ ảnh khung viền ảnh đại diện — PNG vuông, TÂM TRONG SUỐT, phủ lên avatar.
 *
 * Hình học khớp với `AVATAR_FRAME_SCALE` của shared: avatar chiếm vòng tròn giữa có
 * đường kính = cạnh ảnh / scale, frontend phóng ảnh này đúng theo tỉ lệ đó. Viền bắt đầu
 * LẤN VÀO mép avatar một chút (`OVERLAP`) để không hở khe sáng giữa ảnh và viền khi trình
 * duyệt làm tròn toạ độ ở cỡ nhỏ.
 *
 * Khử răng cưa bằng lấy mẫu 4×4 mỗi điểm ảnh: viền tròn mảnh vẽ không khử thì răng cưa lộ
 * rõ ở cỡ 36px của sidebar — đúng chỗ người dùng nhìn thấy khung của mình nhiều nhất.
 */

export type Rgb = readonly [number, number, number];

export type FrameStyle =
  /** Một dải màu đặc. */
  | 'solid'
  /** Hai dải mảnh, giữa hở. */
  | 'double'
  /** Màu chuyển dần theo góc giữa `colors[0]` và `colors[1]`. */
  | 'gradient'
  /** Đủ bảy sắc cầu vồng theo góc. */
  | 'rainbow'
  /** Dải đứt đoạn thành `count` nét. */
  | 'dashed'
  /** `count` hạt tròn xếp quanh vòng. */
  | 'beads'
  /** Dải đặc + `count` viên đá lớn màu `colors[1]`. */
  | 'gem'
  /** Dải chuyển màu kèm quầng sáng mờ dần ra ngoài. */
  | 'glow';

export interface FrameSpec {
  style: FrameStyle;
  /** Màu chính, và với vài kiểu là màu thứ hai. */
  colors: readonly Rgb[];
  /** Số nét/hạt/viên đá — chỉ dùng cho `dashed`, `beads`, `gem`. */
  count?: number;
}

/** Cạnh ảnh. Avatar lớn nhất 64px × scale 1,3 ≈ 83px, nên 160 là đủ nét trên màn retina. */
const SIZE = 160;
const CENTER = SIZE / 2;
/** Bán kính vòng avatar trong hệ toạ độ của ảnh. */
const AVATAR_R = SIZE / (2 * AVATAR_FRAME_SCALE);
/** Viền lấn vào mép avatar bao nhiêu điểm ảnh, để không hở khe. */
const OVERLAP = 2;
/** Mép trong và mép ngoài của dải viền chính. */
const INNER_R = AVATAR_R - OVERLAP;
const OUTER_R = AVATAR_R + (CENTER - AVATAR_R) * 0.62;
const MID_R = (INNER_R + OUTER_R) / 2;
const BAND = OUTER_R - INNER_R;

type Rgba = [number, number, number, number];

/** Màu tại một điểm (toạ độ thực, gốc ở tâm), hoặc null nếu trong suốt. */
type Painter = (x: number, y: number) => Rgba | null;

export function makeFramePng(spec: FrameSpec): Uint8Array<ArrayBuffer> {
  const paint = painterFor(spec);
  const raw = Buffer.alloc(SIZE * (1 + SIZE * 4));
  const SUB = 4;

  for (let py = 0; py < SIZE; py += 1) {
    const rowStart = py * (1 + SIZE * 4);
    raw[rowStart] = 0; // byte kiểu lọc

    for (let px = 0; px < SIZE; px += 1) {
      // Cộng dồn màu có nhân alpha, rồi chia lại — trung bình thẳng màu không nhân alpha
      // sẽ làm mép viền ngả về đen ở chỗ giáp phần trong suốt.
      let r = 0;
      let g = 0;
      let b = 0;
      let a = 0;

      for (let sy = 0; sy < SUB; sy += 1) {
        for (let sx = 0; sx < SUB; sx += 1) {
          const x = px + (sx + 0.5) / SUB - CENTER;
          const y = py + (sy + 0.5) / SUB - CENTER;
          const color = paint(x, y);
          if (!color) continue;
          const alpha = color[3] / 255;
          r += color[0] * alpha;
          g += color[1] * alpha;
          b += color[2] * alpha;
          a += alpha;
        }
      }

      const pixel = rowStart + 1 + px * 4;
      const coverage = a / (SUB * SUB);
      if (coverage === 0) continue;

      raw[pixel] = Math.round(r / a);
      raw[pixel + 1] = Math.round(g / a);
      raw[pixel + 2] = Math.round(b / a);
      raw[pixel + 3] = Math.round(coverage * 255);
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(SIZE, 0);
  ihdr.writeUInt32BE(SIZE, 4);
  ihdr[8] = 8; // 8 bit mỗi kênh
  ihdr[9] = 6; // kiểu màu 6 = RGBA

  const png = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', deflateSync(raw)),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);

  return new Uint8Array(png);
}

// ---------------------------------------------------------------------------
// Từng kiểu khung
// ---------------------------------------------------------------------------

function painterFor(spec: FrameSpec): Painter {
  const [c0 = [255, 255, 255], c1 = c0] = spec.colors;
  const count = spec.count ?? 12;

  switch (spec.style) {
    case 'solid':
      return (x, y) => (inBand(x, y) ? shade(c0, x, y) : null);

    case 'double': {
      // Hai dải mảnh bằng 38% bề dày, chừa khe ở giữa.
      const thin = BAND * 0.38;
      return (x, y) => {
        const d = Math.hypot(x, y);
        const inside = (d >= INNER_R && d <= INNER_R + thin) || (d >= OUTER_R - thin && d <= OUTER_R);
        return inside ? shade(c0, x, y) : null;
      };
    }

    case 'gradient':
      return (x, y) => (inBand(x, y) ? shade(mix(c0, c1, angularT(x, y)), x, y) : null);

    case 'rainbow':
      return (x, y) => (inBand(x, y) ? shade(hueColor(angle01(x, y)), x, y) : null);

    case 'dashed':
      return (x, y) => {
        if (!inBand(x, y)) return null;
        // Mỗi chu kỳ: 65% nét, 35% hở.
        const phase = (angle01(x, y) * count) % 1;
        return phase < 0.65 ? shade(c0, x, y) : null;
      };

    case 'beads': {
      const beadR = Math.min(BAND * 0.62, (Math.PI * MID_R) / count * 0.9);
      return (x, y) => {
        // Hạt gần nhất theo góc — chỉ cần so với một hạt, không phải cả vòng.
        const step = (Math.PI * 2) / count;
        const k = Math.round(Math.atan2(y, x) / step);
        const bx = Math.cos(k * step) * MID_R;
        const by = Math.sin(k * step) * MID_R;
        return Math.hypot(x - bx, y - by) <= beadR ? shade(c0, x - bx, y - by, beadR) : null;
      };
    }

    case 'gem': {
      const step = (Math.PI * 2) / count;
      const gemR = BAND * 0.85;
      return (x, y) => {
        // Đá nằm TRÊN dải nên xét trước.
        const k = Math.round((Math.atan2(y, x) + Math.PI / 2) / step);
        const theta = k * step - Math.PI / 2; // viên đầu tiên ở đỉnh
        const gx = Math.cos(theta) * MID_R;
        const gy = Math.sin(theta) * MID_R;
        if (Math.hypot(x - gx, y - gy) <= gemR) return shade(c1, x - gx, y - gy, gemR);
        return inBand(x, y) ? shade(c0, x, y) : null;
      };
    }

    case 'glow':
      return (x, y) => {
        const d = Math.hypot(x, y);
        if (inBand(x, y)) return shade(mix(c0, c1, angularT(x, y)), x, y);
        // Quầng sáng: từ mép ngoài dải mờ dần tới sát mép ảnh.
        const limit = CENTER - 1;
        if (d > OUTER_R && d <= limit) {
          const t = 1 - (d - OUTER_R) / (limit - OUTER_R);
          const base = mix(c0, c1, angularT(x, y));
          return [base[0], base[1], base[2], Math.round(150 * t * t)];
        }
        return null;
      };
  }
}

// ---------------------------------------------------------------------------
// Tiện ích hình học và màu
// ---------------------------------------------------------------------------

function inBand(x: number, y: number): boolean {
  const d = Math.hypot(x, y);
  return d >= INNER_R && d <= OUTER_R;
}

/** Góc chuẩn hoá về [0, 1), bắt đầu từ đỉnh, đi theo chiều kim đồng hồ. */
function angle01(x: number, y: number): number {
  const a = Math.atan2(y, x) + Math.PI / 2;
  return ((a / (Math.PI * 2)) % 1 + 1) % 1;
}

/**
 * Tham số chuyển màu theo góc, đi 0 → 1 → 0 quanh vòng.
 *
 * Chạy 0 → 1 một chiều thì ở đỉnh sẽ có một đường nối gắt giữa màu cuối và màu đầu;
 * đi lên rồi đi xuống thì màu khép kín liền mạch.
 */
function angularT(x: number, y: number): number {
  const t = angle01(x, y);
  return t < 0.5 ? t * 2 : (1 - t) * 2;
}

function mix(a: Rgb, b: Rgb, t: number): Rgb {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

/** Sắc cầu vồng cho `t` trong [0, 1), độ bão hoà vừa phải để không chói mắt. */
function hueColor(t: number): Rgb {
  const h = t * 6;
  const c = 0.85;
  const xx = c * (1 - Math.abs((h % 2) - 1));
  const m = 0.12;
  const [r, g, b] =
    h < 1 ? [c, xx, 0] : h < 2 ? [xx, c, 0] : h < 3 ? [0, c, xx] : h < 4 ? [0, xx, c] : h < 5 ? [xx, 0, c] : [c, 0, xx];
  return [(r + m) * 255, (g + m) * 255, (b + m) * 255];
}

/**
 * Đổ khối nhẹ: sáng hơn ở nửa trên-trái, tối hơn ở nửa dưới-phải.
 *
 * Một dải màu phẳng trông như nét vẽ phẳng dán lên ảnh; chỉ cần lệch sáng tối vài phần
 * trăm là viền có cảm giác nổi khối. `radius` cho phép đổ khối riêng cho từng hạt/viên đá.
 */
function shade(color: Rgb, x: number, y: number, radius = OUTER_R): Rgba {
  const light = (-(x + y) / (radius * 2 * Math.SQRT2)) * 0.35; // ~[-0.17, 0.17]
  const adjust = (v: number): number => Math.max(0, Math.min(255, Math.round(v + (light > 0 ? (255 - v) * light : v * light))));
  return [adjust(color[0]), adjust(color[1]), adjust(color[2]), 255];
}
