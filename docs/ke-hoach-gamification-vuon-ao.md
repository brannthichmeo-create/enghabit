# Kế hoạch tích hợp Gamification — Virtual Garden

> Tài liệu nghiên cứu và lập kế hoạch. **Chưa viết code.**
>
> Khảo sát mã nguồn ngày 11/09/2026. Mọi nhận định về hiện trạng đều dẫn tới file cụ thể
> để kiểm chứng lại được.

---

## 1. Executive Summary

**Kết luận quan trọng nhất: khoảng 40% hệ thống bạn mô tả đã tồn tại, đã chạy và đã có test.**

Module `rewards` hiện có đầy đủ điểm danh hằng ngày, ba nhiệm vụ ngày, sổ cái xu chống
trùng, và vật phẩm giữ chuỗi. Nghĩa là **mục 2 (Daily Check-in), mục 3 (Mission) và mục 4
(Coin) của đề bài phần lớn đã xong** — việc cần làm ở đó là *mở rộng*, không phải *xây mới*.

Phần thật sự mới chỉ có ba khối: **Plant, Garden, Growth**.

Ba phát hiện kiến trúc định hình toàn bộ kế hoạch:

1. **`recordActivity` là phễu duy nhất** cho mọi hoạt động học (4 module gọi vào). Không
   cần event bus — chỗ móc Growth đã nằm sẵn ở đó.
2. **Sổ cái xu đã đạt yêu cầu audit của mục 13.** `@@unique([userId, dedupeKey])` là thứ
   chống nhận trùng; số dư là `SUM(amount)`, không có cột số dư. Không phải làm lại.
3. **Kinh tế xu hiện tại gần như KHÔNG CÓ ĐẦU RA.** Đây là lý lẽ mạnh nhất ủng hộ tính
   năng này — xem mục 13.

---

## 2. Current System Analysis

### 2.1 Frontend

| Hạng mục | Hiện trạng |
|---|---|
| Framework | React + Vite + TypeScript |
| Kiến trúc | `fe/src/features/<feature>/{components,*.api.ts,*.hooks.ts}` |
| Routing | React Router, guard `Learner` / `Admin` / `Feature` trong `AppRoutes.tsx` |
| State | TanStack Query (server state) + Zustand (`auth.store`) |
| Tầng API | `shared/lib/api-client.ts` (axios), mỗi feature một `*.api.ts` |
| Hệ UI | `shared/components/ui.tsx` — `Button Card PageHeader SectionTitle Field Input Select ErrorMessage EmptyState Skeleton SkeletonList Badge ProgressBar` |
| Hộp thoại | `shared/components/Modal.tsx`, `ConfirmDialog`, `Toast` |
| Hệ màu | Token RGB trong `index.css`, quy tắc ở `docs/color-rules.md` |
| Đa ngôn ngữ | `t()` với khoá là câu tiếng Việt, `en.ts` |
| Biểu đồ | `TrendChart.tsx` (biểu đồ cột theo ngày), `ActivityCalendar.tsx` |

**Dùng lại được ngay:** toàn bộ hệ UI, Modal, Toast, ProgressBar, hệ màu, i18n.

### 2.2 Backend

| Hạng mục | Hiện trạng |
|---|---|
| Framework | Express + TypeScript |
| Kiến trúc | `routes → controller → service → schema (Zod ở shared) → Prisma` |
| Auth | JWT tự triển khai, `requireAuth` |
| Phân quyền | `requireRole(UserRole.USER)` cho module học, `requireRole(ADMIN)` cho `/admin/*` |
| Tầng repository | **Không có** — service gọi thẳng Prisma. Đúng với quy mô dự án. |
| Lỗi | `AppError` + `error-handler` middleware, có `requestId` |
| Cron | `be/src/jobs/` — `reminder.job.ts`, `streak-freeze.job.ts` |

### 2.3 Database — những gì đã có

29 model. Liên quan trực tiếp tới gamification:

| Model | Vai trò | Dùng lại được? |
|---|---|---|
| `ActivityLog` | **Nguồn sự thật duy nhất** cho mọi hoạt động học | Có — nguồn của Growth |
| `CoinTransaction` | Sổ cái xu, có `dedupeKey` unique | **Có — không làm lại** |
| `UserStreak` | Cache streak, dẫn xuất từ `ActivityLog` | Có |
| `StreakFreeze` | Vật phẩm giữ chuỗi | Có |
| `User` | Có `timezone` — bắt buộc cho mọi phép tính ngày | Có |
| `Habit`, `Goal` | Thói quen, mục tiêu | Có — nguồn nhiệm vụ |
| `Topic`, `Vocabulary`, `LessonProgress`, `ExamAttempt`, `Mistake` | Nội dung học | Có |
| `Notification` | Thông báo, có `dedupeKey` | Có |

### 2.4 Module `rewards` — đã có gì

`shared/src/rewards/rewards.ts`:

```
DAILY_CHECKIN_REWARD = 50
STREAK_FREEZE_PRICE  = 200
MAX_STREAK_FREEZES   = 3

DAILY_MISSIONS = [
  LEARN_VOCAB        Học 5 từ mới       VOCAB_LEARNED        target 5   thưởng 20
  REVIEW_FLASHCARDS  Ôn 10 thẻ          FLASHCARD_REVIEWED   target 10  thưởng 20
  DO_HABIT           Check-in 1 thói quen  HABIT_CHECKIN     target 1   thưởng 20
]
```

`be/src/modules/rewards/rewards.service.ts`: `getRewardsSummary`, `checkIn`, `claimMission`,
`buyStreakFreeze`, `consumeFreezeIfNeeded`, `getCoinBalance`.

Endpoint: `GET /rewards`, `POST /rewards/check-in` (và claim/mua trong cùng router).

Giao diện: `fe/src/features/rewards/components/RewardsBar.tsx`.

**Bốn nguyên tắc đã cài sẵn** (CLAUDE.md ghi là bắt buộc giữ):

1. Điểm danh và nhận thưởng **không ghi `ActivityLog`** — nếu ghi, bấm một nút là đủ giữ
   streak và mọi thống kê học tập nói dối.
2. Thưởng bằng **xu**, không bằng XP. XP suy ra từ `ActivityLog` nên không tặng thêm được.
3. Chống nhận trùng bằng **ràng buộc DB**, không bằng đọc-rồi-ghi.
4. Tiến độ nhiệm vụ **không lưu ở đâu cả** — chấm lại từ `ActivityLog` mỗi lần đọc, và
   chấm lại lần nữa ở backend khi nhận thưởng (không tin số FE gửi lên).

### 2.5 Điểm móc tích hợp — phát hiện quan trọng

```
lesson.service.ts  ─┐
exam.service.ts    ─┤
flashcard.service.ts┼──> recordActivity()  ──> ActivityLog + UserStreak (1 transaction)
habit.service.ts   ─┘
```

**Chỉ một hàm.** Mọi hoạt động học đi qua `recordActivity` trong
`be/src/modules/activity-logs/activity-log.service.ts`, và nó đã nhận `tx` để ghi chung
transaction với thao tác khác.

Hệ quả: **không cần event bus, không cần queue.** Chi tiết ở mục 11.

### 2.6 Vấn đề phát hiện trong kiến trúc hiện tại (không tự sửa)

| Vấn đề | Ảnh hưởng tới gamification |
|---|---|
| `ActivityType` chỉ có 4 giá trị: `VOCAB_LEARNED`, `FLASHCARD_REVIEWED`, `QUIZ_COMPLETED`, `HABIT_CHECKIN` | Nhiệm vụ "Listening", "Reading", "học 30 phút" trong đề bài **không có dữ liệu để chấm**. Xem mục 21. |
| Không có nhật ký thao tác quản trị | Nếu sau này admin tặng xu, không truy được ai tặng |
| Quiz không có màn quản trị (API có, giao diện không) | Cảnh báo: đừng lặp lại lỗi này với Plant catalog |

---

## 3. Gamification Research

### 3.1 Khảo sát các mô hình

| Sản phẩm | Cơ chế lõi | Vì sao giữ chân | Điểm gây mệt |
|---|---|---|---|
| **Duolingo** | Streak + XP + Gem + League + Streak Freeze | Streak tạo "chuỗi không muốn làm đứt" (loss aversion). Freeze giảm cảm giác mất trắng. | League ghép cặp ngẫu nhiên tạo áp lực thi đua; quảng cáo streak gây tội lỗi |
| **Forest** | Trồng một cây **mỗi phiên tập trung**, rời app thì cây chết | Ẩn dụ trực tiếp: cây = thời gian tập trung. Một cây một lúc nên không bị loãng. | Cây chết là hình phạt nặng, gây lo âu |
| **Habitica** | RPG đầy đủ: HP, MP, class, party, boss | Trách nhiệm xã hội trong party rất mạnh | Quá tải khái niệm; bỏ nhiệm vụ làm mất máu cả party |
| **Finch** | Nuôi chim, hoàn thành việc thì chim đi phiêu lưu | Nuôi dưỡng, **không phạt**. Rất bền với người hay bỏ dở. | Tiến triển chậm, người thích thử thách thấy nhạt |
| **Habit tracker phổ thông** | Chuỗi + huy hiệu | Rẻ để làm | Huy hiệu hết nhanh thì mất tác dụng |

### 3.2 Rút ra cho dự án này

**Nên áp dụng:**

- **Ẩn dụ nuôi dưỡng, không phải ẩn dụ chiến đấu** (Finch, Forest) — hợp với "xây dựng thói
  quen", không hợp với thi đua. Hệ thống đã có bảng xếp hạng lo phần thi đua rồi.
- **Một cây đang chăm tại một thời điểm** (Forest) — tập trung sự chú ý, và giải quyết gọn
  bài toán "chia growth cho nhiều cây" (mục 14).
- **Tiến triển gắn với hành vi thật, không gắn với thời gian trôi** — đúng yêu cầu của bạn.
- **Bộ sưu tập** làm phần thưởng dài hạn (Pokémon-style) — cây đã trưởng thành vào bộ sưu
  tập vĩnh viễn, tạo lý do quay lại sau nhiều tháng.

**KHÔNG nên áp dụng:**

| Cơ chế | Vì sao loại |
|---|---|
| **Cây chết khi bỏ bê** (Forest) | Mâu thuẫn với triết lý sẵn có của hệ thống: vật phẩm giữ chuỗi tồn tại để *giảm* cảm giác mất mát. Thêm hình phạt là đi ngược. |
| **Hộp quà ngẫu nhiên / gacha** | Ba lý do: (a) cơ chế đỏ đen trong sản phẩm giáo dục là vấn đề đạo đức; (b) rất khó viết test xác định; (c) trong báo cáo đồ án, xác suất phải chứng minh công bằng — tốn công mà không thêm giá trị học tập. **Đề xuất: unlock tất định theo giá xu.** |
| **RPG đầy đủ** (Habitica) | Quá tải. Hệ thống đã có XP, cấp độ, streak, xu, bảng xếp hạng, nhóm lớp. Thêm HP/class là lớp khái niệm thứ bảy. |
| **Giải đấu theo tuần** (Duolingo League) | Trùng chức năng với bảng xếp hạng đã có. |
| **Chuỗi "đừng làm đứt" gây áp lực** | Đã có streak. Không nhân đôi. |

---

## 4. Proposed Gamification Concept

### 4.1 Một câu

> Mỗi hoạt động học thật sự sinh ra **Điểm chăm sóc**; điểm đó nuôi lớn **một cây đang
> chăm** trong vườn; cây trưởng thành thì vào **bộ sưu tập** vĩnh viễn và trả lại xu để
> mở khoá cây hiếm hơn.

### 4.2 Vòng lặp

```
Học thật  ──> ActivityLog ──> Điểm chăm sóc (có trần ngày)
                                    │
                                    v
                            Cây đang chăm lớn lên
                                    │
                             (đủ ngưỡng giai đoạn)
                                    v
                            Trưởng thành ──> vào Bộ sưu tập
                                    │
                                    v
                            Trả xu ──> mở khoá cây mới ──> trồng tiếp
```

Điểm danh và nhiệm vụ vẫn cho **xu** như hiện nay (không đổi). Chỉ hoạt động học mới cho
**điểm chăm sóc**. Tách hai loại tiền tệ này là chủ ý:

- **Xu** = phần thưởng cho việc *có mặt* (điểm danh, nhiệm vụ)
- **Điểm chăm sóc** = phần thưởng cho việc *học thật*

Người chỉ điểm danh sẽ có xu nhưng vườn không lớn. Đây chính là chỗ gamification phục vụ
mục tiêu học, không thay thế nó.

---

## 5. User Journey

### Flow 1 — Người dùng mới

```
Đăng ký
  -> Vào Tổng quan, thấy thẻ "Khu vườn của bạn" (trống)
  -> Bấm vào -> màn giới thiệu 3 bước, 1 màn hình, bỏ qua được
  -> Nhận 1 cây khởi đầu MIỄN PHÍ (không tốn xu)
  -> Trồng vào ô đầu tiên -> thành cây đang chăm
  -> Gợi ý: "Học 5 từ để cây lớn thêm một chút"
```

Cây đầu **miễn phí** chứ không bán bằng xu khởi đầu: người mới chưa có xu, bắt họ điểm danh
vài ngày rồi mới thấy vườn là đánh mất đúng khoảnh khắc tò mò đầu tiên.

### Flow 2 — Một ngày học bình thường

```
Đăng nhập -> RewardsBar hiện "Điểm danh" (đã có sẵn)
  -> Điểm danh: +50 xu
  -> Xem 3 nhiệm vụ ngày (đã có sẵn)
  -> Học: bài học / ôn thẻ / kiểm tra
  -> Mỗi lần học xong: toast "+X điểm chăm sóc"
  -> Vào Vườn: thanh tiến độ cây nhích lên
  -> Đủ ngưỡng -> cây đổi giai đoạn, hiện hoạt ảnh ngắn
```

### Flow 3 — Mở khoá cây

```
Vườn -> tab "Vườn ươm"
  -> Danh sách cây, mỗi cây có giá xu và bậc hiếm
  -> Cây chưa đủ xu: hiện mờ + còn thiếu bao nhiêu
  -> Bấm mở khoá -> hỏi lại -> trừ xu -> vào kho cây
  -> Trồng ngay hoặc để dành
```

### Flow 4 — Cây trưởng thành

```
Điểm chăm sóc đủ ngưỡng cuối
  -> Cây chuyển trạng thái "đã trưởng thành"
  -> Người dùng bấm "Thu hoạch"
  -> Hoạt ảnh + nhận xu thưởng
  -> Cây vào Bộ sưu tập (vĩnh viễn, kèm ngày trồng và số ngày nuôi)
  -> Ô vườn trống trở lại
```

**Thu hoạch là hành động thủ công, không tự động.** Lý do: khoảnh khắc bấm nút và thấy
kết quả là phần thưởng tâm lý chính. Tự động thu hoạch biến nó thành một dòng log.

---

## 6. Feature Specification

### 6.1 Điểm danh — GIỮ NGUYÊN, không sửa

Đã có. Không đổi gì ở MVP.

**Đánh giá các cơ chế đề bài nêu:**

| Cơ chế | Trạng thái | Đề xuất |
|---|---|---|
| Daily streak | Đã có (`UserStreak`) | Giữ |
| Streak freeze | Đã có (`StreakFreeze`, tự tiêu bằng cron) | Giữ |
| Missed day / reset streak | Đã có (`shared/streak`) | Giữ |
| Thưởng theo mốc 3/7/14/30 ngày | **Chưa có** | **Hoãn sau MVP.** Lý do: cần bảng mốc mới, mà giá trị chồng lấn với streak đang hiển thị. |
| Chống lạm dụng | Đã có (`dedupeKey` unique) | Giữ |

### 6.2 Nhiệm vụ — MỞ RỘNG NHẸ

Ba nhiệm vụ ngày đã có. Đề xuất ở MVP: **không thêm gì**. Sau MVP mới thêm nhiệm vụ tuần.

Lý do hoãn nhiệm vụ tuần: nhiệm vụ ngày chấm lại từ `ActivityLog` của **một ngày** nên
không cần lưu trạng thái. Nhiệm vụ tuần cũng chấm lại được từ `ActivityLog` của 7 ngày —
nhưng cần quyết định tuần bắt đầu thứ mấy, và xử lý người đổi múi giờ giữa tuần. Đó là
công sức thật cho giá trị chưa rõ.

**Vấn đề với ví dụ trong đề bài:**

| Nhiệm vụ đề bài | Chấm được không |
|---|---|
| Điểm danh | Được (đã có) |
| Học 20 từ vựng | Được (`VOCAB_LEARNED`) |
| Ôn tập flashcard | Được (`FLASHCARD_REVIEWED`) |
| Hoàn thành mục tiêu trong ngày | Được (module `goals`) |
| **Học 30 phút** | **KHÔNG** — hệ thống không đo thời lượng ở đâu cả |
| **Hoàn thành 1 bài Listening** | **KHÔNG** — có `ExerciseType.LISTEN_TYPE`/`LISTEN_CHOOSE` nhưng `ActivityLog` không lưu loại bài tập |
| **Hoàn thành 1 bài Reading** | **KHÔNG** — hệ thống không có kỹ năng đọc hiểu |

Xem mục 21 — đây là câu hỏi cần bạn trả lời.

### 6.3 Cây — MỚI

| Trường | Kiểu | Ghi chú |
|---|---|---|
| `code` | chuỗi | Định danh ổn định, vd `sunflower`. Dùng làm khoá ảnh và khoá dịch. |
| `name` | chuỗi | Tên hiển thị |
| `description` | chuỗi | Một câu |
| `rarity` | enum | `COMMON UNCOMMON RARE EPIC LEGENDARY` |
| `unlockCost` | số | Giá xu |
| `growthRequired` | số | Tổng điểm chăm sóc để trưởng thành |
| `harvestReward` | số | Xu nhận khi thu hoạch |
| `isActive` | bool | Ẩn khỏi vườn ươm mà không xoá dữ liệu người đã trồng |

**Giai đoạn sinh trưởng: 4 mốc cố định cho MỌI cây** — hạt (0%), mầm (25%), lớn (60%),
trưởng thành (100%). Không cho mỗi cây một số giai đoạn riêng.

Lý do: mỗi cây một kiểu thì cần bảng giai đoạn riêng, và giao diện phải xử lý số giai đoạn
thay đổi. Bốn mốc theo phần trăm cho đúng cảm giác tiến triển với chi phí bằng một hàm
thuần trong `shared/`.

**Rarity KHÔNG dùng xác suất.** Rarity chỉ quyết định: giá xu, ngưỡng điểm chăm sóc, xu thu
hoạch, và bậc hiển thị. Mở khoá là mua tất định.

### 6.4 Vườn — MỚI

MVP: **một khu vườn, 6 ô cố định**, không mở rộng, không di chuyển cây.

Lý do chọn 6: đủ để vườn không trống trải khi có vài cây, đủ nhỏ để bố cục 3×2 vừa màn hình
điện thoại mà không cần cuộn.

Hoãn: mở khoá thêm ô, di chuyển cây, vật phẩm trang trí.

### 6.5 Điểm chăm sóc — MỚI

Xem mục 14.

---

## 7. Domain Model

**Đề bài liệt kê 15 entity. Đề xuất chỉ tạo 4.**

| Entity đề bài | Quyết định | Lý do |
|---|---|---|
| `User` | **Dùng lại** | Đã có |
| `CheckIn` | **Không tạo** | Đã là `CoinTransaction` với `reason = DAILY_CHECKIN` |
| `Streak` | **Dùng lại** | `UserStreak` đã có |
| `Mission` | **Không tạo** | Đã là hằng số `DAILY_MISSIONS` trong `shared/`. CLAUDE.md ghi rõ: cố ý không phải bảng. |
| `MissionProgress` | **Không tạo** | Chấm lại từ `ActivityLog` mỗi lần đọc. Tạo bảng là tạo nguồn số liệu thứ hai để lệch. |
| `CoinWallet` | **Không tạo** | Số dư = `SUM(amount)`. Cột số dư là nguồn thứ hai để lệch. |
| `CoinTransaction` | **Dùng lại** | Đã có, đã chống trùng |
| `Plant` | **TẠO MỚI** | Danh mục cây |
| `UserPlant` | **TẠO MỚI** | Cây người dùng sở hữu |
| `Garden` | **Không tạo** | Mỗi người đúng một vườn 6 ô -> không có dữ liệu gì để lưu ngoài quan hệ. Ô vườn là `UserPlant.slotIndex`. |
| `GardenSlot` | **Không tạo** | Như trên |
| `PlantGrowth` | **TẠO MỚI** | Nhật ký điểm chăm sóc theo ngày. Xem mục 14. |
| `Reward` | **Không tạo** | Xu đi qua `CoinTransaction`; không có loại thưởng nào khác ở MVP |
| `Achievement` | **Không tạo ở MVP** | Hoãn |
| `PlantUnlock` | **TẠO MỚI** | Sở hữu quyền trồng, tách khỏi cây đang trồng |

### 7.1 `Plant` — danh mục cây

- **Purpose:** danh mục do quản trị viên biên soạn, không thuộc về người dùng nào.
- **Lifecycle:** tạo -> sửa -> ẩn (`isActive = false`). **Không xoá** khi đã có người trồng.
- **Business rules:** `unlockCost >= 0`; `growthRequired > 0`; `code` unique và không đổi
  sau khi tạo (là khoá của file ảnh).

### 7.2 `PlantUnlock` — quyền sở hữu giống cây

- **Purpose:** ghi lại "người này đã mua giống cây này". Mua một lần, trồng lại nhiều lần.
- **Key fields:** `userId`, `plantId`, `unlockedAt`, `coinTransactionId`
- **Relationship:** `User 1—n PlantUnlock n—1 Plant`
- **Business rules:** `@@unique([userId, plantId])` — mua hai lần là vô nghĩa, và ràng buộc
  này chính là thứ chặn mua trùng khi bấm hai lần.

**Vì sao tách khỏi `UserPlant`:** thu hoạch xong cây biến mất khỏi ô vườn, nhưng người dùng
vẫn phải được trồng lại giống đó mà không mua lại. Gộp hai khái niệm thì thu hoạch sẽ xoá
mất quyền sở hữu.

### 7.3 `UserPlant` — một cây đang trồng hoặc đã thu hoạch

- **Key fields:** `userId`, `plantId`, `slotIndex` (0–5), `plantedOn` (ngày local),
  `status` (`GROWING` | `HARVESTED`), `harvestedAt`, `isActive`
- **Lifecycle:** trồng (`GROWING`) -> nuôi -> đủ điểm -> thu hoạch (`HARVESTED`) -> giải
  phóng ô vườn, giữ bản ghi làm bộ sưu tập
- **Business rules:**
  - Một ô chỉ có một cây đang trồng: `@@unique([userId, slotIndex, status])` không dùng
    được vì MySQL. Dùng cột `activeSlotIndex Int?` — có giá trị khi `GROWING`, `NULL` khi
    `HARVESTED`, kèm `@@unique([userId, activeSlotIndex])`. **Cùng thủ pháp với
    `StreakFreeze.usedOnDate` và `PasswordResetRequest.pendingUserId` đã dùng trong dự án.**
  - Đúng một cây `isActive = true` mỗi người: cột `activeUserId Int? @unique`, cùng thủ pháp.

### 7.4 `PlantGrowthDay` — điểm chăm sóc theo ngày

- **Purpose:** một dòng cho mỗi (cây, ngày local). Giá trị là **tổng điểm của ngày đó**,
  không phải số cộng dồn.
- **Key fields:** `userPlantId`, `localDate`, `points`
- **Business rules:** `@@unique([userPlantId, localDate])`. Ghi bằng **upsert giá trị đã
  tính lại**, không phải increment. Xem mục 14 — đây là quyết định chống trùng quan trọng nhất.

---

## 8. Database Design

```prisma
enum PlantRarity { COMMON UNCOMMON RARE EPIC LEGENDARY }
enum UserPlantStatus { GROWING HARVESTED }

model Plant {
  id             Int         @id @default(autoincrement())
  code           String      @unique @db.VarChar(40)
  name           String      @db.VarChar(80)
  description    String      @db.VarChar(300)
  rarity         PlantRarity
  unlockCost     Int         @map("unlock_cost")
  growthRequired Int         @map("growth_required")
  harvestReward  Int         @map("harvest_reward")
  isActive       Boolean     @default(true) @map("is_active")
  createdAt      DateTime    @default(now()) @map("created_at")
  updatedAt      DateTime    @updatedAt @map("updated_at")

  unlocks    PlantUnlock[]
  userPlants UserPlant[]

  @@index([isActive, rarity])
  @@map("plants")
}

model PlantUnlock {
  id         Int      @id @default(autoincrement())
  userId     Int      @map("user_id")
  plantId    Int      @map("plant_id")
  unlockedAt DateTime @default(now()) @map("unlocked_at")

  user  User  @relation(fields: [userId], references: [id], onDelete: Cascade)
  plant Plant @relation(fields: [plantId], references: [id], onDelete: Restrict)

  @@unique([userId, plantId])
  @@map("plant_unlocks")
}

model UserPlant {
  id      Int             @id @default(autoincrement())
  userId  Int             @map("user_id")
  plantId Int             @map("plant_id")
  status  UserPlantStatus @default(GROWING)

  /// Ô vườn 0..5 khi đang trồng, NULL khi đã thu hoạch.
  /// UNIQUE + NULL = một ô chỉ có một cây đang trồng, mà vẫn giữ được lịch sử.
  activeSlotIndex Int? @map("active_slot_index")

  /// = userId khi đây là cây đang chăm, NULL khi không.
  /// UNIQUE nên mỗi người chỉ có một cây đang chăm — ràng buộc DB, không phải kiểm tra trong mã.
  activeUserId Int? @unique @map("active_user_id")

  plantedOn   DateTime  @map("planted_on") @db.Date
  harvestedAt DateTime? @map("harvested_at")
  createdAt   DateTime  @default(now()) @map("created_at")

  user      User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  plant     Plant            @relation(fields: [plantId], references: [id], onDelete: Restrict)
  growthDays PlantGrowthDay[]

  @@unique([userId, activeSlotIndex])
  @@index([userId, status])
  @@map("user_plants")
}

model PlantGrowthDay {
  id          Int      @id @default(autoincrement())
  userPlantId Int      @map("user_plant_id")
  localDate   DateTime @map("local_date") @db.Date
  points      Int
  updatedAt   DateTime @updatedAt @map("updated_at")

  userPlant UserPlant @relation(fields: [userPlantId], references: [id], onDelete: Cascade)

  @@unique([userPlantId, localDate])
  @@map("plant_growth_days")
}
```

**Ghi chú thiết kế:**

- `onDelete: Restrict` trên `Plant`: xoá một giống cây đang có người trồng sẽ làm bốc hơi
  bộ sưu tập của họ. Chặn ở tầng DB, ép quản trị viên dùng `isActive = false`.
- Không có cột số dư xu, không có cột tổng điểm chăm sóc — cùng lý do: nguồn thứ hai để lệch.
- Không dùng soft delete: dự án hiện tại không dùng ở đâu cả.

### 8.1 Vấn đề đồng thời — bảng đối chiếu

| Tình huống | Cơ chế chặn |
|---|---|
| Bấm "mở khoá" hai lần | `@@unique([userId, plantId])` trên `PlantUnlock` -> lần hai ném P2002 |
| Hai request trừ xu cùng lúc | Kiểm số dư + ghi `CoinTransaction` trong **một** `$transaction`, `dedupeKey = PLANT_UNLOCK:<plantId>` |
| Bấm "trồng" hai lần vào cùng ô | `@@unique([userId, activeSlotIndex])` |
| Bấm "thu hoạch" hai lần | `updateMany` kèm điều kiện `status: GROWING` -> lần hai `count = 0` -> 409. **Cùng thủ pháp với duyệt yêu cầu cấp lại mật khẩu.** |
| Hai hoạt động học cùng lúc cộng điểm | Upsert giá trị **tính lại** của cả ngày, không increment -> chạy bao nhiêu lần cũng ra một kết quả |
| Số dư xu âm | Kiểm tra trong transaction; và có thể thêm `CHECK` nếu MySQL 8 hỗ trợ |

---

## 9. API Design

Tất cả dưới `/api/v1`, đều sau `requireAuth` **và `requireRole(UserRole.USER)`** — quản trị
viên không có tính năng người học (CLAUDE.md).

| Method | Endpoint | Purpose | Trả về | Lỗi |
|---|---|---|---|---|
| `GET` | `/garden` | Toàn bộ trạng thái vườn: 6 ô, cây đang chăm, điểm hôm nay, trần ngày | `GardenView` | 401 |
| `GET` | `/garden/catalog` | Vườn ươm: danh mục cây + đã mở khoá chưa + đủ xu chưa | `PlantCatalogItem[]` | 401 |
| `POST` | `/garden/plants/:plantId/unlock` | Mua giống cây | `{ balance, unlock }` | 400 thiếu xu · 404 · 409 đã mở khoá |
| `POST` | `/garden/slots/:slotIndex/plant` | Trồng cây đã mở khoá vào ô | `GardenView` | 400 ô đã có cây · 403 chưa mở khoá · 404 |
| `POST` | `/garden/plants/:userPlantId/harvest` | Thu hoạch cây đã trưởng thành | `{ reward, balance }` | 409 chưa đủ điểm hoặc đã thu hoạch |
| `POST` | `/garden/plants/:userPlantId/focus` | Đặt làm cây đang chăm | `GardenView` | 404 · 409 đã thu hoạch |
| `GET` | `/garden/collection` | Bộ sưu tập cây đã trưởng thành | `CollectionItem[]` | 401 |

**Không có endpoint `POST /plants/:id/growth`.** Đề bài gợi ý endpoint này — **đề xuất bỏ**.
Lý do: nếu frontend gọi được API cộng điểm thì client quyết định phần thưởng, vi phạm
nguyên tắc 7 của chính bạn. Điểm chăm sóc chỉ được cộng **bên trong** `recordActivity` ở
backend, không có lối vào từ ngoài.

**Quản trị viên** (`/admin/*`, sau `requireRole(ADMIN)`):

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/admin/plants` | Danh mục cây |
| `POST` | `/admin/plants` | Thêm giống cây |
| `PATCH` | `/admin/plants/:id` | Sửa |
| `PATCH` | `/admin/plants/:id/active` | Ẩn / hiện |

**Bắt buộc làm cùng MVP, không hoãn.** Nếu không, giống cây chỉ tạo được bằng seed — lặp
lại đúng lỗi của module quiz hiện tại (API có, giao diện không, kho nội dung đóng băng).

---

## 10. Business Rules

### Xu

| Mã | Quy tắc |
|---|---|
| BR-COIN-001 | Số dư = `SUM(CoinTransaction.amount)`. Không có cột số dư. |
| BR-COIN-002 | Không cho phép số dư âm. Kiểm tra và ghi trong cùng một transaction. |
| BR-COIN-003 | Mọi giao dịch có `dedupeKey`; `@@unique([userId, dedupeKey])` là thứ chống trùng duy nhất. |
| BR-COIN-004 | Tiêu xu ghi `amount` âm, không xoá dòng nào. |

### Điểm danh & nhiệm vụ (đã cài, giữ nguyên)

| Mã | Quy tắc |
|---|---|
| BR-CHECKIN-001 | Mỗi ngày local một lần. `dedupeKey = DAILY_CHECKIN:<local_date>`. |
| BR-CHECKIN-002 | Điểm danh **không ghi `ActivityLog`** và **không sinh điểm chăm sóc**. |
| BR-MISSION-001 | Mỗi nhiệm vụ nhận thưởng một lần một ngày. |
| BR-MISSION-002 | Tiến độ chấm lại từ `ActivityLog` ở backend khi nhận thưởng; không tin số FE gửi. |

### Cây & vườn

| Mã | Quy tắc |
|---|---|
| BR-PLANT-001 | Chỉ trồng được giống đã có trong `PlantUnlock`. |
| BR-PLANT-002 | Mở khoá một giống chỉ một lần cho mỗi người. |
| BR-PLANT-003 | Một ô vườn chỉ chứa một cây `GROWING`. |
| BR-PLANT-004 | Mỗi người đúng **một** cây đang chăm. Trồng cây đầu tiên thì nó tự thành cây đang chăm. |
| BR-PLANT-005 | Chỉ thu hoạch được khi tổng điểm >= `growthRequired` và `status = GROWING`. |
| BR-PLANT-006 | Thu hoạch giải phóng ô vườn và giữ nguyên bản ghi làm bộ sưu tập. |
| BR-PLANT-007 | Không xoá giống cây đã có người trồng. Chỉ ẩn. |

### Điểm chăm sóc

| Mã | Quy tắc |
|---|---|
| BR-GROWTH-001 | Chỉ sinh ra từ `ActivityLog`. Không có endpoint nào cộng điểm từ ngoài. |
| BR-GROWTH-002 | Điểm của một ngày là **giá trị tính lại từ `ActivityLog` của ngày đó**, ghi bằng upsert. Gọi lại nhiều lần cho cùng kết quả. |
| BR-GROWTH-003 | Trần `MAX_GROWTH_PER_DAY` cho mỗi ngày. |
| BR-GROWTH-004 | Trần riêng cho từng loại hoạt động, chống dồn một việc dễ. |
| BR-GROWTH-005 | Điểm chỉ vào **cây đang chăm** tại thời điểm ghi. Không có cây đang chăm thì điểm của ngày đó mất — có cảnh báo trên giao diện. |
| BR-GROWTH-006 | Cây đã `HARVESTED` không nhận thêm điểm. |
| BR-GROWTH-007 | Ghi bù hoạt động cho ngày cũ (`localDate` quá khứ) cũng tính lại đúng ngày đó. |

---

## 11. Event Integration

### Đề xuất: KHÔNG dùng event-driven

**Bằng chứng:** mọi hoạt động học đi qua đúng một hàm.

```
lesson.service / exam.service / flashcard.service / habit.service
                          │
                          v
                  recordActivity(input)
                          │
              ┌───────────┴───────────┐
              v                       v
        ActivityLog.create      applyActivity -> UserStreak
                                      │
                                      v   (thêm mới)
                             syncGrowthForDay(userId, localDate, tx)
```

Thêm **một lời gọi** vào `recordActivity`, trong **cùng transaction** đã có sẵn. Nó đã nhận
`tx` làm tham số.

**So sánh phương án:**

| Phương án | Ưu | Nhược | Kết luận |
|---|---|---|---|
| Gọi thẳng trong `recordActivity` | Một chỗ sửa; cùng transaction nên không bao giờ có ActivityLog mà thiếu điểm; dễ test | Gamification ghép chặt vào luồng học | **Chọn** |
| Domain event trong tiến trình (EventEmitter) | Tách rời hơn | Mất tính nguyên tử — event chạy ngoài transaction thì lỗi giữa chừng để lại dữ liệu lệch | Loại |
| Hàng đợi (BullMQ/Redis) | Chịu tải cao | Cần Redis; deploy free tier không có; vài trăm người dùng không cần | Loại — over-engineering |

Nếu sau này cần tách, `syncGrowthForDay` đã là một hàm riêng nên chuyển sang event chỉ là
đổi chỗ gọi.

---

## 12. UX/UI Specification

| Màn / Thành phần | Mục đích | Thành phần dùng | Hành động | API |
|---|---|---|---|---|
| **Thẻ vườn ở Tổng quan** | Móc câu hằng ngày | `Card`, `ProgressBar` | Bấm sang `/garden` | `GET /garden` |
| **Khu vườn** `/garden` | Màn chính, 3 tab | tab bar | đổi tab | `GET /garden` |
| ├ Tab **Vườn** | 6 ô, cây đang chăm nổi bật | `GardenGrid`, `PlantSlot` | trồng, chọn chăm, thu hoạch | `GET /garden` |
| ├ Tab **Vườn ươm** | Mua giống | `PlantCard`, `Badge` (bậc hiếm) | mở khoá | `GET /garden/catalog`, `POST .../unlock` |
| └ Tab **Bộ sưu tập** | Cây đã trưởng thành | lưới thẻ | xem chi tiết | `GET /garden/collection` |
| **Chi tiết cây** | Tiến độ, nguồn điểm hôm nay | `Modal` (đã có) | thu hoạch / chọn chăm | — |
| **Ô trống** | Mời trồng | `EmptyState` (đã có) | mở danh sách giống | — |
| **Hộp thoại thu hoạch** | Ăn mừng | `Modal` + hoạt ảnh | đóng | `POST .../harvest` |
| **Giới thiệu lần đầu** | Dạy vòng lặp | `Modal` 1 màn | bỏ qua / nhận cây | — |
| **Quản lý giống cây** `/admin/plants` | Biên soạn danh mục | khuôn `ContentManager` | thêm/sửa/ẩn | `/admin/plants*` |
| Trạng thái rỗng / tải / lỗi | | `EmptyState`, `SkeletonList`, `ErrorMessage` | | |

**Bắt buộc theo CLAUDE.md khi thêm màn mới:** route + guard, breadcrumb trong `TRAILS`,
`t()` cho mọi chữ + bản dịch trong `en.ts`, nhãn giống hệt nhau ở Sidebar/TRAILS/route,
token màu đúng bộ, chạy `check:i18n` và `typecheck`.

**Hoạt ảnh:** chỉ CSS transform/opacity (GPU). Phải tôn trọng `prefers-reduced-motion` —
đã có tiền lệ trong `index.css`.

**Ảnh cây:** 4 giai đoạn × N giống. Đề xuất **SVG** thay vì PNG — nhẹ, sắc nét mọi cỡ, đổi
màu theo token được. Tránh nhét BLOB vào MySQL: đã chạm trần `max_allowed_packet` 1MB với
ảnh đính kèm diễn đàn.

---

## 13. Coin Economy

### 13.1 Hiện trạng — phát hiện quan trọng

| Nguồn thu | Xu/ngày |
|---|---|
| Điểm danh | 50 |
| 3 nhiệm vụ ngày | 60 |
| **Tổng tối đa** | **110/ngày** |

| Đầu ra | Tổng |
|---|---|
| Vật phẩm giữ chuỗi | 200 × tối đa 3 = **600** |

**Kinh tế xu hiện tại gần như không có đầu ra.** Người dùng chăm chỉ đạt trần 600 xu sau
khoảng **6 ngày**, sau đó xu chỉ tăng vô nghĩa. Đây là lập luận mạnh nhất ủng hộ tính năng
này: vườn cây là **đầu ra mà nền kinh tế đang thiếu**, không phải một lớp thưởng chồng thêm.

### 13.2 Đề xuất giá

Lấy mốc **110 xu/ngày** (người rất chăm) và **~60 xu/ngày** (người bình thường, bỏ một nhiệm vụ).

| Bậc | Giá | Điểm chăm sóc cần | Xu thu hoạch | Ngày tích xu (chăm/thường) |
|---|---|---|---|---|
| Khởi đầu | **0** | 100 | 30 | — |
| Common | 150 | 200 | 60 | 1,4 / 2,5 |
| Uncommon | 400 | 500 | 150 | 3,6 / 6,7 |
| Rare | 900 | 1.000 | 350 | 8 / 15 |
| Epic | 2.000 | 2.200 | 800 | 18 / 33 |
| Legendary | 4.500 | 5.000 | 1.800 | 41 / 75 |

**Nguyên tắc đặt giá: xu thu hoạch ≈ 40% giá mở khoá.** Trồng lại giống cũ vẫn có lãi
(vì đã trả tiền giống một lần rồi), nhưng không đủ để tự nuôi việc mua giống mới — người
dùng vẫn phải điểm danh và làm nhiệm vụ. Nếu thu hoạch trả >= 100% giá thì vòng lặp tự
cấp vốn và xu mất ý nghĩa.

**Chống lạm phát:**

- Vật phẩm giữ chuỗi giữ nguyên giá 200 — vẫn là đầu ra cạnh tranh.
- Không tặng xu ngoài điểm danh / nhiệm vụ / thu hoạch.
- Legendary ở mức ~41 ngày với người chăm nhất: mục tiêu dài hạn thật, không phải trần cứng.

---

## 14. Plant Growth System

### 14.1 Công thức

Điểm chăm sóc của **một ngày** tính lại từ `ActivityLog` của đúng ngày đó:

```
điểm_ngày = min(
  MAX_GROWTH_PER_DAY,
  Σ  min( số_lượt[loại] , TRẦN_LOẠI[loại] ) × ĐIỂM[loại]
)
```

| Loại hoạt động | Điểm/lượt | Trần lượt/ngày | Tối đa |
|---|---|---|---|
| `QUIZ_COMPLETED` | 20 | 3 | 60 |
| `VOCAB_LEARNED` | 4 | 15 | 60 |
| `FLASHCARD_REVIEWED` | 2 | 20 | 40 |
| `HABIT_CHECKIN` | 5 | 3 | 15 |
| **`MAX_GROWTH_PER_DAY`** | | | **120** |

**Trần theo TỪNG LOẠI mới là thứ chống farm, không phải trần tổng.** Chỉ có trần tổng thì
người dùng vẫn đạt trần bằng cách lật 60 thẻ flashcard trong hai phút — hành vi rẻ nhất.
Trần riêng buộc phải làm đủ nhiều loại việc mới chạm trần tổng.

Trọng số bám theo `xpFromActivityCounts` của `shared/level` để hai thang không nói khác
nhau về việc nào đáng giá hơn.

### 14.2 Vì sao upsert-giá-trị-tính-lại, không phải increment

**Đây là quyết định chống trùng quan trọng nhất của cả thiết kế.**

```
Increment (KHÔNG dùng):
  growth += 4       -> gọi hai lần = cộng hai lần = sai
                    -> retry, double-click, ghi bù đều gây sai
                    -> sửa xong không có cách nào biết đã sai bao nhiêu

Upsert giá trị tính lại (dùng):
  điểm_ngày = tính_lại_từ_ActivityLog(ngày)
  upsert(userPlantId, ngày) -> points = điểm_ngày
                    -> gọi 1 lần hay 50 lần đều ra một kết quả
                    -> ghi bù hoạt động cho ngày cũ cũng tự đúng
                    -> phát hiện lệch thì chạy lại là hết
```

Đây đúng triết lý dự án đang theo với `UserStreak`: giá trị dẫn xuất, luôn tái tạo được
100% từ `ActivityLog`, sai thì tính lại chứ không sửa tay.

### 14.3 Các cơ chế đề bài nêu — đánh giá

| Cơ chế | Quyết định | Lý do |
|---|---|---|
| Growth Point | Có | Lõi |
| Growth Stage | Có, 4 mốc theo % | Đơn giản, dùng chung mọi cây |
| Growth cap/day | **Có, hai tầng** | Chống farm |
| Growth Level | Không | Trùng với Stage |
| Growth multiplier | **Hoãn** | Thêm biến vào kinh tế trước khi có số liệu thật là đoán mò |
| Bonus Growth | **Hoãn** | Như trên |
| **Offline/idle growth** | **KHÔNG BAO GIỜ** | Mâu thuẫn trực tiếp với yêu cầu của chính bạn ở mục 7: cây lớn vì học, không vì thời gian trôi. Thêm idle là bỏ đi lý do tồn tại của tính năng. |

---

## 15. Anti-Abuse Strategy

| Kiểu tấn công | Chặn ở đâu |
|---|---|
| Bấm nhiều lần nhận thưởng | `@@unique` trên `dedupeKey` — DB chặn, không phải mã |
| Gửi lại request (replay) | Cùng `dedupeKey` -> P2002 -> trả trạng thái hiện tại, không cộng thêm |
| Sửa dữ liệu ở client | Backend **tính lại toàn bộ** từ `ActivityLog`; không nhận điểm từ body request |
| Giả hoàn thành bài học | Ngoài phạm vi tính năng này — nằm ở tầng chấm bài của `lessons`. **Ghi nhận là rủi ro tồn đọng.** |
| Nhân đôi xu | Kiểm số dư + ghi sổ trong cùng `$transaction` |
| Nhân đôi điểm chăm sóc | Upsert giá trị tính lại (mục 14.2) |
| Đổi giờ hệ thống máy | `localDate` tính ở **backend** từ `User.timezone`, không lấy từ client |
| Đổi `User.timezone` liên tục để điểm danh nhiều lần | **Lỗ hổng còn tồn tại trong hệ thống hiện tại.** Xem mục 21. |
| Request đồng thời | Ràng buộc DB + `updateMany` có điều kiện |
| Spam request | Chưa có rate limit toàn hệ thống — hạng mục A3 của `docs/lo-trinh-phat-trien.md` |

**Ranh giới:** frontend chỉ kiểm để *hiện thông báo sớm* (đủ xu chưa, cây chín chưa).
Backend kiểm lại **toàn bộ** và là nơi duy nhất được tin.

---

## 16. Analytics & KPI

Hệ thống **chưa có hạ tầng analytics nào**. Đề xuất MVP: **không dựng hệ thống sự kiện
riêng** — suy số liệu từ bảng đã có.

| Chỉ số | Suy từ đâu |
|---|---|
| Tỉ lệ điểm danh | `CoinTransaction` `reason = DAILY_CHECKIN` |
| Tỉ lệ hoàn thành nhiệm vụ | `CoinTransaction` `reason = MISSION_CLAIM` |
| Tỉ lệ mở khoá cây | `PlantUnlock` |
| Tỉ lệ cây trưởng thành | `UserPlant.status = HARVESTED` / tổng |
| Số ngày nuôi trung bình | `harvestedAt - plantedOn` |
| Người hoạt động ngày/tuần | `ActivityLog` (màn Tổng quan đã tính) |
| Giữ chân 7/30 ngày | `ActivityLog` theo `localDate` |

**Câu hỏi cần đo nhất:** người có cây đang chăm có học nhiều hơn người không có không?
So `ActivityLog` của hai nhóm trước/sau khi trồng cây đầu tiên. Nếu không chênh, tính năng
không đạt mục tiêu và phải xem lại — số này quan trọng hơn mọi chỉ số tương tác với vườn.

Sự kiện tracking riêng (`plant_unlocked`…): **hoãn**. Thêm một bảng sự kiện khi chưa có
công cụ phân tích là tạo dữ liệu không ai đọc.

---

## 17. MVP Scope

### Trong MVP

```
Danh mục cây (quản trị viên biên soạn)
        ↓
Mở khoá bằng xu  ←── xu từ điểm danh + nhiệm vụ (ĐÃ CÓ)
        ↓
Trồng vào vườn 6 ô
        ↓
Điểm chăm sóc từ hoạt động học (có trần hai tầng)
        ↓
4 giai đoạn sinh trưởng
        ↓
Thu hoạch -> xu + bộ sưu tập
```

Kèm: màn quản trị giống cây, giới thiệu lần đầu, cây khởi đầu miễn phí.

### Sau MVP

- Nhiệm vụ tuần
- Thưởng theo mốc streak (3/7/14/30 ngày)
- Huy hiệu / thành tích
- Mở khoá thêm ô vườn
- Di chuyển cây

### Nice-to-have

- Vật phẩm trang trí
- Chia sẻ ảnh vườn
- Vườn chung của nhóm lớp (tận dụng module `groups` vừa có)

### KHÔNG nên làm

| Thứ | Vì sao |
|---|---|
| Hộp quà ngẫu nhiên / gacha | Cơ chế đỏ đen trong sản phẩm giáo dục; khó test; khó bảo vệ trong báo cáo |
| Cây chết khi bỏ bê | Đi ngược triết lý vật phẩm giữ chuỗi |
| Idle/offline growth | Phá bỏ lý do tồn tại của tính năng |
| Mua xu bằng tiền thật | Ngoài phạm vi đồ án |
| Giao dịch cây giữa người dùng | Mở ra cả một lớp gian lận mới |

---

## 18. Implementation Roadmap

| Phase | Mục tiêu | Việc chính | Đầu ra | Rủi ro |
|---|---|---|---|---|
| **0** | Chốt thiết kế | Trả lời mục 21; chốt bảng giá và trọng số điểm | Bảng số đã duyệt | Chốt sai giá phải cân bằng lại sau |
| **1** | Shared | `shared/src/garden/garden.ts`: hằng số, `growthForDay()`, `stageOf()`, `PlantRarity`; **kèm test** | `pnpm build:shared` sạch | — |
| **2** | Database | 4 model + migration + seed 8 giống cây | `prisma migrate dev` chạy được | Migration viết tay nếu có backfill |
| **3** | Backend vườn | `be/src/modules/garden/`: routes/controller/service | 7 endpoint | — |
| **4** | Nối điểm chăm sóc | Thêm `syncGrowthForDay` vào `recordActivity` | Học xong điểm tăng | **Cao** — đụng luồng lõi. Xem mục 20. |
| **5** | Backend quản trị | `/admin/plants*` | Biên soạn được giống cây | — |
| **6** | Frontend vườn | `fe/src/features/garden/` 3 tab + modal | Màn `/garden` | — |
| **7** | Frontend quản trị | Tab giống cây trong `/admin/content` | Quản lý được danh mục | — |
| **8** | Đánh bóng | Hoạt ảnh, giới thiệu lần đầu, thẻ ở Tổng quan | | — |
| **9** | Kiểm thử | Mục 19 | | — |

**Phụ thuộc:** 1 → 2 → 3 → {4, 5, 6} → {7, 8} → 9. Phase 4 làm được song song với 5 và 6.

**Ước lượng: 14–18 ngày.** Phase 4 chỉ khoảng nửa ngày code nhưng cần nhiều thời gian kiểm
chứng vì nó đụng vào `recordActivity`.

---

## 19. Testing Strategy

### Test đơn vị — `shared/` (theo khuôn `rewards.test.ts` đã có)

| Nhóm | Ca kiểm thử |
|---|---|
| `growthForDay` | 0 hoạt động = 0 · chạm trần từng loại · chạm trần tổng · **chỉ flashcard thì bị trần loại chặn ở 40, không đạt 120** |
| `stageOf` | 0% · 24,9% · 25% · 59,9% · 60% · 99,9% · 100% · vượt 100% |
| Giá | Xu thu hoạch < giá mở khoá cho **mọi** bậc (bất biến kinh tế) |

### Test tích hợp — backend (dự án **chưa có test nào cho `be/src/modules`**)

| Nhóm | Ca |
|---|---|
| Mở khoá | đủ xu · thiếu **đúng 1 xu** · vừa đủ · mở khoá hai lần |
| Trồng | ô trống · ô đã có cây · giống chưa mở khoá · ô ngoài 0–5 |
| Thu hoạch | chưa đủ điểm · đủ đúng ngưỡng · đã thu hoạch rồi |
| Điểm chăm sóc | gọi `syncGrowthForDay` **hai lần** ra cùng kết quả · ghi bù ngày cũ tính đúng ngày · không có cây đang chăm thì không hỏng |
| Xu | số dư không bao giờ âm |

### Test đồng thời

Bắn song song bằng `Promise.all`:

- 10 request mở khoá cùng giống → đúng 1 thành công, 9 nhận 409
- 10 request thu hoạch cùng cây → đúng 1 trả thưởng
- 10 hoạt động học cùng lúc → tổng điểm ngày khớp với tính tay

### Test hồi quy — bắt buộc

Phase 4 đụng `recordActivity`. Phải chứng minh **không đổi**: streak sau khi học, `ActivityLog`
ghi đúng `localDate`, nhiệm vụ ngày vẫn chấm đúng, thống kê và bảng xếp hạng không lệch,
`recompute-streak` vẫn ra cùng số.

---

## 20. Risk Analysis

| Rủi ro | Khả năng | Tác động | Giảm thiểu | Ưu tiên |
|---|---|---|---|---|
| **Sửa `recordActivity` làm hỏng streak** | Trung bình | **Rất cao** — streak là tính năng lõi | Gọi trong transaction sẵn có; test hồi quy trước khi merge; `syncGrowthForDay` không được ném lỗi làm rollback việc ghi hoạt động | **1** |
| Kinh tế lệch (cây quá rẻ/đắt) | Cao | Trung bình | Mọi con số là hằng số trong `shared/`, đổi một chỗ; đo sau 2 tuần | **2** |
| Gamification lấn át việc học | Trung bình | Cao | Điểm chăm sóc **chỉ** từ hoạt động học; điểm danh không sinh điểm; đo chỉ số ở mục 16 | **2** |
| Không có test backend nào sẵn | **Cao** | Cao | Phase 9 phải dựng hạ tầng test từ đầu — tính vào ước lượng | **2** |
| Ảnh cây làm nặng trang | Trung bình | Thấp | SVG, không BLOB trong DB | 3 |
| Phình phạm vi (cosmetic, gacha, đấu) | **Cao** | Trung bình | Mục 17 đã chốt danh sách KHÔNG làm | **2** |
| Lỗ hổng đổi múi giờ | Thấp | Trung bình | Đã tồn tại từ trước; ghi nhận, không sửa trong phạm vi này | 3 |
| Người dùng bỏ vườn sau vài ngày | Trung bình | Cao | Cây khởi đầu miễn phí; Common chỉ ~1,5 ngày tích xu; thẻ nhắc ở Tổng quan | 2 |
| Xung đột với nhánh Nhóm lớp đang làm dở | **Cao** | Trung bình | Chờ commit xong rồi mới bắt đầu — xem ghi chú cuối | **1** |

---

## 21. Open Questions

**Cần bạn quyết trước khi code:**

1. **Một cây đang chăm hay nhiều cây lớn song song?** Đề xuất **một** (tập trung, và giải
   quyết gọn bài toán chia điểm). Nhưng nếu bạn muốn vườn 6 ô cùng lớn thì thiết kế điểm
   phải đổi — cần biết trước.

2. **Nhiệm vụ "Listening", "Reading", "học 30 phút" có nằm trong phạm vi không?** Hệ thống
   **không có dữ liệu** cho cả ba. Ba lựa chọn:
   - (a) Bỏ, chỉ dùng 4 `ActivityType` đang có — **đề xuất**
   - (b) Thêm `ActivityType` mới + đo thời lượng → hạng mục riêng, không thuộc gamification
   - (c) Suy Listening từ `ExerciseType.LISTEN_*` → cần thêm cột vào `ActivityLog`

3. **Xu thu hoạch bằng bao nhiêu phần trăm giá mở khoá?** Đề xuất 40%. Con số này quyết
   định vòng lặp tự cấp vốn hay không.

4. **Quản trị viên có biên soạn giống cây không?** Đề xuất **có** (bắt buộc trong MVP).
   Nếu không thì giống cây chỉ đến từ seed — lặp lại lỗi của module quiz.

5. **Ảnh cây lấy từ đâu?** Cần 4 giai đoạn × 8 giống = 32 hình. Tự vẽ SVG, mua bộ icon,
   hay dùng emoji làm tạm ở MVP?

**Chưa đủ thông tin để quyết:**

6. Trọng số điểm chăm sóc (20/4/2/5) là **suy từ `xpFromActivityCounts`**, chưa có số liệu
   thật về phân bố hoạt động của người dùng. Cần đo rồi chỉnh.

7. Vườn chung cho nhóm lớp: module `groups` vừa được thêm vào và mình **chưa đọc kỹ**.
   Cần khảo sát riêng trước khi hứa.

**Vấn đề của hệ thống hiện tại, ghi nhận nhưng không sửa:**

8. Đổi `User.timezone` có thể điểm danh nhiều lần trong 24 giờ thực. Đã tồn tại từ trước.
9. Không có rate limit toàn hệ thống.
10. `be/src/modules` không có test nào.

---

## 22. Final Recommendation

### Xây mới

| Thành phần | Loại |
|---|---|
| `shared/src/garden/garden.ts` + test | Shared |
| 4 model: `Plant`, `PlantUnlock`, `UserPlant`, `PlantGrowthDay` | Database |
| `be/src/modules/garden/` | Backend |
| 4 endpoint `/admin/plants*` | Backend |
| `fe/src/features/garden/` | Frontend |
| Tab giống cây trong `/admin/content` | Frontend |

### Sửa

| File | Sửa gì | Rủi ro |
|---|---|---|
| `activity-log.service.ts` → `recordActivity` | Thêm **một** lời gọi `syncGrowthForDay` trong transaction sẵn có | **Cao** — luồng lõi |
| `schema.prisma` | 4 model + 2 enum | Thấp |
| `enums.ts` | `CoinReason`: thêm `PLANT_UNLOCK`, `PLANT_HARVEST` | Thấp |
| `AppRoutes.tsx`, `Sidebar.tsx`, `breadcrumbs.ts`, `en.ts` | Khai báo màn mới (6 bước bắt buộc) | Thấp |
| `DashboardPage.tsx` | Thêm thẻ vườn | Thấp |

### Dùng lại — KHÔNG làm lại

`CoinTransaction` và toàn bộ cơ chế chống trùng · `rewards.service` (điểm danh, nhiệm vụ,
số dư) · `ActivityLog` · `UserStreak` · `shared/level` · hệ UI, `Modal`, `Toast`,
`ProgressBar` · hệ màu · i18n · `requireAuth` / `requireRole`.

### Thứ tự

```
Phase 0 chốt thiết kế
   -> 1 shared  -> 2 database  -> 3 backend vườn
                                    ├─> 4 nối điểm chăm sóc  (rủi ro cao)
                                    ├─> 5 backend quản trị
                                    └─> 6 frontend vườn
                                            -> 7 frontend quản trị -> 8 đánh bóng
                                                                        -> 9 kiểm thử
```

### Bước tiếp theo đề xuất

1. Trả lời 5 câu hỏi ở mục 21.
2. **Chờ tính năng Nhóm lớp commit xong** — hiện `schema.prisma`, `enums.ts`, `en.ts`,
   `AppRoutes.tsx`, `Sidebar.tsx` đang có thay đổi chưa commit của người khác. Gamification
   đụng đúng những file đó; làm chồng lên sẽ rất khó tách.
3. Bắt đầu Phase 1 (`shared/`) — không đụng file nào đang có người sửa, nên an toàn nhất
   để khởi động.
