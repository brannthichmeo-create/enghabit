# Quy tắc phối màu giao diện

Bộ quy tắc áp dụng khi thiết kế hoặc chỉnh sửa màu trong Enghabit. Đúc từ chuẩn WCAG 2.2, hướng dẫn Material Design và cách các hệ thống thiết kế lớn tổ chức màu.

Mỗi quy tắc có mã (R1, R2...) để tiện trích dẫn trong review code hoặc commit.

> **Quy tắc bao trùm:** phần tương phản là phần **tính ra số được** — đã tính được thì không đoán. Mọi thay đổi màu phải chạy lại bảng đối chiếu ở cuối tài liệu.

---

## 1. Nền tảng

Quyết định cách tổ chức màu, làm trước khi chọn bất kỳ mã màu nào. Sai ở đây thì mọi thứ phía sau đều phải sửa lại.

### R1 — Đặt tên màu theo vai trò, không theo màu

Dùng `--text-primary`, `--surface`, `--action` thay vì `--blue-500`, `--gray-100`.

**Vì sao:** đổi màu thương hiệu hoặc thêm chế độ tối chỉ cần đổi giá trị token, không phải sửa từng component. Tên theo màu sẽ thành nói dối ngay khi `--blue-500` chuyển sang màu olive.

### R2 — Chia hai tầng: màu gốc và màu ngữ nghĩa

Tầng gốc là thang màu thô (`olive-100` … `olive-900`). Tầng ngữ nghĩa trỏ vào tầng gốc (`--action: olive-600`). **Component chỉ được dùng tầng ngữ nghĩa.**

**Vì sao:** tách "màu này là gì" khỏi "màu này dùng làm gì", nên đổi một trong hai không kéo theo cái kia.

### R3 — Tách màu thương hiệu khỏi màu chức năng

Màu thương hiệu để nhận diện. Màu chức năng (thành công / cảnh báo / lỗi) để báo trạng thái. **Không lấy màu thương hiệu làm màu "thành công"**, kể cả khi nó màu xanh lá.

**Vì sao:** đổi thương hiệu sang màu đỏ thì mọi thông báo thành công sẽ thành màu đỏ.

### R4 — Không viết mã màu trực tiếp trong component

Thấy `#8E9141` hay `bg-slate-200` trong file component là dấu hiệu token bị thiếu. Bổ sung token, đừng viết cứng.

**Vì sao:** màu viết cứng không đổi theo chế độ sáng/tối, và sẽ âm thầm sai màu khi bảng màu thay đổi.

### R5 — Khai báo token dạng kênh màu, không phải hex

Ghi `--brand: 142 145 65;` rồi dùng `rgb(var(--brand) / <alpha-value>)` trong Tailwind config.

**Vì sao:** với `var(--x)` dạng hex thuần, các class có độ mờ (`text-ink/70`, `bg-brand/20`) **bị bỏ qua âm thầm** — không báo lỗi, chỉ mất màu khi chạy thật.

---

## 2. Tương phản

### R6 — Đạt tối thiểu ngưỡng WCAG 2.2 mức AA

| Thành phần | Ngưỡng | Ghi chú |
|---|---|---|
| Chữ thường (< 18.66px) | **4.5:1** | Phần lớn chữ trong app |
| Chữ lớn (≥ 18.66px, hoặc ≥ 14px đậm) | **3:1** | Tiêu đề |
| Nút, ô nhập, biểu tượng mang nghĩa | **3:1** | Ranh giới phải nhìn ra được |
| Viền trang trí, đường kẻ ngăn cách | — | Không bắt buộc |

**Vì sao:** đây là mức tối thiểu để người mắt kém, người dùng ngoài nắng, và người dùng màn hình rẻ vẫn đọc được.

### R7 — Chạy công cụ đo, không nhìn bằng mắt

Mắt người rất kém trong việc ước lượng tương phản, nhất là với màu bão hoà. Một màu "trông có vẻ đủ đậm" thường chỉ đạt 3:1.

Đo bằng script (xem [Cách đo](#cách-đo)) hoặc DevTools.

### R8 — Màu thương hiệu chưa chắc dùng được làm nền nút

Rất nhiều màu thương hiệu nằm ở dải sáng vừa, không đủ tương phản với chữ trắng.

**Ví dụ thật trong dự án:** `#8E9141` với chữ trắng chỉ đạt **3.35:1** — chưa đạt. Hai lối xử lý:

| Cách | Kết quả |
|---|---|
| Dùng bậc đậm hơn `#6F7133` cho nút | 5.14:1 với chữ trắng |
| Giữ nguyên `#8E9141`, đổi chữ sang olive-đen `#1C1D10` | **5.09:1** ← đã chọn |

Cách thứ hai giữ được đúng màu thương hiệu, nên ưu tiên khi có thể.

### R9 — Kiểm tra cả cặp chữ-trên-nền, không chỉ từng màu

Tương phản là thuộc tính của một **cặp** màu. Danh sách token đẹp không đảm bảo gì cả — phải liệt kê từng cặp thực sự xuất hiện cạnh nhau rồi đo.

Đừng quên các cặp ít nghĩ tới: chữ phụ trên nền chìm, nhãn trên nền màu nhạt, chữ ở trạng thái hover, viền ô nhập.

### R10 — Chữ trên nền đặc cần token riêng, tự đảo theo chế độ

Không dùng `text-white` cố định trên nền màu. Tạo token `--on-brand`, `--on-fill`.

**Vì sao:** ở chế độ tối, màu nền thường chuyển sang bậc **sáng**, lúc đó chữ trắng chỉ còn khoảng **1.7:1** — gần như không đọc được. Lỗi này đã xảy ra thật trong dự án.

Lưu ý: brand và status có thể cần token khác nhau. Ở chế độ sáng, olive là màu sáng vừa (cần chữ tối) trong khi success/danger là màu đậm (cần chữ trắng).

---

## 3. Hoà sắc

Phần mang tính thẩm mỹ, nhưng vẫn có quy tắc chứ không tuỳ hứng.

### R11 — Chia tỷ lệ 60 / 30 / 10

- **60%** nền và khoảng trống
- **30%** bề mặt, thành phần phụ
- **10%** màu nhấn

Quy tắc này nói về *lượng dùng*, không nói dùng màu nào.

**Vì sao:** màu nhấn chỉ "nhấn" được khi nó hiếm. Tô màu thương hiệu khắp nơi thì không còn chỗ nào nổi bật, và mắt không biết nhìn đâu.

### R12 — Một sắc độ chủ đạo, đừng nhiều màu ngang hàng

Chọn một sắc độ làm thương hiệu, tối đa một màu nhấn phụ. Muốn phong phú thì thay đổi **độ sáng và độ bão hoà trong cùng sắc độ**, đừng thêm sắc độ mới.

**Vì sao:** nhiều màu ngang hàng khiến giao diện không có điểm nhìn và trông thiếu chủ ý.

### R13 — Màu trung tính phải ngả nhẹ về sắc độ chủ đạo

Xám thuần (`#808080`) trông như chưa ai chọn. Xám pha chút sắc của thương hiệu khiến cả bảng màu thành một hệ thống.

Enghabit: nền `#FAF9F2` và chữ `#22231A` đều ngả olive thay vì xám/đen thuần.

### R14 — Tránh trắng tinh và đen thuần làm nền lớn

Nền `#FFFFFF` phản xạ mạnh, nhìn lâu mỏi mắt. Nền `#000000` tạo tương phản quá gắt khiến chữ sáng bị nhoè viền (hiện tượng *halation*).

Material Design khuyến nghị nền tối là `#121212` chứ không phải đen thuần.

### R15 — Hạ độ bão hoà cho vùng màu lớn

Màu càng bão hoà càng chỉ nên dùng ở diện tích nhỏ. Một mảng lớn màu rực gây mỏi mắt và làm chữ trên nó khó đọc.

---

## 4. Chế độ tối

Chế độ tối là một bảng màu **được thiết kế riêng**, không phải bảng màu sáng đảo ngược.

### R16 — Không đảo ngược màu một cách máy móc

Đảo `#FFFFFF` thành `#000000` cho ra giao diện gắt và sai. Mỗi token phải chọn lại giá trị phù hợp với nền tối.

### R17 — Trên nền tối, màu thương hiệu phải dùng bậc SÁNG hơn

Bậc đậm dùng cho nền sáng sẽ chìm nghỉm trên nền tối. Phải lấy bậc sáng hơn của cùng sắc độ — và khi đó chữ đặt trên nó lại phải chuyển sang màu tối (xem R10).

Enghabit: brand `#8E9141` (sáng) → `#C3C76E` (tối).

### R18 — Thể hiện độ cao bằng độ sáng bề mặt

Nền tối gần như không thấy bóng đổ. Thay vào đó, thành phần càng "nổi" thì bề mặt càng sáng hơn một bậc: nền trang tối nhất → thẻ sáng hơn → hộp thoại sáng hơn nữa.

### R19 — Hạ độ bão hoà so với chế độ sáng

Màu bão hoà cao trên nền tối gây rung viền, chữ như phát sáng và khó đọc. Giảm bão hoà, tăng độ sáng.

### R20 — Khai báo chế độ tối ở cả hai nơi

```css
/* Cho người để hệ điều hành tự quyết */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme='light']) { /* ... */ }
}

/* Cho người tự chọn trong app — phải thắng cài đặt hệ điều hành */
:root[data-theme='dark'] { /* ... */ }
```

**Vì sao:** thiếu guard `:not([data-theme='light'])` thì người chọn chế độ sáng trên máy đang để chế độ tối sẽ không đổi được.

---

## 5. Ý nghĩa và khả năng tiếp cận

Khoảng **1 trong 12 nam giới** và 1 trong 200 nữ giới có rối loạn sắc giác ở mức nào đó.

### R21 — Không bao giờ dùng riêng màu để truyền đạt ý nghĩa

Màu luôn phải đi kèm chữ, biểu tượng, hoặc hình dạng.

| Sai | Đúng |
|---|---|
| Chấm xanh / chấm đỏ | ✓ Đã qua bài / ✗ Cần làm lại |
| Cột biểu đồ chỉ khác màu | Cột khác màu **kèm** chú giải và nhãn số |

### R22 — Giữ riêng bộ màu trạng thái

Thành công / cảnh báo / lỗi là những màu **dành riêng**. Không mượn chúng làm màu trang trí hay màu chuỗi dữ liệu.

**Vì sao:** nếu màu đỏ vừa nghĩa là "lỗi" vừa là "danh mục C", người dùng sẽ đọc sai thông tin.

---

## 6. Màu cho dữ liệu

Biểu đồ theo luật riêng, không dùng chung với màu giao diện.

### R23 — Chọn thang màu theo loại dữ liệu

| Loại dữ liệu | Thang màu | Ví dụ trong Enghabit |
|---|---|---|
| **Phân loại** (danh mục) | Nhiều sắc độ khác nhau, thứ tự cố định | 4 loại hoạt động |
| **Độ lớn** (nhiều/ít) | **MỘT** sắc độ, sáng dần → đậm dần | Lịch hoạt động cả năm |
| **Hai cực** (âm/dương) | Hai sắc độ, ở giữa là xám trung tính | Tăng / giảm |

**Vì sao:** dùng cầu vồng cho dữ liệu độ lớn khiến người xem không đọc được thứ tự — màu vàng không "lớn hơn" màu xanh theo trực giác nào cả.

### R24 — Thang một sắc phải có độ sáng biến thiên đơn điệu

Kiểm tra bằng công thức luminance, không bằng mắt. Xem [Cách đo](#cách-đo).

### R25 — Thứ tự màu phân loại là cố định, không hoán đổi

Bảng màu phân loại được chọn sao cho **các cặp đứng cạnh nhau** phân biệt được với người mù màu. Đổi thứ tự có thể đưa hai màu khó phân biệt vào cạnh nhau.

Ví dụ: trong bảng đang dùng, cam và vàng không được đứng cạnh nhau.

---

## Bảng đối chiếu bảng màu hiện tại

Đo ngày 31/08/2026, sau khi đổi nền trang sang `#B5B777` và thêm màu tên hệ thống. Chạy lại sau mỗi lần đổi màu.

| Cặp màu | Dùng ở đâu | Sáng | Tối | Ngưỡng |
|---|---|---|---|---|
| `text` / `page` | Chữ chính trên nền trang | 7.56:1 ✓ | 14.90:1 ✓ | 4.5 |
| `text-soft` / `page` | Chữ phụ trên nền trang | 4.75:1 ✓ | 9.29:1 ✓ | 4.5 |
| `text-soft` / `surface` | Chữ phụ trên thẻ | 9.97:1 ✓ | 8.42:1 ✓ | 4.5 |
| `brand-strong` / `page` | Liên kết trên nền trang | 4.65:1 ✓ | 12.66:1 ✓ | 4.5 |
| `on-brand` / `brand` | Chữ trên nút chính | 5.09:1 ✓ | 9.50:1 ✓ | 4.5 |
| `success` / `surface` | Chữ trạng thái thành công | 6.00:1 ✓ | 6.70:1 ✓ | 4.5 |
| `danger` / `surface` | Chữ trạng thái lỗi | 6.02:1 ✓ | 5.79:1 ✓ | 4.5 |
| `accent-ink` / `surface` | Chữ màu nhấn | 6.36:1 ✓ | 9.63:1 ✓ | 4.5 |
| `line-control` / `surface` | Viền ô nhập | 3.15:1 ✓ | 3.34:1 ✓ | 3 |
| Ảnh tên / `page` | Tên ENG//HABIT trên nền hệ thống | 6.83:1 ✓ | 11.61:1 ✓ | 3 |
| Ảnh tên / `surface` | Tên trên thẻ trắng | 14.34:1 ✓ | 10.51:1 ✓ | 3 |
| Ảnh tên / `brand-vivid` | Tên trên panel đăng nhập | 8.00:1 ✓ | 8.00:1 ✓ | 3 |

**Tên hệ thống là ảnh, không phải chữ — nên màu nằm trong file, không nằm trong token.** `fe/public/wordmark.png` là navy `#16255F` của bản thiết kế gốc: màu lạnh, đối lập với nền olive ấm nên tên tách hẳn ra mà không phải phóng to hay tô đậm thêm. Chế độ tối dùng file thứ hai `wordmark-dark.png` cùng hình dáng nhưng đổi sang `#C5CDF2`, vì navy trên nền `#15160F` chỉ còn 1.8:1.

Hệ quả cần nhớ: **đổi bảng màu nền thì phải xuất lại hai file ảnh này**, chúng không tự đổi theo token như phần còn lại của giao diện. Panel đăng nhập luôn sáng ở cả hai chế độ nên ép dùng bản navy (`variant="light"`).

**Cái giá của nền trang có màu.** Nền `#B5B777` sáng vừa (L=59%) chứ không gần trắng, nên mọi chữ đặt trực tiếp lên nó phải đậm hơn hẳn mới đạt 4.5:1. Hệ quả: `--text-soft` và `--text-muted` buộc phải **dùng chung một bậc** — không còn dư địa để phân biệt "chữ phụ" với "chữ mờ" trên nền trang.

Muốn khôi phục ba bậc chữ thì phải làm nền nhạt hơn. Đây là đánh đổi có ý thức, không phải sơ suất.

---

## Cách đo

```js
// Tỷ lệ tương phản theo WCAG 2.x
const rgb = h => { h = h.replace('#',''); return [0,2,4].map(i => parseInt(h.slice(i,i+2),16)); };

const luminance = c => {
  const [r,g,b] = rgb(c).map(v => {
    const x = v / 255;
    return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
  });
  return 0.2126*r + 0.7152*g + 0.0722*b;
};

const contrast = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((p,q) => q - p);
  return (hi + 0.05) / (lo + 0.05);
};

// Kiểm tra thang một sắc có đơn điệu không (R24)
const isMonotonic = ramp => {
  const l = ramp.map(luminance);
  return l.every((v, i) => i === 0 || v < l[i-1]) || l.every((v, i) => i === 0 || v > l[i-1]);
};
```

Với bảng màu phân loại, dùng thêm validator kiểm tra khả năng phân biệt cho người mù màu — không có công thức đơn giản nào thay thế được.

---

## Nguồn

- [WCAG 2.2 — Contrast Minimum (W3C)](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)
- [Material Design 3 — Dark theme](https://m3.material.io/styles/color/roles)
- [The 2026 Engineering Guide to Color & Contrast](https://humbldesign.io/blog-posts/color-accessibility-guide-wcag)
- [Color Token Best Practices for Design Systems](https://designsystemproblems.com/token-management/color-token-best-practices/)
- [12 Principles of Dark Mode Design — Uxcel](https://uxcel.com/blog/12-principles-of-dark-mode-design-627)
- [Color Blindness Statistics](https://colorblind.io/learn/statistics)

Bảng màu dự án: `fe/src/index.css`. Quy ước áp dụng: `CLAUDE.md`.
