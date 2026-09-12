# ENG//HABIT — Lộ trình phát triển hệ thống

> Tài liệu này liệt kê các tính năng cần phát triển thêm, mối liên kết của từng hạng mục
> với phần hệ thống đã có, và thứ tự thực hiện.
>
> Khảo sát mã nguồn ngày **05/09/2026**. Mọi nhận định về hiện trạng đều dẫn tới file cụ
> thể để kiểm chứng lại được — phần nào không tìm thấy bằng chứng trong mã nguồn thì ghi
> rõ là đề xuất, không trộn lẫn với hiện trạng.

---

## 1. Hiện trạng — mốc để so sánh

| Hạng mục | Số liệu |
|---|---|
| Model trong Prisma | 27 |
| Module backend | 14 (`be/src/modules/`) |
| Feature frontend | 14 (`fe/src/features/`) |
| Màn hình có URL riêng | 19 (`fe/src/routes/AppRoutes.tsx`) |
| Dòng mã nguồn | 20.948 (`be` 5.862 · `fe` 12.427 · `shared` 2.659) |
| File test | 8 |
| Ứng dụng di động | **chưa khởi tạo** |

Hệ thống đã chạy được trọn vẹn ba nhóm chức năng chính: **học** (chủ đề, từ vựng,
flashcard SM-2, bài học, quiz, ôn lỗi sai), **duy trì thói quen** (mục tiêu, thói quen,
điểm danh, chuỗi ngày, vật phẩm giữ chuỗi, nhiệm vụ ngày), và **theo dõi** (thống kê,
báo cáo khoảng tự chọn, bảng xếp hạng, cộng đồng hỏi đáp, khu quản trị 5 màn).

Vì vậy lộ trình dưới đây **không bắt đầu bằng việc thêm tính năng mới**. Khảo sát cho
thấy có những thứ đã xây gần xong nhưng chưa chạy thật, và đó mới là chỗ đáng làm trước.

---

## 2. Ba phát hiện quyết định thứ tự ưu tiên

### 2.1 Toàn bộ tính năng nhắc nhở đang TẮT trên môi trường thật

`render.yaml` ghi rõ:

```yaml
#   ENABLE_REMINDER_JOB=false   gói free bị ngủ khi không có request nên cron không đáng tin
```

Nghĩa là cron trong `be/src/jobs/reminder.job.ts` **không chạy trên production**. Người
dùng thật không bao giờ nhận được lời nhắc học, cảnh báo chuỗi sắp đứt hay chúc mừng đạt
mục tiêu. Đồng thời `be/src/jobs/streak-freeze.job.ts` cũng nằm trong cùng tiến trình —
tức **vật phẩm giữ chuỗi người dùng mua cũng không được tiêu tự động**.

Đây là hạng mục có khoảng cách lớn nhất giữa "đã lập trình" và "người dùng nhận được".

### 2.2 Push notification thiếu đúng mắt xích cuối cùng

Backend đã xây đủ:

| Thành phần | Trạng thái |
|---|---|
| Model `UserDevice` | có (`be/prisma/schema.prisma`) |
| Endpoint `POST /notifications/devices` | có (`notification.routes.ts:149`) |
| Endpoint `DELETE /notifications/devices/:playerId` | có (`notification.routes.ts:158`) |
| `sendPush()` được cron gọi | có (`reminder.job.ts:234`) |
| Biến môi trường `ONESIGNAL_APP_ID`, `ONESIGNAL_API_KEY` | có (`be/.env.example`) |
| **Frontend gọi `/notifications/devices`** | **không có** |

Tìm toàn bộ `fe/src` không thấy một lần nào gọi tới endpoint này, cũng không có SDK
OneSignal hay service worker. Hệ quả: bảng `user_devices` luôn rỗng → `playerIds` truyền
vào `sendPush` luôn là mảng rỗng → **chưa từng có một push nào được gửi tới ai**.

Phần khó (cron, chống trùng bằng `dedupeKey`, lọc người đã học trong ngày) đã xong. Phần
còn thiếu là đoạn đăng ký thiết bị ở trình duyệt.

### 2.3 Không có giới hạn số lần đăng nhập sai

`be/src/app.ts` đã dùng `helmet()` và `cors()` nhưng **không có rate limit** nào. Trong
khi đó hệ thống đã có sẵn bảng `LoginEvent` ghi lại từng lần đăng nhập thất bại kèm IP —
tức đã **quan sát** được tấn công dò mật khẩu nhưng không **chặn** được.

Dữ liệu để chặn đã nằm sẵn trong DB, chỉ thiếu tầng chặn.

---

## 3. Danh mục tính năng cần phát triển

Mỗi hạng mục ghi rõ nó **nối vào đâu** trong hệ thống hiện có, vì phần lớn không phải xây
mới từ đầu mà là nối tiếp thứ đã có.

### Nhóm A — Làm cho thứ đã xây chạy được thật

#### A1. Đưa cron nhắc nhở lên chạy thật trên production

| | |
|---|---|
| **Liên kết** | `be/src/jobs/reminder.job.ts`, `be/src/jobs/streak-freeze.job.ts`, `render.yaml`, bảng `reminders`, `notification_settings` |
| **Việc phải làm** | Tách phần thân cron thành một endpoint nội bộ được bảo vệ bằng khoá bí mật (ví dụ `POST /internal/jobs/run` kèm header `X-Job-Secret`), rồi để một bộ lập lịch **bên ngoài** gọi định kỳ — GitHub Actions `schedule` hoặc dịch vụ cron miễn phí. Giữ nguyên toàn bộ logic bên trong. |
| **Vì sao không đơn giản là bật cờ lên** | Gói free của Render **ngủ khi không có request**. Tiến trình ngủ thì `setInterval` không chạy. Bật `ENABLE_REMINDER_JOB=true` chỉ tạo ảo giác đã bật, thực tế vẫn không đều. Phải có tác nhân từ bên ngoài đánh thức. |
| **Ràng buộc bắt buộc giữ** | CLAUDE.md quy định **lịch gửi chỉ do `be/src/jobs` quyết định**, OneSignal chỉ là kênh gửi. Cách làm trên vẫn tôn trọng điều đó: bộ lập lịch ngoài chỉ **kích hoạt**, còn *ai được nhắc, nhắc nội dung gì, đã nhắc chưa* vẫn do job quyết. Tuyệt đối không chuyển sang dùng tính năng tự lên lịch của OneSignal. |
| **Rủi ro** | Endpoint nội bộ bị lộ thì người ngoài spam gọi được. Giảm thiểu bằng khoá bí mật dài + chính `dedupeKey` sẵn có (gọi mười lần vẫn chỉ sinh một thông báo). |
| **Ước lượng** | 1–2 ngày |

#### A2. Đăng ký thiết bị nhận push ở frontend

| | |
|---|---|
| **Liên kết** | Nối thẳng vào `POST/DELETE /notifications/devices` đã có; model `UserDevice`; màn `/notifications` và trang cá nhân |
| **Việc phải làm** | Nhúng SDK OneSignal Web, xin quyền thông báo **đúng lúc** (sau khi người dùng đặt lời nhắc đầu tiên, không phải ngay khi vừa vào app), lấy `playerId` rồi gọi endpoint đã có. Thêm công tắc bật/tắt push trong màn cấu hình thông báo, gọi `DELETE` khi tắt. |
| **Phụ thuộc** | **Phải làm sau A1.** Đăng ký thiết bị trong khi cron chưa chạy thì người dùng bật quyền thông báo rồi vĩnh viễn không nhận gì — trải nghiệm còn tệ hơn không có nút. |
| **Ràng buộc bắt buộc giữ** | Thông báo vẫn **luôn ghi vào bảng `notifications` trước**, push chỉ là kênh báo thêm. Không được vì có push mà bỏ bản ghi trong DB. |
| **Ước lượng** | 2–3 ngày |

#### A3. Giới hạn tần suất đăng nhập

| | |
|---|---|
| **Liên kết** | `be/src/app.ts`, `be/src/modules/auth/`, bảng `LoginEvent` (đã ghi sẵn IP và số lần thất bại) |
| **Việc phải làm** | Thêm `express-rate-limit` cho nhóm `/auth/login` và `/auth/register`. Mức chặt hơn cho login. Cân nhắc khoá tạm theo cặp (IP, email) dựa trên `LoginEvent` đã có. |
| **Vì sao đáng làm sớm** | Rẻ (nửa ngày) và là lỗ hổng bảo mật thật, không phải cải tiến hình thức. Với đồ án, đây cũng là một mục dễ trình bày trong chương "an toàn hệ thống". |
| **Ước lượng** | 0,5 ngày |

### Nhóm B — Hoàn thiện vòng đời tài khoản

> **Đã làm một phần (05/09/2026).** Luồng quên mật khẩu **có quản trị viên duyệt tay**
> đã xong: người dùng tự gửi yêu cầu và tự đặt mật khẩu mới, quản trị viên duyệt hoặc
> từ chối ở `/admin/requests`. Endpoint `POST /admin/users/:id/reset-password` (quản trị
> viên đặt mật khẩu tạm hộ) đã **bị gỡ bỏ** để không có hai đường làm cùng một việc.
> Chi tiết: `docs/luong-quen-mat-khau.md`.
>
> Hạng mục B1 dưới đây vì vậy **không còn là "chưa có gì"** mà là **nâng cấp**: bỏ khâu
> duyệt tay, thay bằng liên kết gửi qua email. Lý do vẫn đáng làm nằm ở mục 6.1 của tài
> liệu luồng — lượt duyệt hiện gắn với *tài khoản*, không gắn với người đã chứng minh
> được danh tính, nên quản trị viên phải xác minh ngoài hệ thống trước khi bấm duyệt.

#### B1. Nâng quên mật khẩu lên luồng gửi mã qua email

| | |
|---|---|
| **Liên kết** | `be/src/modules/auth/password-reset.service.ts` (đã có, thay ruột), bảng `password_reset_requests`, `RefreshToken` |
| **Việc phải làm** | Theo đúng checklist mục 7.1 + 7.3 của `docs/luong-quen-mat-khau.md` — file đó liệt kê sẵn giữ gì, xoá gì. Tóm tắt: đổi bảng sang lưu token băm có hạn, `request` luôn trả 200 (không lộ tài khoản), xoá 3 endpoint quản trị và màn `AdminRequestsPage`. **Giữ nguyên** quy tắc thu hồi refresh token sau khi đổi mật khẩu. |
| **Phụ thuộc mới** | Cần một dịch vụ gửi email (Resend / Brevo gói free). Đây là **phụ thuộc bên ngoài đầu tiên ngoài OneSignal**, nên tách thành `be/src/lib/mailer.ts` để B2 dùng lại. |
| **Ước lượng** | 2–3 ngày (rẻ hơn ước lượng ban đầu vì phần giao diện và quy tắc nghiệp vụ đã có sẵn; phần lớn công là dựng hạ tầng email) |

#### B2. Xác thực địa chỉ email khi đăng ký

| | |
|---|---|
| **Liên kết** | Dùng lại hạ tầng email của B1; thêm cột `emailVerifiedAt` vào `User` |
| **Việc phải làm** | Gửi thư xác thực sau đăng ký; chặn một số hành vi khi chưa xác thực. **Nên chặn có chọn lọc**: vẫn cho học bình thường, chỉ chặn đăng bài ở Cộng đồng — chặn hết ngay từ đầu sẽ làm người dùng mới bỏ đi trước khi thấy giá trị của app. |
| **Phụ thuộc** | Sau B1 |
| **Ước lượng** | 1–2 ngày |

### Nhóm C — Bảo chứng chất lượng trước khi mở rộng

#### C1. Test cho tầng service của backend

| | |
|---|---|
| **Hiện trạng** | 8 file test, **toàn bộ nằm ở `shared/`** (SM-2, streak, level, rewards, report, attachment, avatar) cộng 1 test i18n ở FE. **Không có một test nào cho `be/src/modules/`**, dù CLAUDE.md quy định "test đặt cạnh file nguồn trong cùng thư mục module". |
| **Nguy cơ cụ thể** | Phần thuật toán thuần đã được bảo vệ tốt, nhưng phần **ghép thuật toán với cơ sở dữ liệu** thì không. Đây đúng là chỗ đã từng phát sinh lỗi thật trong quá trình phát triển: chống nhận thưởng trùng bằng ràng buộc `@@unique`, `local_date` theo múi giờ người dùng, `recompute-streak` phải đọc cả `streak_freezes`. Ba chỗ này sai thì **âm thầm sai số liệu**, không văng lỗi. |
| **Việc phải làm** | Ưu tiên đúng bốn service theo thứ tự rủi ro: `rewards` (dính tới xu, nhận trùng là mất tiền ảo), `statistics` + `recompute-streak` (sai là sai toàn bộ con số người dùng nhìn thấy), `leaderboard`, `notifications`. Dùng CSDL test riêng, không dùng chung DB dev. |
| **Vì sao đặt trước nhóm D** | Nhóm D nhân đôi bề mặt hệ thống (thêm ứng dụng di động, thêm dạng bài). Mở rộng trên nền không có test là cách chắc chắn để lỗi cũ tái phát mà không ai biết. |
| **Ước lượng** | 4–5 ngày |

#### C2. Thống nhất tên module giữa frontend và backend

| | |
|---|---|
| **Hiện trạng** | CLAUDE.md quy định tên feature/module phải **giống hệt nhau giữa `fe` và `be`**. Thực tế đang lệch: FE có `vocabulary` và `profile`, BE có `topics` và `activity-logs`. Đã kiểm chứng: `fe/src/features/vocabulary/vocabulary.api.ts` gọi tới `/topics`. |
| **Việc phải làm** | Chọn một tên cho mỗi cặp rồi đổi cả hai phía. Đây là việc đổi tên thuần, không đổi hành vi. |
| **Mức ưu tiên** | Thấp — không ảnh hưởng người dùng. Nhưng nên làm **trước khi khởi tạo mobile**, vì mobile sẽ nhân bản cấu trúc thư mục này lần thứ ba; sửa lúc có hai app rẻ hơn lúc có ba. |
| **Ước lượng** | 0,5 ngày |

### Nhóm D — Mở rộng năng lực học

#### D1. Luyện nghe — chép chính tả

| | |
|---|---|
| **Liên kết** | Cột `Vocabulary.audioUrl` **đã có trong DB và đã phát được** (`fe/src/features/lessons/components/AudioButton.tsx`). Ghi kết quả vào `ActivityLog` như mọi hoạt động học khác. |
| **Việc phải làm** | Dạng bài mới: phát âm thanh, người học gõ lại từ nghe được. Chấm bằng so khớp chuỗi có bỏ qua khác biệt nhỏ. |
| **Vì sao đáng làm** | Hệ thống hiện chỉ kiểm tra **nhận biết mặt chữ** (trắc nghiệm, lật thẻ). Bổ sung kênh nghe là mở rộng thật về mặt sư phạm, không phải thêm màn hình cho nhiều. Chi phí thấp vì hạ tầng âm thanh đã có. |
| **Ràng buộc bắt buộc giữ** | Kết quả phải ghi vào `ActivityLog` với `local_date` tính theo múi giờ người dùng — nếu không, hoạt động này không được tính vào streak và thống kê. |
| **Ước lượng** | 3–4 ngày |

#### D2. Dạng câu hỏi điền từ

| | |
|---|---|
| **Liên kết** | `QuizQuestion` hiện lưu `options` (JSON) + `correctIndex` — **chỉ hỗ trợ trắc nghiệm**. Cần thêm cột phân loại dạng câu hỏi. |
| **Việc phải làm** | Thêm `questionType` vào `QuizQuestion`, cho phép `correctIndex` rỗng với dạng điền từ và thêm trường đáp án dạng chữ. Cập nhật màn quản trị nội dung. |
| **Lưu ý về dữ liệu cũ** | Phải có giá trị mặc định cho toàn bộ câu hỏi đang có, nếu không migration sẽ hỏng dữ liệu seed. |
| **Ước lượng** | 2–3 ngày |

#### D3. Gợi ý nội dung ôn theo điểm yếu

| | |
|---|---|
| **Liên kết** | Model `Mistake` **đã có và đã dùng** — `/lessons/mistakes`, `/lessons/mistakes/count`, `/lessons/mistakes/practice` đều đã chạy. Hiện mới chỉ *liệt kê* lỗi sai. |
| **Việc phải làm** | Từ `Mistake` gom theo chủ đề để chỉ ra người học yếu mảng nào, rồi gợi ý bài học/bộ thẻ tương ứng ngay trên màn Tổng quan. |
| **Vì sao hợp với đề tài** | Đề tài là **xây dựng thói quen**, mà rào cản lớn của việc duy trì là "không biết hôm nay nên học gì". Đây là tính năng dùng dữ liệu đã có sẵn để trả lời đúng câu hỏi đó. |
| **Ước lượng** | 2–3 ngày |

### Nhóm E — Ứng dụng di động

#### E1. Khởi tạo ứng dụng React Native (Expo)

| | |
|---|---|
| **Liên kết** | CLAUDE.md đã chốt sẵn công nghệ (Expo + NativeWind) và quy ước thư mục `mobile/` dùng **cùng tên feature** với `fe`/`be`. Toàn bộ `shared/` (SM-2, streak, level, rewards, schema Zod) dùng lại được ngay. |
| **Việc phải làm** | Khởi tạo Expo, cấu hình NativeWind, dựng luồng đăng nhập và ba màn cốt lõi (Tổng quan, Ôn tập, Điểm danh). Không cần chép lại toàn bộ 19 màn của web. |
| **Cảnh báo kỹ thuật đã được ghi trước trong CLAUDE.md** | Metro không resolve mã nguồn TypeScript qua symlink của workspace nếu không cấu hình thêm — đây chính là lý do `shared/` phải build ra `dist/` và mọi app import từ bản build. Quy ước này đã có sẵn nên mobile hưởng lợi ngay, **miễn là không import thẳng file `.ts` nguồn**. |
| **Phụ thuộc** | Nên sau C1 (có test) và C2 (tên module đã thống nhất) |
| **Ước lượng** | 7–10 ngày |

#### E2. Push notification trên di động

| | |
|---|---|
| **Liên kết** | Dùng lại **nguyên vẹn** backend của A1 + A2: cùng endpoint `/notifications/devices`, cùng model `UserDevice`, cùng cron. Chỉ khác cách lấy `playerId` (dùng `expo-notifications`). |
| **Vì sao rẻ** | Đây là phần thu lợi từ việc A1/A2 làm đúng ngay từ đầu — không phải xây lại gì ở backend. |
| **Ước lượng** | 1–2 ngày |

---

## 4. Lộ trình theo giai đoạn

```
Giai đoạn 1        Giai đoạn 2        Giai đoạn 3        Giai đoạn 4        Giai đoạn 5
CHẠY THẬT          TÀI KHOẢN          CHẤT LƯỢNG         MỞ RỘNG HỌC        DI ĐỘNG
~4 ngày            ~6 ngày            ~5 ngày            ~9 ngày            ~11 ngày

A1 cron ─────┐     B1 quên mật khẩu   C1 test service    D1 luyện nghe      E1 Expo
A2 push FE ◄─┘     B2 xác thực email  C2 thống nhất tên  D2 điền từ         E2 push mobile
A3 rate limit                                            D3 gợi ý ôn tập         ▲
   │                                        │                                   │
   └────────────────────────────────────────┴───────────────────────────────────┘
        A2 phải xong thì E2 mới dùng lại được backend push
        C1+C2 nên xong trước khi mở thêm app thứ ba
```

| Giai đoạn | Mục tiêu | Hạng mục | Ước lượng |
|---|---|---|---|
| **1** | Thứ đã lập trình phải đến được tay người dùng | A1, A2, A3 | ~4 ngày |
| **2** | Người dùng tự quản lý được tài khoản | B1, B2 | ~6 ngày |
| **3** | Có lưới an toàn trước khi mở rộng | C1, C2 | ~5 ngày |
| **4** | Mở rộng chiều sâu việc học | D1, D2, D3 | ~9 ngày |
| **5** | Mở rộng nền tảng | E1, E2 | ~11 ngày |

**Tổng ước lượng: khoảng 35 ngày công.** Đây là ước lượng thô cho một người làm, chưa
trừ thời gian viết báo cáo.

### Vì sao thứ tự này

1. **Giai đoạn 1 trước tiên vì tỷ lệ giá trị trên công sức cao nhất.** Ba hạng mục này
   không thêm dòng tính năng nào vào danh sách, nhưng biến một mảng chức năng lớn từ
   "có trong mã nguồn" thành "người dùng thật sự nhận được". Với đồ án, phần nhắc nhở
   thông minh là điểm nhấn của đề tài **xây dựng thói quen** — mà nó đang tắt.

2. **Giai đoạn 3 chen vào giữa, trước mở rộng.** Xu hướng tự nhiên là làm tính năng mới
   trước rồi viết test sau. Nhưng nhóm D và E **nhân đôi bề mặt hệ thống**; các quy tắc
   dễ vỡ nhất (chống nhận trùng, `local_date` theo múi giờ, `recompute-streak` phải đọc
   `streak_freezes`) đều thuộc loại **sai âm thầm** — không văng lỗi, chỉ ra số sai. Bốn
   ngày viết test rẻ hơn nhiều so với việc dò một con số thống kê lệch trên ba nền tảng.

3. **Mobile để cuối cùng.** Đây là hạng mục tốn công nhất và phụ thuộc vào nhiều thứ
   nhất. Làm sớm sẽ phải sửa song song ở hai nơi mỗi lần backend thay đổi.

### Nếu thời gian bị cắt ngắn

Theo thứ tự buông bỏ, buông từ dưới lên:

| Ưu tiên | Hạng mục | Lý do |
|---|---|---|
| Không thể bỏ | Giai đoạn 1 | Tính năng cốt lõi của đề tài đang không chạy thật |
| Nên giữ | C1 (test service) | Bảo vệ đúng phần dễ sai âm thầm |
| Giữ nếu có thể | B1 (quên mật khẩu) | Thiếu là hệ thống không dùng thật được |
| Bỏ được | D2, D3, E1, E2 | Là mở rộng, không phải khiếm khuyết |

Nếu buộc phải bỏ Giai đoạn 5, nên ghi rõ trong báo cáo rằng cấu trúc `shared/` đã được
thiết kế sẵn cho việc này (thuật toán dùng chung đã tách, quy ước build `dist/` đã có) —
đó là một luận điểm về **kiến trúc**, khác hẳn với việc đơn giản là chưa làm.

---

## 5. Bảng liên kết: hạng mục mới nối vào đâu

| Hạng mục mới | Dùng lại thứ đã có | Phải sửa/thêm |
|---|---|---|
| A1 cron production | `reminder.job.ts`, `streak-freeze.job.ts` nguyên vẹn | endpoint kích hoạt + bộ lập lịch ngoài |
| A2 push web | `POST /notifications/devices`, `UserDevice`, `sendPush` | SDK + màn xin quyền ở FE |
| A3 rate limit | `LoginEvent` (đã ghi IP, lần thất bại) | middleware ở `app.ts` |
| B1 quên mật khẩu | `RefreshToken` (cơ chế thu hồi đã có ở `admin.service.ts`) | bảng token, 2 endpoint, hạ tầng email |
| B2 xác thực email | hạ tầng email của B1 | cột `emailVerifiedAt` |
| C1 test service | `shared/` đã có test làm mẫu | CSDL test riêng |
| D1 luyện nghe | `Vocabulary.audioUrl`, `AudioButton`, `ActivityLog` | dạng bài mới |
| D2 điền từ | `QuizQuestion` | cột `questionType`, migration có giá trị mặc định |
| D3 gợi ý ôn tập | `Mistake` + 3 endpoint đã chạy | tầng gom nhóm & gợi ý |
| E1 mobile | **toàn bộ `shared/`**, mọi API hiện có | app Expo mới |
| E2 push mobile | **toàn bộ backend push của A1+A2** | chỉ đoạn lấy `playerId` |

Cột giữa cho thấy điểm đáng nói nhất về mặt kiến trúc: **không hạng mục nào phải xây lại
từ đầu.** Các quy ước đặt ra sớm — `ActivityLog` là nguồn sự thật duy nhất, thuật toán
dùng chung nằm trong `shared/`, lịch gửi tập trung ở `be/src/jobs` — đang cho phép mở rộng
bằng cách nối thêm, không phải bằng cách viết lại.

---

## 6. Tiêu chí coi là hoàn thành

Mỗi hạng mục chỉ tính là xong khi đủ các điều kiện chung của dự án:

- [ ] Có đủ cặp `be/src/modules/<feature>` và `fe/src/features/<feature>` cùng tên
- [ ] Backend theo đúng luồng `routes → controller → service → schema → Prisma`
- [ ] Màn hình mới làm đủ 6 bước trong CLAUDE.md: route + guard, breadcrumb, `t()` và
      bản dịch tiếng Anh, nhãn thống nhất ba nơi, đúng bộ token màu, chạy kiểm tra
- [ ] Hoạt động học có ghi `ActivityLog` với `local_date` đúng múi giờ người dùng
- [ ] Thông báo tự động có `dedupeKey`
- [ ] Đổi schema qua `prisma migrate`, không sửa tay
- [ ] `pnpm --filter @enghabit/fe check:i18n` và `typecheck` đều sạch
- [ ] Đổi màu thì chạy lại `node fe/scripts/check-contrast.mjs` và cập nhật bảng trong
      `docs/color-rules.md`
