# Quy tắc phối màu giao diện

Bộ quy tắc áp dụng khi thiết kế hoặc chỉnh sửa màu trong Enghabit. Đúc từ chuẩn WCAG 2.2, hướng dẫn Material Design và cách các hệ thống thiết kế lớn tổ chức màu.

Mỗi quy tắc có mã (R1, R2...) để tiện trích dẫn trong review code hoặc commit.

> **Quy tắc bao trùm:** phần tương phản là phần **tính ra số được** — đã tính được thì không đoán. Mọi thay đổi màu phải chạy lại bảng đối chiếu ở cuối tài liệu.

---

## 1. Nền tảng

Quyết định cách tổ chức màu, làm trước khi chọn bất kỳ mã màu nào. Sai ở đây thì mọi thứ phía sau đều phải sửa lại.

### R1 — Đặt tên màu theo vai trò, không theo màu

Dùng `--text-primary`, `--surface`, `--action` thay vì `--blue-500`, `--gray-100`.

**Vì sao:** đổi màu thương hiệu hoặc thêm chế độ tối chỉ cần đổi giá trị token, không phải sửa từng component. Tên theo màu sẽ thành nói dối ngay khi `--olive-500` chuyển sang màu xanh dương — đúng chuyện đã xảy ra với dự án này.

### R2 — Chia hai tầng: màu gốc và màu ngữ nghĩa

Tầng gốc là thang màu thô (`blue-100` … `blue-900`). Tầng ngữ nghĩa trỏ vào tầng gốc (`--action: blue-600`). **Component chỉ được dùng tầng ngữ nghĩa.**

**Vì sao:** tách "màu này là gì" khỏi "màu này dùng làm gì", nên đổi một trong hai không kéo theo cái kia.

### R3 — Tách màu thương hiệu khỏi màu chức năng

Màu thương hiệu để nhận diện. Màu chức năng (thành công / cảnh báo / lỗi) để báo trạng thái. **Không lấy màu thương hiệu làm màu "thành công"**, kể cả khi nó màu xanh lá.

**Vì sao:** đổi thương hiệu sang màu đỏ thì mọi thông báo thành công sẽ thành màu đỏ.

### R4 — Không viết mã màu trực tiếp trong component

Thấy `#6090CF` hay `bg-slate-200` trong file component là dấu hiệu token bị thiếu. Bổ sung token, đừng viết cứng.

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

**Ví dụ thật trong dự án:** `#6090CF` với chữ trắng chỉ đạt **3.29:1** — đủ cho ranh giới nút nhưng chưa đạt ngưỡng 4.5:1 của chữ. Hai lối xử lý:

| Cách | Kết quả |
|---|---|
| Dùng bậc đậm hơn `#1E4E8C` cho nút | 8.32:1 với chữ trắng |
| Giữ nguyên `#6090CF`, đổi chữ sang navy-đen `#0F1B2E` | **5.25:1** ← đã chọn |

Cách thứ hai giữ được đúng màu thương hiệu, nên ưu tiên khi có thể. Bảng màu olive trước đây rơi
vào y hệt tình huống này (`#8E9141` chỉ đạt 3.35:1 với chữ trắng) và cũng chọn cách thứ hai.

### R9 — Kiểm tra cả cặp chữ-trên-nền, không chỉ từng màu

Tương phản là thuộc tính của một **cặp** màu. Danh sách token đẹp không đảm bảo gì cả — phải liệt kê từng cặp thực sự xuất hiện cạnh nhau rồi đo.

Đừng quên các cặp ít nghĩ tới: chữ phụ trên nền chìm, nhãn trên nền màu nhạt, chữ ở trạng thái hover, viền ô nhập.

### R10 — Chữ trên nền đặc cần token riêng, tự đảo theo chế độ

Không dùng `text-white` cố định trên nền màu. Tạo token `--on-brand`, `--on-fill`.

**Vì sao:** ở chế độ tối, màu nền thường chuyển sang bậc **sáng**, lúc đó chữ trắng chỉ còn khoảng **1.7:1** — gần như không đọc được. Lỗi này đã xảy ra thật trong dự án.

Lưu ý: brand và status có thể cần token khác nhau. Ở chế độ sáng, xanh thương hiệu là màu sáng vừa (cần chữ tối) trong khi success/danger là màu đậm (cần chữ trắng).

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

Enghabit: nền hệ thống `#E7EFFA` và chữ `#18212E` đều ngả xanh thay vì xám/trắng/đen thuần.

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

Enghabit: brand `#6090CF` (sáng) → `#8FB8EC` (tối).

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

Đo ngày 05/09/2026, sau khi thêm huy chương bạc/đồng cho bảng xếp hạng và nâng bạc lên
bậc sáng hơn. Bảng gốc đo ngày 04/09/2026 khi đổi sang bảng màu **xanh dương pastel** với
nền hệ thống SÁNG `#E7EFFA`. Chạy lại sau mỗi lần đổi màu bằng `node fe/scripts/check-contrast.mjs`.

| Cặp màu | Dùng ở đâu | Sáng | Tối | Ngưỡng |
|---|---|---|---|---|
| `text` / `surface` | Chữ chính trong thẻ | 16.21:1 ✓ | 12.48:1 ✓ | 4.5 |
| `text-soft` / `surface` | Chữ phụ trong thẻ | 7.80:1 ✓ | 8.01:1 ✓ | 4.5 |
| `text-muted` / `surface` | Chữ mờ trong thẻ | 5.26:1 ✓ | 5.20:1 ✓ | 4.5 |
| `text-muted` / `sunken` | Chữ mờ trên vùng chìm | 4.81:1 ✓ | 5.53:1 ✓ | 4.5 |
| `on-page` / `page` | Chữ chính trên nền hệ thống | 13.99:1 ✓ | 14.32:1 ✓ | 4.5 |
| `on-page-soft` / `page` | Mục điều hướng | 7.65:1 ✓ | 9.19:1 ✓ | 4.5 |
| `on-page-muted` / `page` | Nhãn nhóm, chữ mờ ngoài thẻ | 5.19:1 ✓ | 5.96:1 ✓ | 4.5 |
| `on-page-link` / `page` | Liên kết trên nền hệ thống | 6.08:1 ✓ | 8.43:1 ✓ | 4.5 |
| `on-page` / `hover` | Mục điều hướng khi di chuột | 12.58:1 ✓ | 10.30:1 ✓ | 4.5 |
| `brand-strong` / `surface` | Liên kết trong thẻ | 8.32:1 ✓ | 9.40:1 ✓ | 4.5 |
| `brand-strong` / `brand-soft` | Chữ trên nền thương hiệu nhạt | 7.30:1 ✓ | 9.04:1 ✓ | 4.5 |
| `on-brand` / `brand` | Chữ trên nút chính | 5.25:1 ✓ | 8.41:1 ✓ | 4.5 |
| `on-brand` / `brand-vivid` | Chữ trên panel đăng nhập | 10.05:1 ✓ | 10.05:1 ✓ | 4.5 |
| `success` / `surface` | Chữ trạng thái thành công | 5.23:1 ✓ | 6.12:1 ✓ | 4.5 |
| `danger` / `surface` | Chữ trạng thái lỗi | 6.02:1 ✓ | 5.29:1 ✓ | 4.5 |
| `accent-ink` / `surface` | Chữ màu nhấn | 6.36:1 ✓ | 8.81:1 ✓ | 4.5 |
| `accent-ink` / `accent-soft` | Chữ nhấn trên nền nhấn nhạt | 5.82:1 ✓ | 9.00:1 ✓ | 4.5 |
| `on-fill` / `success` | Chữ trên nền thành công | 5.23:1 ✓ | 7.02:1 ✓ | 4.5 |
| `on-fill` / `danger` | Chữ trên nền lỗi | 6.02:1 ✓ | 6.07:1 ✓ | 4.5 |
| `line-control` / `surface` | Viền ô nhập | 3.99:1 ✓ | 4.11:1 ✓ | 3 |
| `brand` / `surface` | Nút chính nổi trên thẻ | 3.29:1 ✓ | 7.35:1 ✓ | 3 |
| `line-on-page` / `page` | Viền khung app (trang trí) | 1.37:1 | 1.48:1 | — |
| `surface` / `page` | Thẻ nổi trên nền hệ thống | 1.16:1 | 1.15:1 | — |
| Ảnh tên / `page` | ENG//HABIT trên nền hệ thống | 12.38:1 ✓ | 11.02:1 ✓ | 3 |
| Ảnh tên navy / `brand-vivid` | ENG//HABIT trên panel đăng nhập | 8.35:1 ✓ | 8.35:1 ✓ | 3 |
| `on-brand` / `accent` | Chữ trên huy hiệu hạng nhất | 8.96:1 ✓ | 8.96:1 ✓ | 4.5 |
| `on-brand` / `rank-silver` | Chữ trên huy hiệu hạng nhì | 7.77:1 ✓ | 10.64:1 ✓ | 4.5 |
| `on-brand` / `rank-bronze` | Chữ trên huy hiệu hạng ba | 4.55:1 ✓ | 4.55:1 ✓ | 4.5 |
| `text-muted` / `rank-silver-soft` | Chữ mờ trên thẻ hạng nhì | 4.64:1 ✓ | 4.54:1 ✓ | 4.5 |
| `text-muted` / `rank-bronze-soft` | Chữ mờ trên thẻ hạng ba | 4.55:1 ✓ | 4.94:1 ✓ | 4.5 |
| `accent` / `surface` | Viền thẻ hạng nhất (mốc đối chiếu) | 1.93:1 | 7.83:1 | — |
| `rank-silver` / `surface` | Viền thẻ hạng nhì | 2.22:1 | 9.29:1 | — |
| `rank-bronze` / `surface` | Viền thẻ hạng ba | 3.79:1 | 3.98:1 | — |

**Huy chương bạc/đồng suýt lặp lại đúng lỗi mà bản pastel từng mắc với `--on-page`.**
Bảng xếp hạng trước đó tô hạng nhì bằng `bg-line-strong text-on-fill` và hạng nhất bằng
`bg-accent text-ink` — nhưng `--on-fill` và `--ink` đều **đổi theo chế độ** trong khi hai
nền huy hiệu đó lại **cố định**. Ghép một cặp cố định với một cặp đổi chiều thì một trong
hai chế độ chắc chắn gãy: đo lại ra 1.59:1 (hạng nhất, chế độ tối) và 1.78–2.23:1 (hạng
nhì, cả hai chế độ) — không đạt nổi cả ngưỡng 3:1 cho viền chứ đừng nói 4.5:1 cho chữ. Lỗi
này chưa từng bị bắt vì cặp `on-brand`/`accent` (hay `on-fill`/`line-strong`) chưa từng có
mặt trong bảng đối chiếu — đúng cảnh báo ở R9: "đừng quên các cặp ít nghĩ tới".

Token `--rank-silver` và `--rank-bronze` sửa việc này bằng cách luôn ghép với `--on-brand`
(chữ tối, **cố định cả hai chế độ**), thay cho `--ink`/`--on-fill` vốn đổi theo chế độ.

**Bạc đổi bậc theo chế độ, đồng thì không** — khác nhau vì bản chất hai màu khác nhau,
không phải tuỳ hứng:

| | Sáng | Tối | Tách khỏi nền bằng |
|---|---|---|---|
| `--accent` (vàng, hạng nhất) | `#EAB22D` | `#EAB22D` | sắc độ |
| `--rank-bronze` (hạng ba) | `#B87333` | `#B87333` | sắc độ |
| `--rank-silver` (hạng nhì) | `#A5AFBB` | `#C4CCD5` | **độ sáng** |

Vàng và đồng **bão hoà**, nên một giá trị dùng được cho cả hai nền: viền vàng hạng nhất chỉ
đạt 1.93:1 trên thẻ trắng mà vẫn nhận ra ngay, vì nó vàng chứ không vì nó đậm. Bạc là màu
**trung tính**, không có sắc độ để dựa vào nên chỉ còn độ sáng — ép một giá trị gánh cả hai
nền là buộc phải chọn mức xám lỡ cỡ: đủ tối để thấy trên nền trắng thì xỉn và không còn ra
chất kim loại trên nền tối. Đây đúng là tình huống R17 mô tả.

Đổi lại, bạc đổi theo chế độ nghĩa là cặp `on-brand`/`rank-silver` **phải đo ở cả hai bậc** —
cả hai đều nằm trong bảng trên (7.77:1 và 10.64:1). Bậc "soft" (nền thẻ) đổi theo chế độ cho
cả bạc lẫn đồng, giống hệt `--accent-soft`.

**Ba hàng viền thẻ để ngưỡng "—" là có chủ ý.** Đây là viền trang trí báo thứ hạng chứ không
phải viền ô nhập liệu, nên WCAG 1.4.11 không áp; đặt ngưỡng 3:1 sẽ đánh trượt ngay chính viền
vàng hạng nhất đang chạy tốt. Nhưng vẫn phải in ra để thấy khi một giá trị tụt quá xa — và
riêng bạc, vì không có sắc độ cứu, **giữ không thấp hơn mốc 1.93:1 của vàng**.

**Vì sao `--brand` không phải màu pastel thật.** `#6090CF` là bậc **sáng nhất** của sắc xanh này còn đạt 3:1 trên thẻ trắng. Pastel nhạt hơn — ví dụ `#7BA7DB` — chỉ đạt 2.50:1, nghĩa là ranh giới nút chìm vào thẻ và vi phạm R6. Cảm giác pastel của giao diện đến từ **nền hệ thống** `#E7EFFA`, tức mảng 60% lớn nhất theo R11, chứ không phải từ màu nút.

**Thẻ tách khỏi nền bằng viền, không bằng độ sáng.** `surface`/`page` chỉ còn 1.16:1 (thời nền mận là 8.26:1) vì cả hai giờ đều sáng. Đây là điều bình thường ở giao diện nền sáng, nhưng có hệ quả bắt buộc: **mọi thẻ phải có `border-line`**, không được chỉ dựa vào bóng đổ. Bỏ viền là thẻ tan vào nền.

**Vẫn giữ HAI bộ chữ dù nay cùng chiều.** Ở bảng màu mận trước đây, nền hệ thống tối còn thẻ trắng nên hai bộ token bắt buộc ngược nhau. Giờ cả hai nền đều sáng nên `content` và `on-page` cùng chiều — nhưng **không gộp làm một**:

| Bộ token | Dùng cho | Chế độ sáng | Chế độ tối |
|---|---|---|---|
| `content` (`--text*`) | Chữ **trong thẻ** (nền `#FFFFFF`) | tối | sáng |
| `on-page` (`--on-page*`) | Chữ **ngoài thẻ**: sidebar, thanh trên cùng, tiêu đề trang (nền `#E7EFFA` / `#141B26`) | tối | sáng |

Hai nền vẫn khác độ sáng nên bậc chữ mờ không dùng chung được, và ở chế độ tối nền hệ thống còn **tối hơn** thẻ — ngược chiều với chế độ sáng. Gộp hai bộ là mở đường cho lỗi im lặng ở lần đổi màu sau.

**Tên hệ thống là ảnh nên màu nằm trong file, không nằm trong token.** Nền hệ thống giờ **sáng ở chế độ sáng và tối ở chế độ tối**, nên khung app không dùng cố định một bản như thời nền mận — `Wordmark` nhận `on="auto"`, vẽ cả hai ảnh rồi để CSS ẩn bớt một theo đúng bộ selector của token (xem `fe/src/index.css`). Panel đăng nhập vẫn `on="light"` vì nền ở đó luôn sáng.

Hai file ảnh giữ nguyên, **không cần chạy lại** `fe/scripts/make-wordmark.py`: bản navy `#16255F` đạt 12.38:1 trên nền pastel sáng, bản nhạt `#C5CDF2` đạt 11.02:1 trên nền navy tối. Chỉ phải xuất lại nếu đổi màu chữ của chính tên hệ thống.

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
