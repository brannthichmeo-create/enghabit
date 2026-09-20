# Vai trò Quản trị viên

Mọi use case một tài khoản `ADMIN` dùng được. Quản trị viên KHÔNG có use case học tập, phần thưởng, cửa hàng, nhóm lớp của người học, cấu hình nhắc nhở.

Tổng số use case của vai trò trong tài liệu này: 41, chia thành 3 sơ đồ theo nhóm module để giữ sơ đồ dễ đọc.

**Cách đọc:** hình người là actor, hình elip là use case, khung ngoài là ranh giới hệ thống
`ENG//HABIT`, khung trong là module. Mũi tên liền từ actor tới use case là association;
mũi tên nét đứt `<<include>>` trỏ từ use case gốc tới use case luôn được gọi; `<<extend>>` trỏ từ
use case mở rộng tới use case gốc; mũi tên tam giác rỗng là generalization (con → cha).
Use case nền vàng mang nhãn `<<Partially Confirmed>>`: có bằng chứng ở mã nguồn nhưng chưa đủ
(xem cột Trạng thái trong `USE-CASE-INVENTORY.md`).

## Vai trò Quản trị viên — Phần 1 — Tài khoản, truy cập và cấu hình

11 use case.

![Vai trò Quản trị viên — Phần 1 — Tài khoản, truy cập và cấu hình](svg/role-admin-use-case-1.svg)

```plantuml
@startuml role-admin-use-case-1
left to right direction
skinparam shadowing false
skinparam defaultFontName Arial
skinparam defaultFontSize 12
skinparam packageStyle rectangle
skinparam ArrowColor #3B5B8C
skinparam usecase {
  BackgroundColor #FFFFFF
  BorderColor #3B5B8C
  BackgroundColor<<Partially Confirmed>> #FFF4D6
  BorderColor<<Partially Confirmed>> #B7791F
}
skinparam actor {
  BackgroundColor #FFFFFF
  BorderColor #3B5B8C
}
skinparam rectangle {
  BorderColor #1F3A60
  FontStyle bold
}
skinparam package {
  BorderColor #9AA9BF
  FontColor #1F3A60
}
title Vai trò Quản trị viên — Phần 1 — Tài khoản, truy cập và cấu hình

actor "Quản trị viên" as A_ADMIN

rectangle "ENG//HABIT" {
  package "Quản trị tài khoản và truy cập" {
    usecase "Xem tổng quan hệ thống\n<size:10>UC-ADM-01</size>" as UC_ADM_01
    usecase "Tìm kiếm và lọc tài\nkhoản\n<size:10>UC-ADM-02</size>" as UC_ADM_02
    usecase "Xem chi tiết tài khoản\n<size:10>UC-ADM-03</size>" as UC_ADM_03
    usecase "Thay đổi vai trò tài\nkhoản\n<size:10>UC-ADM-04</size>" as UC_ADM_04
    usecase "Khoá hoặc mở khoá tài\nkhoản\n<size:10>UC-ADM-05</size>" as UC_ADM_05
    usecase "Xoá tài khoản\n<size:10>UC-ADM-06</size>" as UC_ADM_06
    usecase "Xử lý yêu cầu cấp lại\nmật khẩu\n<size:10>UC-ADM-07</size>" as UC_ADM_07
    usecase "Xem nhật ký xử lý yêu\ncầu\n<size:10>UC-ADM-08</size>" as UC_ADM_08
    usecase "Xem lượt truy cập\n<size:10>UC-ADM-09</size>" as UC_ADM_09
  }
  package "Cấu hình hệ thống và thông báo chung" {
    usecase "Bật hoặc tắt tính năng\n<size:10>UC-ADM-24</size>" as UC_ADM_24
    usecase "Gửi thông báo tới người\ndùng\n<size:10>UC-ADM-25</size>" as UC_ADM_25
  }
}

A_ADMIN --> UC_ADM_01
A_ADMIN --> UC_ADM_02
A_ADMIN --> UC_ADM_03
A_ADMIN --> UC_ADM_04
A_ADMIN --> UC_ADM_05
A_ADMIN --> UC_ADM_06
A_ADMIN --> UC_ADM_07
A_ADMIN --> UC_ADM_08
A_ADMIN --> UC_ADM_09
A_ADMIN --> UC_ADM_24
A_ADMIN --> UC_ADM_25
@enduml
```

| ID | Use Case | Actor (association) | Trạng thái |
|---|---|---|---|
| UC-ADM-01 | Xem tổng quan hệ thống | Quản trị viên | Confirmed |
| UC-ADM-02 | Tìm kiếm và lọc tài khoản | Quản trị viên | Confirmed |
| UC-ADM-03 | Xem chi tiết tài khoản | Quản trị viên | Confirmed |
| UC-ADM-04 | Thay đổi vai trò tài khoản | Quản trị viên | Confirmed |
| UC-ADM-05 | Khoá hoặc mở khoá tài khoản | Quản trị viên | Confirmed |
| UC-ADM-06 | Xoá tài khoản | Quản trị viên | Confirmed |
| UC-ADM-07 | Xử lý yêu cầu cấp lại mật khẩu | Quản trị viên | Confirmed |
| UC-ADM-08 | Xem nhật ký xử lý yêu cầu | Quản trị viên | Confirmed |
| UC-ADM-09 | Xem lượt truy cập | Quản trị viên | Confirmed |
| UC-ADM-24 | Bật hoặc tắt tính năng | Quản trị viên | Confirmed |
| UC-ADM-25 | Gửi thông báo tới người dùng | Quản trị viên | Confirmed |

## Vai trò Quản trị viên — Phần 2 — Nội dung, nhóm lớp và cửa hàng

14 use case.

![Vai trò Quản trị viên — Phần 2 — Nội dung, nhóm lớp và cửa hàng](svg/role-admin-use-case-2.svg)

```plantuml
@startuml role-admin-use-case-2
left to right direction
skinparam shadowing false
skinparam defaultFontName Arial
skinparam defaultFontSize 12
skinparam packageStyle rectangle
skinparam ArrowColor #3B5B8C
skinparam usecase {
  BackgroundColor #FFFFFF
  BorderColor #3B5B8C
  BackgroundColor<<Partially Confirmed>> #FFF4D6
  BorderColor<<Partially Confirmed>> #B7791F
}
skinparam actor {
  BackgroundColor #FFFFFF
  BorderColor #3B5B8C
}
skinparam rectangle {
  BorderColor #1F3A60
  FontStyle bold
}
skinparam package {
  BorderColor #9AA9BF
  FontColor #1F3A60
}
title Vai trò Quản trị viên — Phần 2 — Nội dung, nhóm lớp và cửa hàng

actor "Quản trị viên" as A_ADMIN

rectangle "ENG//HABIT" {
  package "Quản trị nội dung và kiểm duyệt bộ thẻ" {
    usecase "Quản lý chủ đề hệ thống\n<size:10>UC-ADM-10</size>" as UC_ADM_10
    usecase "Quản lý từ vựng hệ thống\n<size:10>UC-ADM-11</size>" as UC_ADM_11
    usecase "Xem báo cáo vi phạm bộ\nthẻ\n<size:10>UC-ADM-12</size>" as UC_ADM_12
    usecase "Xem chi tiết bộ thẻ bị\nbáo cáo\n<size:10>UC-ADM-13</size>" as UC_ADM_13
    usecase "Chặn bộ thẻ\n<size:10>UC-ADM-14</size>" as UC_ADM_14
    usecase "Mở chặn bộ thẻ\n<size:10>UC-ADM-15</size>" as UC_ADM_15
    usecase "Bỏ qua báo cáo vi phạm\n<size:10>UC-ADM-16</size>" as UC_ADM_16
  }
  package "Quản trị nhóm lớp" {
    usecase "Tìm kiếm và lọc nhóm\n<size:10>UC-ADM-17</size>" as UC_ADM_17
    usecase "Xem chi tiết nhóm\n<size:10>UC-ADM-18</size>" as UC_ADM_18
    usecase "Gửi cảnh báo vi phạm tới\nnhóm\n<size:10>UC-ADM-19</size>" as UC_ADM_19
    usecase "Chặn nhóm\n<size:10>UC-ADM-20</size>" as UC_ADM_20
    usecase "Mở chặn nhóm\n<size:10>UC-ADM-21</size>" as UC_ADM_21
  }
  package "Quản trị cửa hàng" {
    usecase "Quản lý loại vật phẩm\n<size:10>UC-ADM-22</size>" as UC_ADM_22
    usecase "Quản lý vật phẩm\n<size:10>UC-ADM-23</size>" as UC_ADM_23
  }
}

A_ADMIN --> UC_ADM_10
A_ADMIN --> UC_ADM_11
A_ADMIN --> UC_ADM_12
A_ADMIN --> UC_ADM_13
A_ADMIN --> UC_ADM_14
A_ADMIN --> UC_ADM_15
A_ADMIN --> UC_ADM_16
A_ADMIN --> UC_ADM_17
A_ADMIN --> UC_ADM_18
A_ADMIN --> UC_ADM_19
A_ADMIN --> UC_ADM_20
A_ADMIN --> UC_ADM_21
A_ADMIN --> UC_ADM_22
A_ADMIN --> UC_ADM_23
@enduml
```

| ID | Use Case | Actor (association) | Trạng thái |
|---|---|---|---|
| UC-ADM-10 | Quản lý chủ đề hệ thống | Quản trị viên | Confirmed |
| UC-ADM-11 | Quản lý từ vựng hệ thống | Quản trị viên | Confirmed |
| UC-ADM-12 | Xem báo cáo vi phạm bộ thẻ | Quản trị viên | Confirmed |
| UC-ADM-13 | Xem chi tiết bộ thẻ bị báo cáo | Quản trị viên | Confirmed |
| UC-ADM-14 | Chặn bộ thẻ | Quản trị viên | Confirmed |
| UC-ADM-15 | Mở chặn bộ thẻ | Quản trị viên | Confirmed |
| UC-ADM-16 | Bỏ qua báo cáo vi phạm | Quản trị viên | Confirmed |
| UC-ADM-17 | Tìm kiếm và lọc nhóm | Quản trị viên | Confirmed |
| UC-ADM-18 | Xem chi tiết nhóm | Quản trị viên | Confirmed |
| UC-ADM-19 | Gửi cảnh báo vi phạm tới nhóm | Quản trị viên | Confirmed |
| UC-ADM-20 | Chặn nhóm | Quản trị viên | Confirmed |
| UC-ADM-21 | Mở chặn nhóm | Quản trị viên | Confirmed |
| UC-ADM-22 | Quản lý loại vật phẩm | Quản trị viên | Confirmed |
| UC-ADM-23 | Quản lý vật phẩm | Quản trị viên | Confirmed |

## Vai trò Quản trị viên — Phần 3 — Chức năng dùng chung với Người học

16 use case.

![Vai trò Quản trị viên — Phần 3 — Chức năng dùng chung với Người học](svg/role-admin-use-case-3.svg)

```plantuml
@startuml role-admin-use-case-3
left to right direction
skinparam shadowing false
skinparam defaultFontName Arial
skinparam defaultFontSize 12
skinparam packageStyle rectangle
skinparam ArrowColor #3B5B8C
skinparam usecase {
  BackgroundColor #FFFFFF
  BorderColor #3B5B8C
  BackgroundColor<<Partially Confirmed>> #FFF4D6
  BorderColor<<Partially Confirmed>> #B7791F
}
skinparam actor {
  BackgroundColor #FFFFFF
  BorderColor #3B5B8C
}
skinparam rectangle {
  BorderColor #1F3A60
  FontStyle bold
}
skinparam package {
  BorderColor #9AA9BF
  FontColor #1F3A60
}
title Vai trò Quản trị viên — Phần 3 — Chức năng dùng chung với Người học

actor "Người dùng đã xác thực" as A_AUTH <<abstract>>
actor "Quản trị viên" as A_ADMIN

rectangle "ENG//HABIT" {
  package "Xác thực và tài khoản cá nhân" {
    usecase "Đăng xuất\n<size:10>UC-AUTH-05</size>" as UC_AUTH_05
    usecase "Cập nhật thông tin cá\nnhân\n<size:10>UC-AUTH-06</size>" as UC_AUTH_06
    usecase "Quản lý ảnh đại diện\n<size:10>UC-AUTH-07</size>" as UC_AUTH_07
    usecase "Đổi mật khẩu\n<size:10>UC-AUTH-08</size>" as UC_AUTH_08
  }
  package "Cộng đồng" {
    usecase "Xem và tìm bài viết\n<size:10>UC-COM-01</size>" as UC_COM_01
    usecase "Xem chi tiết bài viết\n<size:10>UC-COM-02</size>" as UC_COM_02
    usecase "Đăng bài viết\n<size:10>UC-COM-03</size>" as UC_COM_03
    usecase "Bình luận bài viết\n<size:10>UC-COM-04</size>" as UC_COM_04
    usecase "Thả tim bài viết\n<size:10>UC-COM-05</size>" as UC_COM_05
    usecase "Xoá bài viết\n<size:10>UC-COM-06</size>" as UC_COM_06
    usecase "Xoá bình luận\n<size:10>UC-COM-07</size>" as UC_COM_07
    usecase "Tải tệp đính kèm\n<size:10>UC-COM-08</size>" as UC_COM_08
  }
  package "Nhóm lớp (tham chiếu)" {
    usecase "Đăng bài trong nhóm\n<size:10>UC-GRP-08</size>" as UC_GRP_08
    usecase "Xem tài liệu nhóm\n<size:10>UC-GRP-09</size>" as UC_GRP_09
  }
  package "Thông báo và nhắc nhở" {
    usecase "Xem thông báo\n<size:10>UC-NOTI-01</size>" as UC_NOTI_01
    usecase "Đánh dấu thông báo đã\nđọc\n<size:10>UC-NOTI-02</size>" as UC_NOTI_02
    usecase "Xoá thông báo\n<size:10>UC-NOTI-03</size>" as UC_NOTI_03
    usecase "Đăng ký thiết bị nhận\nthông báo đẩy\n<size:10>UC-NOTI-06</size>" as UC_NOTI_06 <<Partially Confirmed>>
  }
}

A_ADMIN --|> A_AUTH
A_AUTH --> UC_AUTH_05
A_AUTH --> UC_AUTH_06
A_AUTH --> UC_AUTH_07
A_AUTH --> UC_AUTH_08
A_AUTH --> UC_COM_01
A_AUTH --> UC_COM_02
A_AUTH --> UC_COM_03
A_AUTH --> UC_COM_04
A_AUTH --> UC_COM_05
A_AUTH --> UC_COM_06
A_AUTH --> UC_COM_07
A_AUTH --> UC_COM_08
A_AUTH --> UC_NOTI_01
A_AUTH --> UC_NOTI_02
A_AUTH --> UC_NOTI_03
A_AUTH --> UC_NOTI_06
UC_COM_08 .> UC_COM_02 : <<extend>>
UC_COM_08 .> UC_GRP_09 : <<extend>>
UC_GRP_08 --|> UC_COM_03
@enduml
```

| ID | Use Case | Actor (association) | Trạng thái |
|---|---|---|---|
| UC-AUTH-05 | Đăng xuất | Người dùng đã xác thực | Confirmed |
| UC-AUTH-06 | Cập nhật thông tin cá nhân | Người dùng đã xác thực | Confirmed |
| UC-AUTH-07 | Quản lý ảnh đại diện | Người dùng đã xác thực | Confirmed |
| UC-AUTH-08 | Đổi mật khẩu | Người dùng đã xác thực | Confirmed |
| UC-COM-01 | Xem và tìm bài viết | Người dùng đã xác thực | Confirmed |
| UC-COM-02 | Xem chi tiết bài viết | Người dùng đã xác thực | Confirmed |
| UC-COM-03 | Đăng bài viết | Người dùng đã xác thực | Confirmed |
| UC-COM-04 | Bình luận bài viết | Người dùng đã xác thực | Confirmed |
| UC-COM-05 | Thả tim bài viết | Người dùng đã xác thực | Confirmed |
| UC-COM-06 | Xoá bài viết | Người dùng đã xác thực | Confirmed |
| UC-COM-07 | Xoá bình luận | Người dùng đã xác thực | Confirmed |
| UC-COM-08 | Tải tệp đính kèm | Người dùng đã xác thực | Confirmed |
| UC-GRP-08 | Đăng bài trong nhóm | Người học | Confirmed |
| UC-GRP-09 | Xem tài liệu nhóm | Người học | Confirmed |
| UC-NOTI-01 | Xem thông báo | Người dùng đã xác thực | Confirmed |
| UC-NOTI-02 | Đánh dấu thông báo đã đọc | Người dùng đã xác thực | Confirmed |
| UC-NOTI-03 | Xoá thông báo | Người dùng đã xác thực | Confirmed |
| UC-NOTI-06 | Đăng ký thiết bị nhận thông báo đẩy | Người dùng đã xác thực | Partially Confirmed |
