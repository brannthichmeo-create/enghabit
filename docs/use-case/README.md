# Hệ thống Use Case của ENG//HABIT

Bộ tài liệu phân tích use case cho **ENG//HABIT** (English Learning Habit Building
Application), dùng cho báo cáo phân tích thiết kế và tài liệu SRS/SDD.

- **Ngày khảo sát:** 20/09/2026
- **Mã nguồn khảo sát:** nhánh `main`, commit `1c7081d` (19/09/2026) **cộng các thay đổi chưa
  commit** đang có trong cây làm việc lúc khảo sát (15 tệp ở `fe/` và `.github/`). Không sửa,
  xoá hay refactor mã nguồn nào.
- **Kết quả kiểm tra đối chiếu:** 31 route FE, 146 endpoint API và 36 bảng DB đều
  đã gắn với use case hoặc có lý do không cần gắn (xem `TRACEABILITY-MATRIX.md`).

## 1. Kết quả

| Chỉ số | Giá trị |
|---|---|
| Actor | 7 (5 actor người, trong đó 1 trừu tượng; 1 tác nhân thời gian; 1 hệ thống ngoài) |
| Use case | **102** |
| Association | 102 (100 actor chính → use case, 2 use case → actor phụ) |
| «include» | 3 |
| «extend» | 9 |
| Generalization | 3 giữa actor, 1 giữa use case |
| Sơ đồ | 26 hình trong 20 tệp: 1 mức hệ thống, 15 mức module, 10 theo vai trò |
| Use case Confirmed | 99 |
| Use case Partially Confirmed | 3 |
| Cặp use case ↔ endpoint lệch quyền | 20 (đều ở nhóm lớp — xem mục 7) |

### Số use case theo module

| Mã | Module | Số use case |
|---|---|---|
| AUTH | Xác thực và tài khoản cá nhân | 8 |
| LIB | Thư viện bộ thẻ | 9 |
| STU | Học và ôn tập | 7 |
| HAB | Thói quen và mục tiêu | 6 |
| STAT | Thống kê và xếp hạng | 3 |
| REW | Phần thưởng | 4 |
| SHOP | Cửa hàng, ví và kho vật phẩm | 6 |
| COM | Cộng đồng | 8 |
| GRP | Nhóm lớp | 18 |
| NOTI | Thông báo và nhắc nhở | 8 |
| AUSR | Quản trị tài khoản và truy cập | 9 |
| ACNT | Quản trị nội dung và kiểm duyệt bộ thẻ | 7 |
| AGRP | Quản trị nhóm lớp | 5 |
| ASHP | Quản trị cửa hàng | 2 |
| ASYS | Cấu hình hệ thống và thông báo chung | 2 |

## 2. Đọc tài liệu theo thứ tự nào

| Tệp | Nội dung | Dùng cho |
|---|---|---|
| `README.md` | Tệp này: phạm vi, phương pháp, kết quả, vấn đề còn mở | Đọc đầu tiên |
| [`ACTORS.md`](ACTORS.md) | 7 actor, loại, quyền hạn, căn cứ; ma trận quyền theo vai trò | Chương "Tác nhân" của SRS |
| [`USE-CASE-INVENTORY.md`](USE-CASE-INVENTORY.md) | 102 use case theo 15 module, trạng thái xác minh | Danh mục chức năng |
| [`USE-CASE-RELATIONSHIPS.md`](USE-CASE-RELATIONSHIPS.md) | Association, «include», «extend», generalization kèm căn cứ; quan hệ đã loại | Giải thích sơ đồ |
| [`USE-CASE-SPECIFICATIONS.md`](USE-CASE-SPECIFICATIONS.md) | Đặc tả 18 mục cho từng use case | Chương "Đặc tả chức năng" |
| [`TRACEABILITY-MATRIX.md`](TRACEABILITY-MATRIX.md) | Route FE, API, bảng DB, thao tác UI, vai trò, phân quyền ↔ use case | Kiểm tra độ phủ |
| [`diagrams/`](diagrams/) | Sơ đồ PlantUML và ảnh SVG đã render | Hình minh hoạ |

### Danh sách sơ đồ

| Mức | Sơ đồ | Số use case | Tệp | Ảnh |
|---|---|---|---|---|
| Mức hệ thống | Toàn hệ thống (use case tóm tắt theo module) | 15 tóm tắt | [system-use-case.md](diagrams/system-use-case.md) | [svg/system-use-case.svg](diagrams/svg/system-use-case.svg) |
| Module | Xác thực và tài khoản cá nhân | 8 | [module-auth-use-case.md](diagrams/module-auth-use-case.md) | [svg/module-auth-use-case.svg](diagrams/svg/module-auth-use-case.svg) |
| Module | Thư viện bộ thẻ | 9 | [module-library-use-case.md](diagrams/module-library-use-case.md) | [svg/module-library-use-case.svg](diagrams/svg/module-library-use-case.svg) |
| Module | Học và ôn tập | 7 | [module-study-use-case.md](diagrams/module-study-use-case.md) | [svg/module-study-use-case.svg](diagrams/svg/module-study-use-case.svg) |
| Module | Thói quen và mục tiêu | 6 | [module-habits-goals-use-case.md](diagrams/module-habits-goals-use-case.md) | [svg/module-habits-goals-use-case.svg](diagrams/svg/module-habits-goals-use-case.svg) |
| Module | Thống kê và xếp hạng | 3 | [module-statistics-use-case.md](diagrams/module-statistics-use-case.md) | [svg/module-statistics-use-case.svg](diagrams/svg/module-statistics-use-case.svg) |
| Module | Phần thưởng | 4 | [module-rewards-use-case.md](diagrams/module-rewards-use-case.md) | [svg/module-rewards-use-case.svg](diagrams/svg/module-rewards-use-case.svg) |
| Module | Cửa hàng, ví và kho vật phẩm | 6 | [module-shop-use-case.md](diagrams/module-shop-use-case.md) | [svg/module-shop-use-case.svg](diagrams/svg/module-shop-use-case.svg) |
| Module | Cộng đồng | 8 | [module-community-use-case.md](diagrams/module-community-use-case.md) | [svg/module-community-use-case.svg](diagrams/svg/module-community-use-case.svg) |
| Module | Nhóm lớp | 18 | [module-groups-use-case.md](diagrams/module-groups-use-case.md) | [svg/module-groups-use-case.svg](diagrams/svg/module-groups-use-case.svg) |
| Module | Thông báo và nhắc nhở | 8 | [module-notifications-use-case.md](diagrams/module-notifications-use-case.md) | [svg/module-notifications-use-case.svg](diagrams/svg/module-notifications-use-case.svg) |
| Module | Quản trị tài khoản và truy cập | 9 | [module-admin-accounts-use-case.md](diagrams/module-admin-accounts-use-case.md) | [svg/module-admin-accounts-use-case.svg](diagrams/svg/module-admin-accounts-use-case.svg) |
| Module | Quản trị nội dung và kiểm duyệt bộ thẻ | 7 | [module-admin-content-use-case.md](diagrams/module-admin-content-use-case.md) | [svg/module-admin-content-use-case.svg](diagrams/svg/module-admin-content-use-case.svg) |
| Module | Quản trị nhóm lớp | 5 | [module-admin-groups-use-case.md](diagrams/module-admin-groups-use-case.md) | [svg/module-admin-groups-use-case.svg](diagrams/svg/module-admin-groups-use-case.svg) |
| Module | Quản trị cửa hàng | 2 | [module-admin-shop-use-case.md](diagrams/module-admin-shop-use-case.md) | [svg/module-admin-shop-use-case.svg](diagrams/svg/module-admin-shop-use-case.svg) |
| Module | Cấu hình hệ thống và thông báo chung | 2 | [module-admin-system-use-case.md](diagrams/module-admin-system-use-case.md) | [svg/module-admin-system-use-case.svg](diagrams/svg/module-admin-system-use-case.svg) |
| Vai trò | Vai trò Khách | 4 | [role-guest-use-case.md](diagrams/role-guest-use-case.md) | [svg/role-guest-use-case.svg](diagrams/svg/role-guest-use-case.svg) |
| Vai trò | Vai trò Người học — Phần 1 — Thư viện, Học và Ôn tập | 14 | [role-learner-use-case.md](diagrams/role-learner-use-case.md) | [svg/role-learner-use-case-1.svg](diagrams/svg/role-learner-use-case-1.svg) |
| Vai trò | Vai trò Người học — Phần 2 — Thói quen, Mục tiêu, Thống kê | 9 | [role-learner-use-case.md](diagrams/role-learner-use-case.md) | [svg/role-learner-use-case-2.svg](diagrams/svg/role-learner-use-case-2.svg) |
| Vai trò | Vai trò Người học — Phần 3 — Phần thưởng và Cửa hàng | 9 | [role-learner-use-case.md](diagrams/role-learner-use-case.md) | [svg/role-learner-use-case-3.svg](diagrams/svg/role-learner-use-case-3.svg) |
| Vai trò | Vai trò Người học — Phần 4 — Cộng đồng và Nhóm lớp | 18 | [role-learner-use-case.md](diagrams/role-learner-use-case.md) | [svg/role-learner-use-case-4.svg](diagrams/svg/role-learner-use-case-4.svg) |
| Vai trò | Vai trò Người học — Phần 5 — Tài khoản và Thông báo | 10 | [role-learner-use-case.md](diagrams/role-learner-use-case.md) | [svg/role-learner-use-case-5.svg](diagrams/svg/role-learner-use-case-5.svg) |
| Vai trò | Vai trò Trưởng nhóm | 18 | [role-group-leader-use-case.md](diagrams/role-group-leader-use-case.md) | [svg/role-group-leader-use-case.svg](diagrams/svg/role-group-leader-use-case.svg) |
| Vai trò | Vai trò Quản trị viên — Phần 1 — Tài khoản, truy cập và cấu hình | 11 | [role-admin-use-case.md](diagrams/role-admin-use-case.md) | [svg/role-admin-use-case-1.svg](diagrams/svg/role-admin-use-case-1.svg) |
| Vai trò | Vai trò Quản trị viên — Phần 2 — Nội dung, nhóm lớp và cửa hàng | 14 | [role-admin-use-case.md](diagrams/role-admin-use-case.md) | [svg/role-admin-use-case-2.svg](diagrams/svg/role-admin-use-case-2.svg) |
| Vai trò | Vai trò Quản trị viên — Phần 3 — Chức năng dùng chung với Người học | 16 | [role-admin-use-case.md](diagrams/role-admin-use-case.md) | [svg/role-admin-use-case-3.svg](diagrams/svg/role-admin-use-case-3.svg) |

## 3. Phạm vi và phương pháp khảo sát

**Nguồn đã đọc:** `fe/src/routes/AppRoutes.tsx`, toàn bộ `fe/src/features/*`; 16 module
`be/src/modules/*` (routes, service, access), `be/src/app.ts`, hai cron `be/src/jobs/*`;
`be/prisma/schema.prisma` (36 model, 19 enum); `shared/src` (schema Zod, hằng số nghiệp vụ);
tài liệu `CLAUDE.md` và `docs/*.md`.

**Kiểm chứng trên giao diện thật.** Chạy `pnpm dev:be` (`http://localhost:4000`) và
`pnpm dev:fe` (`http://localhost:5173`) trỏ vào DB dev `enghabit_dev` — KHÔNG phải DB
production `defaultdb`. Dùng trình duyệt tự động đăng nhập hai tài khoản mẫu của
`be/prisma/seed.ts`: `user@enghabit.com` (Người học, là trưởng nhóm ở một nhóm) và
`admin@enghabit.com` (Quản trị viên). Mở 28 trên 31 route (chưa mở `/register`, `/forgot-password` và trang 404), liệt kê nút,
tab, ô nhập, bộ lọc; chỉ chuyển tab, không bấm hành động nào làm đổi dữ liệu.

**Dữ liệu phát sinh do khảo sát** (trên `enghabit_dev`): 2 lượt đăng nhập thành công trong
`login_events` và 2 refresh token mới. Không có dữ liệu nào khác bị tạo, sửa hay xoá.

**Đối chiếu tự động.** Route FE, endpoint API (kèm guard `requireAuth` / `requireRole` /
`requireFeature` ở cả router lẫn chỗ mount) và model Prisma được quét bằng script rồi so với mô
hình use case, nên bảng truy vết không phụ thuộc việc liệt kê tay.

**Ngoài phạm vi:** ứng dụng `mobile/` (chưa scaffold); script vận hành (`recompute-streak`,
`seed-shop`, `seed`, git hook) vì không có actor nghiệp vụ; tuỳ chỉnh hiển thị (ngôn ngữ,
sáng/tối) vì chỉ lưu `localStorage`.

## 4. Quy ước

- **ID:** `UC-<MODULE>-<số>`. Module quản trị dùng chung tiền tố `UC-ADM` đánh số liên tục
  01–25 qua 5 module quản trị. Actor: `ACT-01`…`ACT-07`.
- **Tên use case** là cụm động từ tiếng Việt nhìn từ phía actor; tên tiếng Anh ở
  `USE-CASE-INVENTORY.md`. Không dùng tên kỹ thuật (controller, endpoint) làm tên use case.
- **Mẫu CRUD:** thêm/sửa/xoá cùng một đối tượng, cùng actor, cùng điều kiện → một use case
  "Quản lý …". Nghiệp vụ có quy tắc riêng thì tách.
- **Trạng thái xác minh:** Confirmed / Partially Confirmed / Inferred / Unknown — định nghĩa ở
  đầu `USE-CASE-INVENTORY.md`.
- **Actor trừu tượng** "Người dùng đã xác thực" gom chức năng chung của Người học và Quản trị
  viên; hai actor này kế thừa nó.

## 5. Định dạng sơ đồ

Sơ đồ viết bằng **PlantUML**, không bằng Mermaid: Mermaid không có ký hiệu sơ đồ use case UML
(hình người, hình elip, ranh giới hệ thống, «include»/«extend» chuẩn); dựng bằng `flowchart`
thì chỉ là lưu đồ giả dạng use case. Các sơ đồ Mermaid trong
`docs/chuc-nang-va-luong-nghiep-vu.md` mục 2 thuộc loại đó — bộ tài liệu này thay thế chúng
cho mục đích UML.

Mỗi tệp `diagrams/*.md` chứa mã nguồn PlantUML (quản lý được bằng Git) và ảnh SVG đã render
sẵn trong `diagrams/svg/`. Ảnh SVG dựng bằng PlantUML 1.2024.7 với bố cục `smetana` (không
cần Graphviz). Render lại bằng một trong các cách:

- VS Code: extension **PlantUML** (jebbs.plantuml), mở tệp `.md` và xem trước.
- Dòng lệnh: `java -jar plantuml.jar -charset UTF-8 -tsvg <tệp>.puml` (thêm
  `-Playout=smetana` nếu máy không có Graphviz).
- Trực tuyến: plantuml.com/plantuml hoặc kroki.io — dán khối mã `plantuml`.

GitHub không tự render khối `plantuml` trong Markdown; vì vậy mỗi tệp nhúng sẵn ảnh SVG.

## 6. Chức năng chưa xác minh đầy đủ và phần thiếu thông tin

| Use case / hạng mục | Tình trạng |
|---|---|
| UC-HAB-01 Quản lý thói quen | Partially Confirmed — Thao tác SỬA có API và hook `useUpdateHabit` nhưng không có nút trên giao diện (UI chỉ có Thêm, Check-in, Xoá). |
| UC-HAB-03 Check-in bù thói quen | Partially Confirmed — API nhận trường `date` và có đủ quy tắc; giao diện hiện chỉ gửi `{ id }` nên người dùng chưa có cách chọn ngày bù. |
| UC-NOTI-06 Đăng ký thiết bị nhận thông báo đẩy | Partially Confirmed — Có API và bảng `user_devices`, nhưng web chưa tích hợp SDK OneSignal và không có lời gọi nào tới hai endpoint này. Ứng dụng `mobile` chưa scaffold. |
| UC-NOTI-07, UC-NOTI-08 (nhánh gửi đẩy) | Mã gọi OneSignal có, nhưng `ONESIGNAL_API_KEY` trống ở dev và chưa thiết bị nào đăng ký được, nên chưa quan sát một lần gửi thật. Phần tạo thông báo trong app đã xác minh. |
| UC-SHOP-06 lọc theo ngày | API nhận `from`, `to`; giao diện chưa có ô chọn ngày. |
| UC-ADM-06 tác động của việc xoá tài khoản | Chỉ đọc được qua các `onDelete` trong schema, chưa kiểm chứng khi chạy. |
| Luồng quên mật khẩu, mua hàng, chặn/mở chặn, gửi thông báo | Xác minh bằng đọc mã và nhìn nút trên giao diện; KHÔNG bấm thử vì sẽ đổi dữ liệu. |

## 7. Vấn đề cần người phân tích xác nhận

Các điểm dưới đây đọc được từ mã nguồn hoặc quan sát giao diện. Tài liệu mô tả đúng hành vi hiện
tại, không tự sửa mô hình theo ý định giả định.

1. **Backend không chặn Quản trị viên ở nhóm lớp.** Router `/groups` chỉ có `requireAuth` +
   `requireFeature(GROUPS)`, không có `requireRole(USER)`; 20 cặp use case ↔ endpoint lệch
   quyền ở `TRACEABILITY-MATRIX.md` mục F đều thuộc router này. `CLAUDE.md` nói "Quản trị viên
   KHÔNG dùng khu nhóm của người học" nhưng hiện chỉ giao diện ép điều đó. Mô hình giữ Nhóm lớp
   là của Người học. Có cần ép ở backend không?
2. **Thông báo chung gửi cả tài khoản đang bị khoá.** `createAnnouncement` và `countAudience`
   lọc theo vai trò, không lọc `status`. Đây có phải chủ ý?
3. **Xoá thông báo "Đã đạt mục tiêu" có thể làm nó xuất hiện lại.** Khoá chống trùng nằm trên
   chính dòng thông báo; xoá dòng rồi học thêm trong cùng kỳ thì `notifyAchievedGoals` tạo lại.
   Suy ra từ mã, chưa chạy thử.
4. **Sửa thói quen và check-in bù có API nhưng không có giao diện** (UC-HAB-01 phần sửa,
   UC-HAB-03). Tính năng bị bỏ dở hay cố ý ẩn?
5. **Đăng ký thiết bị push không có client** (UC-NOTI-06). Giữ cho ứng dụng `mobile` sau này,
   hay coi push là chưa có?
6. **Nút "Cài đặt nhắc nhở" hiện ở trang Thông báo của Quản trị viên** và trỏ tới
   `/profile#nhac-nho`, nhưng trang cá nhân của Quản trị viên không có khối nhắc nhở (quan sát
   giao diện). Nút này nên ẩn với Quản trị viên?
7. **`docs/phan-tich-do-an.md` đã lỗi thời:** phần B vẫn mô tả module `lessons` đã gỡ ngày
   12/09/2026 (UC-03 "Học một bài trong lộ trình", UC-05 "Làm bài quiz"). Bộ tài liệu này thay
   phần đó; có cần cập nhật hay đánh dấu file cũ?

## 8. Giả định đã dùng

- Tài khoản seed là "tài khoản test được cung cấp"; DB `enghabit_dev` là môi trường được phép
  đăng nhập thử.
- Bộ lập lịch được coi là actor chính (tác nhân thời gian) vì nó khởi động use case; OneSignal là
  actor phụ / hệ thống ngoài vì chỉ nhận yêu cầu gửi.
- Thành viên nhóm thường không tách thành actor riêng vì không có quyền nào ngoài quyền của Người
  học là thành viên.
- Use case có mã nguồn đầy đủ nhưng thiếu giao diện được xếp Partially Confirmed, không bị loại
  khỏi mô hình — nó là chức năng có thật ở tầng API.

## 9. Tệp đã tạo

```
docs/use-case/
├── README.md
├── ACTORS.md
├── USE-CASE-INVENTORY.md
├── USE-CASE-RELATIONSHIPS.md
├── USE-CASE-SPECIFICATIONS.md
├── TRACEABILITY-MATRIX.md
└── diagrams/
    ├── system-use-case.md
    ├── module-auth-use-case.md
    ├── module-library-use-case.md
    ├── module-study-use-case.md
    ├── module-habits-goals-use-case.md
    ├── module-statistics-use-case.md
    ├── module-rewards-use-case.md
    ├── module-shop-use-case.md
    ├── module-community-use-case.md
    ├── module-groups-use-case.md
    ├── module-notifications-use-case.md
    ├── module-admin-accounts-use-case.md
    ├── module-admin-content-use-case.md
    ├── module-admin-groups-use-case.md
    ├── module-admin-shop-use-case.md
    ├── module-admin-system-use-case.md
    ├── role-guest-use-case.md
    ├── role-learner-use-case.md
    ├── role-group-leader-use-case.md
    ├── role-admin-use-case.md
    └── svg/  (26 tệp .svg)
```

Mọi tệp trong thư mục này được sinh từ MỘT mô hình dữ liệu (actor, use case, quan hệ, căn cứ)
nên tên và ID luôn khớp giữa các tài liệu và sơ đồ. Bộ sinh chưa được đưa vào repo; sửa tay một
tệp thì phải sửa các tệp còn lại cho khớp.
