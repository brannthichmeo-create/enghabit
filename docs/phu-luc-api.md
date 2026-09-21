# PHỤ LỤC B — DANH MỤC API

> Trích xuất từ các file `be/src/modules/*/**.routes.ts` và `shared/src/schemas/*.ts`.
> Tổng **76 endpoint**, tất cả gắn dưới tiền tố **`/api/v1`** (khai báo ở `be/src/app.ts` dòng 66),
> trừ `/health` nằm ở gốc.

## Quy ước đọc bảng

| Cột "Quyền" | Ý nghĩa | Middleware tương ứng |
|---|---|---|
| Công khai | Không cần đăng nhập | (không có) |
| Đã đăng nhập | Mọi vai trò | `requireAuth` |
| USER | Chỉ người học — token ADMIN bị chặn 403 | `requireAuth, requireRole(UserRole.USER)` |
| ADMIN | Chỉ quản trị viên | `requireAuth, requireRole(UserRole.ADMIN)` |

Mã lỗi dùng chung toàn hệ thống (`be/src/common/middlewares/error-handler.ts`):

| Mã HTTP | `code` | Khi nào xảy ra |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Zod validate thất bại, có `details` liệt kê từng field |
| 400 | `BAD_REQUEST` | Vi phạm quy tắc nghiệp vụ |
| 401 | `UNAUTHORIZED` | Thiếu token, token sai hoặc hết hạn |
| 403 | `FORBIDDEN` | Sai vai trò, hoặc tài khoản bị khoá |
| 404 | `NOT_FOUND` | Không tìm thấy bản ghi (gồm cả Prisma P2025) |
| 409 | `CONFLICT` | Trùng dữ liệu (gồm cả Prisma P2002) |
| 500 | `INTERNAL_ERROR` | Lỗi không xác định — production giấu stack trace |

Mọi response lỗi có dạng:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Dữ liệu không hợp lệ",
    "details": [{ "field": "email", "message": "Email không hợp lệ" }],
    "requestId": "3f2a1b8c-..."
  }
}
```

---

## B.1. Hệ thống

| Method | Đường dẫn | Quyền | Tham số | Phản hồi |
|---|---|---|---|---|
| GET | `/health` | Công khai | — | `{status, timestamp}` |

---

## B.2. Xác thực và tài khoản — `/auth` (9 endpoint)

File: `be/src/modules/auth/auth.routes.ts`

| Method | Đường dẫn | Quyền | Tham số đầu vào | Phản hồi |
|---|---|---|---|---|
| POST | `/auth/register` | Công khai | `name` (2-100), `email`, `password` (8-72, có chữ + số), `timezone?` | 201 · `{user, accessToken, refreshToken}` |
| POST | `/auth/login` | Công khai | `email`, `password` | 200 · `{user, accessToken, refreshToken}` |
| POST | `/auth/refresh` | Cookie refreshToken | (cookie httpOnly) | 200 · cặp token mới, token cũ bị thu hồi |
| POST | `/auth/logout` | Cookie refreshToken | (cookie httpOnly) | 204 |
| GET | `/auth/me` | Đã đăng nhập | — | 200 · `PublicUser` |
| PATCH | `/auth/me` | Đã đăng nhập | `name?`, `timezone?` | 200 · `PublicUser` |
| PUT | `/auth/me/avatar` | Đã đăng nhập | `dataUrl` (data URL ảnh đã thu nhỏ ở client) | 200 · `PublicUser` |
| DELETE | `/auth/me/avatar` | Đã đăng nhập | — | 200 · `PublicUser` |
| POST | `/auth/me/change-password` | Đã đăng nhập | `currentPassword`, `newPassword` | 204 · thu hồi mọi phiên khác |

**Lỗi đặc thù:**
- `register` → 409 nếu email đã tồn tại.
- `login` → 401 "Email hoặc mật khẩu không đúng" (dùng chung cho cả email không tồn tại lẫn sai
  mật khẩu, để không lộ email nào đã đăng ký); 403 nếu tài khoản `LOCKED`.
- `change-password` → 401 nếu mật khẩu hiện tại sai.
- `PUT /me/avatar` → 400 nếu định dạng ảnh không hợp lệ hoặc vượt `AVATAR_MAX_BYTES`.

---

## B.3. Mục tiêu — `/goals` (8 endpoint)

File: `be/src/modules/goals/goal.routes.ts` · Toàn bộ router chặn `requireRole(UserRole.USER)`

| Method | Đường dẫn | Quyền | Tham số đầu vào | Phản hồi |
|---|---|---|---|---|
| GET | `/goals` | USER | — | 200 · `Goal[]` sắp theo `createdAt` giảm dần |
| GET | `/goals/progress` | USER | — | 200 · `GoalProgress[]` (goalId, type, period, targetValue, currentValue, completionRate, isCompleted, `forecast` — chỉ có với `period = TOTAL`) |
| POST | `/goals` | USER | `type`, `targetValue` (1-10000), `period` (`DAILY`/`WEEKLY`/`TOTAL`), `startDate`, `endDate?` | 201 · `Goal` |
| PATCH | `/goals/:id` | USER | `targetValue?`, `endDate?` | 200 · `Goal` |
| POST | `/goals/:id/finish` | USER | `outcome` (`COMPLETED` = đã đạt, `ARCHIVED` = dừng theo dõi) | 200 · `Goal` |
| POST | `/goals/:id/pause` | USER | — | 200 · `Goal` (`pausedAt` = hôm nay) |
| POST | `/goals/:id/resume` | USER | — | 200 · `Goal` (`endDate` lùi đúng số ngày đã dừng) |
| DELETE | `/goals/:id` | USER | — | 204 |

**Ghi chú:** `PATCH`, `finish` và `DELETE` gọi `assertOwnership()` — sửa mục tiêu của người
khác trả 404 (không phải 403, để không lộ sự tồn tại của bản ghi). `createGoalSchema` có
`refine` kiểm `endDate >= startDate`.

Kết thúc mục tiêu chỉ đi qua `finish`, `PATCH` không nhận `status`: kết thúc còn chốt
`endDate` về hôm nay (nếu hạn còn ở phía trước hoặc chưa có hạn). Mục tiêu đã kết thúc không
sửa, không kết thúc lại và không mở lại được — `PATCH`/`finish` trả 400. Mục tiêu chưa tới
ngày bắt đầu không kết thúc được (400), chỉ xoá. Mục tiêu `STREAK_TARGET` và mục tiêu
`period = TOTAL` tự chuyển `COMPLETED` khi đạt, cùng lúc gửi thông báo đạt mục tiêu.

`TOTAL` cộng dồn từ `startDate`; `STREAK_TARGET` không nhận `TOTAL` (400). Chỉ tạm dừng
được mục tiêu đang trong hạn; mục tiêu tạm dừng không có trong `/goals/progress`.

---

## B.4. Thói quen — `/habits` (7 endpoint)

File: `be/src/modules/habits/habit.routes.ts` · Toàn bộ router chặn `requireRole(UserRole.USER)`

| Method | Đường dẫn | Quyền | Tham số đầu vào | Phản hồi |
|---|---|---|---|---|
| GET | `/habits` | USER | — | 200 · `HabitWithStatus[]` kèm `checkedInToday`, `todayAmount`, `goal` và `recentDays` (`{date, amount, note, level}[]`, 7 ngày) |
| POST | `/habits` | USER | `name` (1-120), `frequency`, `customDays?` (bắt buộc khi CUSTOM), `reminderTime?`, `isActive`, `autoActivity?` (`VOCAB_LEARNED`/`FLASHCARD_REVIEWED`/`QUIZ_COMPLETED`), `targetAmount?`, `minAmount?`, `unit?`, `timesPerWeek?` (1-7, chỉ WEEKLY), `goalId?` | 201 · `Habit` |
| PATCH | `/habits/:id` | USER | các trường trên, tất cả optional | 200 · `Habit` |
| DELETE | `/habits/:id` | USER | — | 204 |
| POST | `/habits/:id/check-in` | USER | `date?` (mặc định hôm nay theo timezone user), `amount?` (bỏ trống = làm đủ), `note?` (max 500) | 201 · `{date}` |
| GET | `/habits/:id/check-ins` | USER | query `from?`, `to?` (YYYY-MM-DD) | 200 · `{date, amount, note}[]` |
| GET | `/habits/:id/completion-rate` | USER | query `from`, `to` (**bắt buộc cả hai**) | 200 · `{expected, completed, rate}` |

**Lỗi đặc thù:**
- `check-in` → 409 "Thói quen này đã được check-in trong ngày" (ràng buộc
  `UNIQUE(habit_id, local_date)`).
- `check-in` → 400 nếu thói quen đang tạm dừng (`isActive = false`), là thói quen tự động
  (`autoActivity` khác null — loại này chấm từ ActivityLog), hoặc `amount` chưa tới mức tối thiểu.
- Mỗi ngày chỉ lượt tích tay ĐẦU TIÊN ghi `HABIT_CHECKIN` vào ActivityLog
  (`dedupeKey = HABIT_CHECKIN:<local_date>`); các lượt sau chỉ lưu `habit_check_ins`.
- `completion-rate` → 400 "Cần truyền cả from và to (YYYY-MM-DD)" nếu thiếu tham số.
- `createHabitSchema` và `updateHabitSchema` có `refine`: frequency CUSTOM bắt buộc
  `customDays` không rỗng; `minAmount` cần `targetAmount` và phải nhỏ hơn nó. `goalId` phải
  là mục tiêu của chính mình (404) và còn `ACTIVE` (400).
- `reminderTime` do job `be/src/jobs/reminder.job.ts` đọc: tới giờ mà thói quen chưa làm
  đủ trong kỳ (đủ `timesPerWeek` lần với WEEKLY, trong ngày với loại còn lại) thì gửi thông báo
  `DAILY_REMINDER` với khoá `DAILY_REMINDER:HABIT-<habitId>:<local_date>`.

---

## B.5. Chủ đề và từ vựng — `/topics` (3 endpoint)

File: `be/src/modules/topics/topic.routes.ts` · Chỉ cần `requireAuth`

**Ngoại lệ cố ý:** mở cho cả hai vai trò, vì khu quản trị cần đọc danh sách chủ đề để quản lý
nội dung.

| Method | Đường dẫn | Quyền | Tham số đầu vào | Phản hồi |
|---|---|---|---|---|
| GET | `/topics` | Đã đăng nhập | — | 200 · `Topic[]` kèm `vocabularyCount` |
| GET | `/topics/:id` | Đã đăng nhập | — | 200 · `Topic` |
| GET | `/topics/:id/vocabulary` | Đã đăng nhập | — | 200 · `Vocabulary[]` kèm cờ `isLearning` của người đang xem |

---

## B.6. Flashcard — `/flashcards` (4 endpoint)

File: `be/src/modules/flashcards/flashcard.routes.ts` · Toàn bộ router chặn `requireRole(UserRole.USER)`

| Method | Đường dẫn | Quyền | Tham số đầu vào | Phản hồi |
|---|---|---|---|---|
| GET | `/flashcards/due` | USER | — | 200 · `DueCard[]` (tối đa 20 thẻ = `MAX_FLASHCARDS_PER_SESSION`) |
| GET | `/flashcards/due/count` | USER | — | 200 · số nguyên (dùng cho badge sidebar) |
| POST | `/flashcards/review` | USER | `vocabularyId`, `quality` (0-5 theo `ReviewQuality`) | 200 · `SrsState` mới |
| POST | `/flashcards/learn` | USER | `vocabularyId` | 200 · `SrsState` ban đầu |

**Lỗi đặc thù:** `review` → 404 "Từ này chưa nằm trong danh sách học của bạn"; `learn` → 404 nếu
không tìm thấy từ vựng.

**Ghi chú:** cả hai POST đều ghi `ActivityLog` trong cùng transaction với việc cập nhật tiến độ
SRS. `learn` dùng `upsert` với `update: {}` — học lại từ đã có thì giữ nguyên tiến độ, không
reset về đầu.

---

## B.7. Lộ trình bài học và Kiểm tra — `/lessons` (8 endpoint)

File: `be/src/modules/lessons/lesson.routes.ts` · Toàn bộ router chặn `requireRole(UserRole.USER)`

Không còn module `quizzes` riêng — chế độ "Kiểm tra" (kiểu Exam của OpenQuiz.ai) nằm ngay
trong module này, xem `be/src/modules/lessons/exam.service.ts`.

| Method | Đường dẫn | Quyền | Tham số đầu vào | Phản hồi |
|---|---|---|---|---|
| GET | `/lessons/path` | USER | — | 200 · `PathTopic[]` (mỗi chủ đề gồm danh sách bài kèm `isUnlocked`, `isCompleted`, `bestScore`, `bestExamScore`) |
| GET | `/lessons/mistakes/count` | USER | — | 200 · `{count}` (số từ khác nhau đang sai) |
| GET | `/lessons/mistakes` | USER | query `limit` (1-20, mặc định 10) | 200 · `MistakeItem[]` |
| GET | `/lessons/mistakes/practice` | USER | query `limit` (1-20, mặc định 10) | 200 · `LessonDetail` |
| GET | `/lessons/exam/:topicId` | USER | path param | 200 · `LessonDetail` — đề sinh từ CẢ chủ đề, ưu tiên từ đang sai |
| POST | `/lessons/exam/submit` | USER | `topicId`, `answers[]` (như bài học, không có `index`) | 200 · `LessonResult` (`nextLesson` luôn `null`) |
| GET | `/lessons/:topicId/:index` | USER | path params | 200 · `LessonDetail` gồm mảng `Exercise` |
| POST | `/lessons/submit` | USER | `topicId`, `index`, `answers[]` (`exerciseId`, `vocabularyId`, `type`, `value?`, `pairs?`) | 200 · `LessonResult` |

**Lỗi đặc thù:**
- `GET /:topicId/:index` → 404 nếu không tìm thấy chủ đề, hoặc index vượt số bài.
- `GET /exam/:topicId` → 404 nếu không tìm thấy chủ đề, hoặc chủ đề chưa có từ vựng.
- `mistakes/practice` → 404 "Bạn chưa có từ nào cần ôn lại" khi danh sách rỗng.
- `parseIndex` cho phép index = 0, khác `parseId` yêu cầu > 0.

**Ghi chú quan trọng:** client gửi **đáp án đã chọn**, không gửi đúng/sai. Backend tự chấm bằng
cách đối chiếu với bảng `vocabularies` — kết quả ảnh hưởng tới streak và thống kê nên không thể
để client quyết định. Kiểm tra dùng lại đúng logic chấm này (`grading.ts`) và cũng cập nhật
bảng `mistakes` giống bài học, nhưng ghi `ActivityLog` loại `QUIZ_COMPLETED` thay vì
`VOCAB_LEARNED`, và không đụng tới `lesson_progress`.

---

## B.8. Thống kê — `/statistics` (4 endpoint)

File: `be/src/modules/statistics/statistics.routes.ts` · Toàn bộ router chặn `requireRole(UserRole.USER)`

| Method | Đường dẫn | Quyền | Tham số đầu vào | Phản hồi |
|---|---|---|---|---|
| GET | `/statistics/summary` | USER | query `range` = `day` \| `week` \| `month` (mặc định `week`) | 200 · `StatsSummary` |
| GET | `/statistics/streak` | USER | — | 200 · `StreakSummary` |
| GET | `/statistics/level` | USER | — | 200 · `LevelSummary` |
| GET | `/statistics/calendar` | USER | query `months` (1-12, mặc định 12) | 200 · `ActivityCalendar` |

**Cấu trúc phản hồi:**

```
StatsSummary   { range, from, to, daily[], totals, activeDayRate, streak, level }
DailyStat      { date, vocabLearned, flashcardsReviewed, quizzesCompleted,
                 habitCheckIns, totalActivities }
StreakSummary  { currentStreak, longestStreak, lastActiveDate, isAlive, deadline }
LevelSummary   { xp, level, xpInLevel, xpToNextLevel, progressPercent }
ActivityCalendar { from, to, days[], totalActivities, activeDays, thresholds }
```

**Ghi chú:** `range=day` vẫn trả 7 ngày gần nhất để biểu đồ có bối cảnh so sánh. Những ngày
không có hoạt động vẫn được trả về với giá trị 0 để biểu đồ liền mạch.

---

## B.9. Thông báo và nhắc nhở — `/notifications` (13 endpoint)

File: `be/src/modules/notifications/notification.routes.ts` · Router chặn `requireAuth`;
riêng nhóm cấu hình và mốc nhắc chặn thêm `requireRole(UserRole.USER)` ở từng route.

### Thông báo trong ứng dụng — mở cho cả hai vai trò

| Method | Đường dẫn | Quyền | Tham số đầu vào | Phản hồi |
|---|---|---|---|---|
| GET | `/notifications` | Đã đăng nhập | query `page` (mặc định 1), `pageSize` (1-50, mặc định 20), `unreadOnly` (`'true'` / `'1'`) | 200 · `Paginated<NotificationRow>` |
| GET | `/notifications/unread-count` | Đã đăng nhập | — | 200 · `{count}` |
| PATCH | `/notifications/:id/read` | Đã đăng nhập | — | 200 · `NotificationRow` |
| POST | `/notifications/read-all` | Đã đăng nhập | — | 200 · `{updated}` |
| DELETE | `/notifications/:id` | Đã đăng nhập | — | 204 |

**Ngoại lệ cố ý:** danh sách thông báo không chặn vai trò — quản trị viên vẫn nhận thông báo hệ
thống trong chuông.

**Ghi chú kỹ thuật:** `unreadOnly` dùng `z.preprocess` chứ **không** dùng `z.coerce.boolean()` —
query string luôn là chuỗi, mà `Boolean('false') === true` sẽ khiến bộ lọc luôn bật.

### Cấu hình nhắc nhở — chỉ USER

| Method | Đường dẫn | Quyền | Tham số đầu vào | Phản hồi |
|---|---|---|---|---|
| GET | `/notifications/settings` | USER | — | 200 · `{isEnabled, remindStreakAtRisk, remindReviewDue}` |
| PUT | `/notifications/settings` | USER | `isEnabled`, `remindStreakAtRisk?`, `remindReviewDue?` | 200 · cấu hình mới |

### Các mốc nhắc — chỉ USER

| Method | Đường dẫn | Quyền | Tham số đầu vào | Phản hồi |
|---|---|---|---|---|
| GET | `/notifications/reminders` | USER | — | 200 · `Reminder[]` sắp theo giờ tăng dần |
| POST | `/notifications/reminders` | USER | `label?` (max 60), `timeOfDay` (`HH:mm`), `daysOfWeek` (mảng 1-7, mặc định cả tuần) | 201 · `Reminder` |
| PATCH | `/notifications/reminders/:id` | USER | các trường trên + `isEnabled?`, tất cả optional | 200 · `Reminder` |
| DELETE | `/notifications/reminders/:id` | USER | — | 204 |

**Lỗi đặc thù:**
- 400 "Mỗi người chỉ đặt được tối đa 5 mốc nhắc" (`MAX_REMINDERS_PER_USER`).
- 409 "Bạn đã có một mốc nhắc vào giờ này" (ràng buộc `UNIQUE(user_id, time_of_day)`).
- 404 nếu mốc không thuộc về người đang gọi.

### Thiết bị nhận push — mở cho cả hai vai trò

| Method | Đường dẫn | Quyền | Tham số đầu vào | Phản hồi |
|---|---|---|---|---|
| POST | `/notifications/devices` | Đã đăng nhập | `playerId` (max 200), `platform` (`web` \| `ios` \| `android`) | 204 |
| DELETE | `/notifications/devices/:playerId` | Đã đăng nhập | — | 204 |

---

## B.10. Phần thưởng — `/rewards` (4 endpoint)

File: `be/src/modules/rewards/rewards.routes.ts` · Toàn bộ router chặn `requireRole(UserRole.USER)`

| Method | Đường dẫn | Quyền | Tham số đầu vào | Phản hồi |
|---|---|---|---|---|
| GET | `/rewards` | USER | — | 200 · `RewardsSummary` `{coins, checkIn, missions[], freeze}` |
| POST | `/rewards/check-in` | USER | — | 200 · `CoinChangeResult` (`delta = +50`) |
| POST | `/rewards/missions/claim` | USER | `missionId` (`LEARN_VOCAB` \| `REVIEW_FLASHCARDS` \| `DO_HABIT`) | 200 · `CoinChangeResult` (`delta = +20`) |
| POST | `/rewards/streak-freeze/buy` | USER | — | 200 · `CoinChangeResult` (`delta = -200`) |

**Lỗi đặc thù:**
- `check-in` → 409 "Hôm nay bạn đã điểm danh rồi".
- `missions/claim` → 400 "Nhiệm vụ không tồn tại" / "Nhiệm vụ chưa hoàn thành"; 409 "Bạn đã nhận
  thưởng nhiệm vụ này hôm nay".
- `streak-freeze/buy` → 400 "Kho chỉ giữ được tối đa 3 vật phẩm" / "Cần 200 xu, bạn mới có N".

**Hằng số nghiệp vụ** (`shared/src/rewards/rewards.ts`):

| Hằng số | Giá trị |
|---|---|
| `DAILY_CHECKIN_REWARD` | 50 xu |
| `STREAK_FREEZE_PRICE` | 200 xu |
| `MAX_STREAK_FREEZES` | 3 |
| Nhiệm vụ 1 — Học 5 từ mới | +20 xu |
| Nhiệm vụ 2 — Ôn 10 thẻ | +20 xu |
| Nhiệm vụ 3 — Check-in 1 thói quen | +20 xu |

**Ghi chú:** nhóm endpoint này **không ghi `ActivityLog`** và **không cộng XP** — xem giải thích
ở phần D2 của tài liệu phân tích chính.

---

## B.11. Bảng xếp hạng — `/leaderboard` (1 endpoint)

File: `be/src/modules/leaderboard/leaderboard.routes.ts` · Chặn `requireRole(UserRole.USER)`

| Method | Đường dẫn | Quyền | Tham số đầu vào | Phản hồi |
|---|---|---|---|---|
| GET | `/leaderboard` | USER | query `range` = `week` \| `month` \| `all` (mặc định `week`), `limit` (3-50, mặc định 20) | 200 · `LeaderboardResult` `{range, entries[], me, totalRanked}` |

**Ghi chú:** `me` chỉ khác null khi người đang xem nằm **ngoài** top — đã có trong `entries` thì
không lặp lại ở dưới. Chỉ xếp hạng tài khoản `USER` đang `ACTIVE`.

---

## B.12. Quản trị — `/admin` (17 endpoint)

File: `be/src/modules/admin/admin.routes.ts` · **Toàn bộ router** chặn
`requireAuth, requireRole(UserRole.ADMIN)` ngay ở dòng 41.

### Tổng quan hệ thống

| Method | Đường dẫn | Tham số đầu vào | Phản hồi |
|---|---|---|---|
| GET | `/admin/overview` | — | 200 · `SystemOverview` |

Cấu trúc `SystemOverview`:

```
users    { total, admins, locked, newLast7Days, newLast30Days,
           activeToday, activeLast7Days, activeLast30Days, retention7Days }
content  { topics, vocabulary }
activity { total, last7Days, byType[], daily[] }
access   { loginsLast7Days, failedLast7Days, activeSessions }
system   { uptimeSeconds, nodeVersion, environment, databaseOk, generatedAt }
topLearners[]  { id, name, activityCount, currentStreak }
```

### Quản lý tài khoản

| Method | Đường dẫn | Tham số đầu vào | Phản hồi |
|---|---|---|---|
| GET | `/admin/users` | query `page`, `pageSize` (1-100, mặc định 20), `search?` (tên hoặc email), `role?`, `status?`, `sort` = `newest` \| `oldest` \| `lastLogin` \| `mostActive` | 200 · `Paginated<AdminUserRow>` |
| GET | `/admin/users/:id` | — | 200 · `AdminUserDetail` kèm 10 lượt đăng nhập gần nhất |
| PATCH | `/admin/users/:id/role` | `role` (`USER` \| `ADMIN`) | 200 · `AdminUserRow` |
| PATCH | `/admin/users/:id/status` | `status` (`ACTIVE` \| `LOCKED`) | 200 · `AdminUserRow` |
| DELETE | `/admin/users/:id` | — | 204 |

> Không có endpoint đặt mật khẩu hộ người dùng. Việc cấp lại mật khẩu đi qua nhóm
> `/admin/password-reset-requests/*` — quản trị viên chỉ duyệt, mật khẩu mới do chính người
> dùng đặt.

### Yêu cầu cấp lại mật khẩu

| Method | Endpoint | Body / Query | Trả về |
|---|---|---|---|
| GET | `/admin/password-reset-requests` | `tab` (`pending` \| `log`), `page`, `pageSize` | 200 · `Paginated<ResetRequestRow>` |
| POST | `/admin/password-reset-requests/:id/approve` | — | 204 |
| POST | `/admin/password-reset-requests/:id/reject` | `reason` (5-500 ký tự, bắt buộc) | 204 |

Duyệt hoặc từ chối một yêu cầu đã được xử lý trả **409 `CONFLICT`** — hai quản trị viên bấm
cùng lúc thì chỉ lệnh đầu tiên có tác dụng.

**Ba quy tắc an toàn — trả 400 `BAD_REQUEST`:**

| Tình huống | Thông báo |
|---|---|
| Tự bỏ quyền quản trị của mình | "Không thể tự bỏ quyền quản trị của chính mình" |
| Tự khoá tài khoản của mình | "Không thể tự khoá tài khoản của chính mình" |
| Tự xoá tài khoản của mình | "Không thể tự xoá tài khoản của chính mình" |
| Hạ quyền / khoá / xoá admin cuối cùng | "Đây là quản trị viên hoạt động duy nhất — hãy chỉ định người khác trước" |

**Tác dụng phụ quan trọng:** `status = LOCKED`, `change-password` và `password-reset/confirm`
đều **thu hồi toàn bộ refresh token** đang hoạt động của tài khoản đó.

### Lượt truy cập

| Method | Đường dẫn | Tham số đầu vào | Phản hồi |
|---|---|---|---|
| GET | `/admin/access/overview` | query `days` (1-90, mặc định 30) | 200 · `AccessOverview` `{points[], totalLogins, totalFailed, uniqueUsers, activeSessions}` |
| GET | `/admin/access/logs` | query `page`, `pageSize` (1-100), `result` = `all` \| `success` \| `failed`, `days` (1-90, mặc định 30) | 200 · `Paginated<LoginEventRow>` |

`GET /admin/access/overview` → 400 "Số ngày phải từ 1 đến 90" nếu `days` ngoài khoảng.

### Nhật ký thao tác

| Method | Đường dẫn | Tham số đầu vào | Phản hồi |
|---|---|---|---|
| GET | `/admin/audit-logs` | query `page`, `pageSize` (1-100), `targetTypes?` (danh sách cách nhau bằng dấu phẩy, vd `TOPIC,VOCABULARY`), `actorId?` | 200 · `Paginated<AuditLogRow>` `{id, createdAt, actor{id, name}, action, targetType, targetId, targetLabel, changes, note}` |
| GET | `/admin/audit-logs/actors` | query `targetTypes?` | 200 · `AuditActorOption[]` — những người đã có thao tác trên các loại đó, cho ô lọc |

Chỉ có route ĐỌC: nhật ký không sửa, không xoá được qua API nào. Dòng mới do chính các
service ghi (`recordAdminAction`) trong cùng transaction với thao tác — mọi route ghi của
`/admin/*` ở trên, cộng với việc quản trị viên xoá bài viết/bình luận của người khác ở
`/community`. `changes` dạng `{ tênTrường: { from, to } }`, chỉ gồm các trường thật sự đổi.

### Gửi thông báo tới người dùng

| Method | Đường dẫn | Tham số đầu vào | Phản hồi |
|---|---|---|---|
| GET | `/admin/announcements/audience` | query `role?` (`USER` \| `ADMIN`) | 200 · `{count}` — xem trước số người nhận |
| POST | `/admin/announcements` | `title` (3-150), `body` (3-500), `audience` = `all` \| `role`, `role?`, `link?` (max 120) | 201 · `{recipients}` |

**Ghi chú:** `dedupeKey` của announcement gắn mốc `Date.now()` nên hai lần gửi khác nhau vẫn ra
hai thông báo — khác với nhắc nhở tự động, ở đây gửi trùng là chủ ý của người gửi.

### Nội dung học tập — Chủ đề

Tái dùng `topic.service` thay vì viết lại query.

| Method | Đường dẫn | Tham số đầu vào | Phản hồi |
|---|---|---|---|
| POST | `/admin/topics` | `name` (1-120), `description?` (max 1000), `level` | 201 · `Topic` |
| PATCH | `/admin/topics/:id` | các trường trên, tất cả optional | 200 · `Topic` |
| DELETE | `/admin/topics/:id` | — | 204 · **cascade xoá từ vựng, lịch sử kiểm tra, tiến độ bài học** |

### Nội dung học tập — Từ vựng

| Method | Đường dẫn | Tham số đầu vào | Phản hồi |
|---|---|---|---|
| POST | `/admin/vocabulary` | `topicId`, `word` (1-100), `meaning` (1-500), `phonetic?`, `example?`, `audioUrl?` (URL hợp lệ) | 201 · `Vocabulary` |
| PATCH | `/admin/vocabulary/:id` | các trường trên trừ `topicId`, tất cả optional | 200 · `Vocabulary` |
| DELETE | `/admin/vocabulary/:id` | — | 204 · cascade xoá tiến độ SRS và lỗi sai của từ đó |

> Không còn "Nội dung học tập — Quiz": admin không tự soạn câu hỏi kiểm tra nữa, đề Kiểm
> tra sinh tự động từ `Vocabulary` (xem B.7 và `exam.service.ts`). Quản lý nội dung học tập
> giờ chỉ còn Chủ đề và Từ vựng ở trên.

---

## B.13. Bảng tổng hợp số lượng endpoint

| Nhóm | Số endpoint | Quyền |
|---|---|---|
| Hệ thống (`/health`) | 1 | Công khai |
| Xác thực (`/auth`) | 9 | Công khai (4) + Đã đăng nhập (5) |
| Mục tiêu (`/goals`) | 8 | USER |
| Thói quen (`/habits`) | 7 | USER |
| Chủ đề (`/topics`) | 3 | Đã đăng nhập |
| Flashcard (`/flashcards`) | 4 | USER |
| Bài học và Kiểm tra (`/lessons`) | 8 | USER |
| Thống kê (`/statistics`) | 4 | USER |
| Thông báo (`/notifications`) | 13 | Đã đăng nhập (7) + USER (6) |
| Phần thưởng (`/rewards`) | 4 | USER |
| Bảng xếp hạng (`/leaderboard`) | 1 | USER |
| Quản trị (`/admin`) | 19 | ADMIN |
| **Tổng** | **81** | |

Phân bổ theo quyền:

| Quyền | Số endpoint | Tỷ lệ |
|---|---|---|
| Công khai | 5 | 6,6% |
| Đã đăng nhập (mọi vai trò) | 15 | 19,7% |
| Chỉ USER | 39 | 51,3% |
| Chỉ ADMIN | 17 | 22,4% |

Nhận xét: **hơn 3/4 số endpoint bị giới hạn theo vai trò** — đây là con số minh hoạ tốt cho phần
"Phân quyền" của báo cáo. Ranh giới USER/ADMIN được cưỡng chế ở tầng router bằng
`requireRole()`, không chỉ ẩn trên giao diện.

---

## B.14. Hai tiến trình nền (không phải API)

Khởi động ở `be/src/server.ts` dòng 18-22, bật/tắt bằng biến môi trường `ENABLE_REMINDER_JOB`.

| Job | File | Lịch chạy | Nhiệm vụ |
|---|---|---|---|
| Nhắc nhở học tập | `be/src/jobs/reminder.job.ts` | `*/15 * * * *` (15 phút) | Gửi nhắc học theo mốc người dùng đặt; cảnh báo chuỗi sắp đứt lúc 21:30 giờ địa phương |
| Vật phẩm giữ chuỗi | `be/src/jobs/streak-freeze.job.ts` | `*/30 * * * *` (30 phút) | Tự tiêu vật phẩm để bù cho ngày người dùng nghỉ |

Cả hai job đều tách phần logic ra hàm riêng (`runReminderTick()`, `runStreakFreezeTick()`) để
test được và chạy tay khi cần debug.

**Ghi chú:** cron quét mỗi 15/30 phút chứ không phải mỗi ngày một lần, vì mỗi người dùng có một
timezone riêng — "hôm nay" của họ bắt đầu vào những giờ khác nhau. Chạy lại nhiều lần vô hại nhờ
các ràng buộc `UNIQUE` chống trùng.

---

## B.15. Cơ chế xác thực tóm tắt

| Thành phần | Chi tiết |
|---|---|
| Access token | JWT HS256, payload `{sub, role, timezone}`, hạn **15 phút** (`JWT_ACCESS_EXPIRES_IN`) |
| Truyền access token | Header `Authorization: Bearer <token>` |
| Refresh token | Chuỗi ngẫu nhiên 48 byte hex, hạn **30 ngày** (`JWT_REFRESH_EXPIRES_IN`) |
| Lưu refresh token | **SHA-256 hash** trong bảng `refresh_tokens` — DB lộ thì token cũng không dùng lại được |
| Truyền refresh token | Web: cookie `httpOnly` + `Secure`; Mobile: trong body response |
| Rotation | Mỗi lần refresh thu hồi token cũ và cấp token mới |
| Tự refresh phía FE | Interceptor của axios bắt 401, gom mọi request 401 đồng thời vào **một** lần refresh |
| Thu hồi toàn bộ phiên | Khi đổi mật khẩu, khi admin reset mật khẩu, khi admin khoá tài khoản |

---

*Phụ lục sinh từ các file `*.routes.ts` và `shared/src/schemas/`, ngày 04/09/2026.*
