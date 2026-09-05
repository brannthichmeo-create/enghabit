/**
 * Đo bảng đối chiếu tương phản của bảng màu hiện tại.
 *
 *   node fe/scripts/check-contrast.mjs          # in bảng, thoát 1 nếu có mục chưa đạt
 *   node fe/scripts/check-contrast.mjs --css    # in thêm giá trị kênh màu để dán vào index.css
 *
 * Chạy sau MỖI lần đổi màu — docs/color-rules.md R7 yêu cầu đo bằng công cụ chứ không
 * nhìn bằng mắt, và bảng ở cuối tài liệu đó phải khớp với kết quả script này.
 *
 * Giá trị dưới đây phải luôn khớp với fe/src/index.css. Đây là bản chép tay chứ không
 * đọc trực tiếp từ CSS: đổi màu thì sửa cả hai chỗ, rồi chạy lại script.
 */

const rgb = (h) => { h = h.replace('#', ''); return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)); };
const lum = (h) => {
  const [r, g, b] = rgb(h).map((v) => { const x = v / 255; return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4; });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const cr = (a, b) => { const [hi, lo] = [lum(a), lum(b)].sort((p, q) => q - p); return (hi + 0.05) / (lo + 0.05); };
const ch = (h) => rgb(h).join(' ');

// ---------------------------------------------------------------------------
// Bảng màu đề xuất — xanh dương pastel
// ---------------------------------------------------------------------------

const SANG = {
  page: '#E7EFFA',          // pastel blue, nền hệ thống — giờ SÁNG
  surface: '#FFFFFF',
  surfaceRaised: '#FFFFFF',
  sunken: '#F1F5FC',
  hover: '#D6E4F7',         // hover trên nền hệ thống: đậm hơn nền vì nền đã sáng
  line: '#DEE7F3',
  lineStrong: '#B2C4DB',
  lineControl: '#6E8199',
  lineOnPage: '#BBCFE8',

  text: '#18212E',
  textSoft: '#44536A',
  textMuted: '#5E6D83',

  onPage: '#18212E',        // nền hệ thống sáng nên bộ này TỐI, ngược hẳn bản cũ
  onPageSoft: '#3D4B5F',
  onPageMuted: '#55647A',
  onPageLink: '#1D57A8',

  brand: '#6090CF',         // xanh dương dịu; đây là bậc SÁNG NHẤT còn đạt 3:1 trên thẻ trắng (R6)
  brandStrong: '#1E4E8C',
  brandSoft: '#E8F1FC',
  brandVivid: '#A8C9EC',
  onBrand: '#0F1B2E',       // chữ trên nền thương hiệu — tối ở cả hai chế độ

  accent: '#EAB22D',
  accentInk: '#7D5900',
  accentSoft: '#FAF5E2',

  success: '#2F7A4D',
  successSoft: '#E8F4EC',
  danger: '#B03A2E',
  dangerSoft: '#FAEEEC',
  onFill: '#FFFFFF',

  // Huy chương bạc/đồng cho hạng 2/3 ở bảng xếp hạng. Đồng cố định ở cả hai chế độ,
  // bạc thì đổi bậc (R17) — bạc trung tính nên chỉ có độ sáng để tách nền, còn đồng
  // bão hoà thì tách bằng sắc độ. Xem giải thích đầy đủ trong fe/src/index.css.
  rankSilver: '#A5AFBB',
  rankSilverSoft: '#EEF1F4',
  rankBronze: '#B87333',
  rankBronzeSoft: '#F7EDE3',

  cal: ['#E5EBF4', '#C2D8F2', '#93B7E4', '#5A8FD0', '#2C5F9B'],
};

const TOI = {
  page: '#141B26',          // navy sẫm, không dùng đen thuần (R14)
  surface: '#1E2733',
  surfaceRaised: '#26313F',
  sunken: '#1A222D',
  hover: '#2A3543',
  line: '#2E3947',
  lineStrong: '#465464',
  lineControl: '#77879B',
  lineOnPage: '#2E3947',

  text: '#E6EAF0',
  textSoft: '#B3BECD',
  textMuted: '#8B99AB',

  onPage: '#E6EAF0',        // hai nền đều tối nên dùng chung bậc với chữ trong thẻ
  onPageSoft: '#B3BECD',
  onPageMuted: '#8B99AB',
  onPageLink: '#8FB8EC',

  brand: '#8FB8EC',         // R17: nền tối phải dùng bậc SÁNG của cùng sắc độ
  brandStrong: '#B0CFF5',
  brandSoft: '#1C2A3D',
  brandVivid: '#A8C9EC',
  onBrand: '#0F1B2E',

  accent: '#EAB22D',
  accentInk: '#E8C16A',
  accentSoft: '#2B2410',

  success: '#7AB374',
  successSoft: '#1A2819',
  danger: '#E67A6E',
  dangerSoft: '#301A17',
  onFill: '#141B26',

  // Bạc lên bậc sáng trên nền tối (R17); đồng giữ nguyên vì bão hoà.
  rankSilver: '#C4CCD5',
  rankSilverSoft: '#28313D',
  rankBronze: '#B87333',
  rankBronzeSoft: '#332821',

  cal: ['#1A222D', '#20344B', '#2B4E75', '#3D72AB', '#6FA3E0'],
};

// ---------------------------------------------------------------------------

const PAIRS = [
  ['text / surface', 'Chữ chính trong thẻ', (p) => [p.text, p.surface], 4.5],
  ['text-soft / surface', 'Chữ phụ trong thẻ', (p) => [p.textSoft, p.surface], 4.5],
  ['text-muted / surface', 'Chữ mờ trong thẻ', (p) => [p.textMuted, p.surface], 4.5],
  ['text-muted / sunken', 'Chữ mờ trên vùng chìm', (p) => [p.textMuted, p.sunken], 4.5],
  ['on-page / page', 'Chữ chính trên nền hệ thống', (p) => [p.onPage, p.page], 4.5],
  ['on-page-soft / page', 'Mục điều hướng', (p) => [p.onPageSoft, p.page], 4.5],
  ['on-page-muted / page', 'Nhãn nhóm, chữ mờ ngoài thẻ', (p) => [p.onPageMuted, p.page], 4.5],
  ['on-page-link / page', 'Liên kết trên nền hệ thống', (p) => [p.onPageLink, p.page], 4.5],
  ['on-page / hover', 'Mục điều hướng khi di chuột', (p) => [p.onPage, p.hover], 4.5],
  ['brand-strong / surface', 'Liên kết trong thẻ', (p) => [p.brandStrong, p.surface], 4.5],
  ['brand-strong / brand-soft', 'Chữ trên nền thương hiệu nhạt', (p) => [p.brandStrong, p.brandSoft], 4.5],
  ['on-brand / brand', 'Chữ trên nút chính', (p) => [p.onBrand, p.brand], 4.5],
  ['on-brand / brand-vivid', 'Chữ trên panel đăng nhập', (p) => [p.onBrand, p.brandVivid], 4.5],
  ['success / surface', 'Chữ trạng thái thành công', (p) => [p.success, p.surface], 4.5],
  ['danger / surface', 'Chữ trạng thái lỗi', (p) => [p.danger, p.surface], 4.5],
  ['accent-ink / surface', 'Chữ màu nhấn', (p) => [p.accentInk, p.surface], 4.5],
  ['accent-ink / accent-soft', 'Chữ nhấn trên nền nhấn nhạt', (p) => [p.accentInk, p.accentSoft], 4.5],
  ['on-fill / success', 'Chữ trên nền thành công', (p) => [p.onFill, p.success], 4.5],
  ['on-fill / danger', 'Chữ trên nền lỗi', (p) => [p.onFill, p.danger], 4.5],
  ['line-control / surface', 'Viền ô nhập', (p) => [p.lineControl, p.surface], 3],
  ['brand / surface', 'Nút chính nổi trên thẻ', (p) => [p.brand, p.surface], 3],
  ['line-on-page / page', 'Viền khung app (trang trí)', (p) => [p.lineOnPage, p.page], 0],
  ['surface / page', 'Thẻ nổi trên nền hệ thống', (p) => [p.surface, p.page], 0],

  // Huy hiệu hạng 1/2/3 ở bảng xếp hạng. `on-brand` dùng lại — cùng vai trò "chữ tối
  // cố định trên nền màu sáng vừa" mà token này đã được định nghĩa cho, không phải
  // token mới. Trước khi có hàng này, cặp on-brand/accent CHƯA từng được đo — hoá ra
  // chỉ đạt 1.59:1 ở chế độ tối vì badge cũ dùng `--ink` (đổi theo chế độ) thay vì
  // `--on-brand` (cố định); đây là lỗi thật được phát hiện và sửa nhờ thêm hàng này.
  ['on-brand / accent', 'Chữ trên huy hiệu hạng nhất', (p) => [p.onBrand, p.accent], 4.5],
  ['on-brand / rank-silver', 'Chữ trên huy hiệu hạng nhì', (p) => [p.onBrand, p.rankSilver], 4.5],
  ['on-brand / rank-bronze', 'Chữ trên huy hiệu hạng ba', (p) => [p.onBrand, p.rankBronze], 4.5],
  ['text-muted / rank-silver-soft', 'Chữ mờ trên thẻ hạng nhì', (p) => [p.textMuted, p.rankSilverSoft], 4.5],
  ['text-muted / rank-bronze-soft', 'Chữ mờ trên thẻ hạng ba', (p) => [p.textMuted, p.rankBronzeSoft], 4.5],

  // Viền thẻ bục, đo trên nền KHUNG bục (`surface`) chứ không phải nền trang: từ khi
  // ba ô có khung riêng bao ngoài, thứ nằm sau viền là surface.
  //
  // Ngưỡng 0 (chỉ theo dõi, không chặn) là CÓ CHỦ Ý. Đây là viền trang trí báo thứ
  // hạng, không phải viền ô nhập liệu, nên WCAG 1.4.11 không áp; và đặt ngưỡng 3
  // sẽ đánh trượt ngay chính viền vàng hạng nhất đang chạy tốt ở 1.93:1 — nó đọc
  // được nhờ SẮC ĐỘ vàng chứ không nhờ chênh lệch độ sáng.
  //
  // Bảng vẫn phải in ba hàng này để thấy khi một giá trị tụt quá xa. Riêng bạc là
  // màu trung tính, không có sắc độ cứu, nên giữ nó KHÔNG THẤP HƠN mốc 1.93 của vàng.
  ['accent / surface', 'Viền thẻ hạng nhất (mốc đối chiếu)', (p) => [p.accent, p.surface], 0],
  ['rank-silver / surface', 'Viền thẻ hạng nhì', (p) => [p.rankSilver, p.surface], 0],
  ['rank-bronze / surface', 'Viền thẻ hạng ba', (p) => [p.rankBronze, p.surface], 0],
];

let fail = 0;
console.log('\n' + '═'.repeat(88));
console.log('BẢNG ĐỐI CHIẾU TƯƠNG PHẢN — bảng màu xanh dương pastel');
console.log('═'.repeat(88));
console.log('Cặp màu'.padEnd(30) + 'Dùng ở đâu'.padEnd(32) + 'Sáng'.padStart(9) + 'Tối'.padStart(10) + '  Ngưỡng');
console.log('─'.repeat(88));

for (const [name, use, pick, min] of PAIRS) {
  const s = cr(...pick(SANG));
  const t = cr(...pick(TOI));
  const mark = (v) => (min === 0 ? ' ' : v >= min ? '✓' : '✗');
  if (min > 0 && (s < min || t < min)) fail += 1;
  console.log(
    name.padEnd(30) + use.padEnd(32) +
    (s.toFixed(2) + mark(s)).padStart(9) + (t.toFixed(2) + mark(t)).padStart(10) +
    '  ' + (min || '—'),
  );
}

// R24 — thang lịch hoạt động phải có độ sáng biến thiên đơn điệu
console.log('\n' + '─'.repeat(88));
for (const [che, p] of [['SÁNG', SANG], ['TỐI', TOI]]) {
  const l = p.cal.map(lum);
  const tang = l.every((v, i) => i === 0 || v > l[i - 1]);
  const giam = l.every((v, i) => i === 0 || v < l[i - 1]);
  const ok = tang || giam;
  if (!ok) fail += 1;
  console.log(`Thang lịch ${che.padEnd(5)} đơn điệu: ${ok ? '✓ ĐẠT' : '✗ HỎNG'}  [${l.map((v) => v.toFixed(3)).join(' → ')}]`);
}

console.log('\n' + '═'.repeat(88));
console.log(fail === 0 ? '✓ TẤT CẢ ĐẠT NGƯỠNG' : `✗ CÒN ${fail} MỤC CHƯA ĐẠT`);
console.log('═'.repeat(88));

// In sẵn dạng kênh màu để dán vào index.css (R5)
if (process.argv.includes('--css')) {
  for (const [che, p] of [['SÁNG', SANG], ['TỐI', TOI]]) {
    console.log(`\n/* ---- ${che} ---- */`);
    for (const [k, v] of Object.entries(p)) {
      if (k === 'cal') { p.cal.forEach((c, i) => console.log(`--cal-${i}: ${c};`)); continue; }
      const name = k.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase());
      console.log(`--${name}: ${ch(v)}; /* ${v} */`);
    }
  }
}
