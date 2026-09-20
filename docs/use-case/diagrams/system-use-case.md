# ENG//HABIT — Use Case mức hệ thống

Sơ đồ tổng quan: mỗi hình elip là một **use case tóm tắt** (summary-level) đại diện cho cả
một module; chi tiết nằm ở sơ đồ module tương ứng. Association ở đây được **suy ra** từ các
use case chi tiết: actor nối với module khi actor đó có ít nhất một use case trong module.
Actor phụ OneSignal nối theo chiều từ hệ thống ra.

![ENG//HABIT — Use Case mức hệ thống](svg/system-use-case.svg)

**Cách đọc:** hình người là actor, hình elip là use case, khung ngoài là ranh giới hệ thống
`ENG//HABIT`, khung trong là module. Mũi tên liền từ actor tới use case là association;
mũi tên nét đứt `<<include>>` trỏ từ use case gốc tới use case luôn được gọi; `<<extend>>` trỏ từ
use case mở rộng tới use case gốc; mũi tên tam giác rỗng là generalization (con → cha).
Use case nền vàng mang nhãn `<<Partially Confirmed>>`: có bằng chứng ở mã nguồn nhưng chưa đủ
(xem cột Trạng thái trong `USE-CASE-INVENTORY.md`).

## Mã nguồn PlantUML

```plantuml
@startuml system-use-case
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
title ENG//HABIT — Sơ đồ Use Case mức hệ thống

actor "Khách" as A_GUEST
actor "Người dùng đã xác thực" as A_AUTH <<abstract>>
actor "Người học" as A_LEARNER
actor "Trưởng nhóm" as A_LEADER
actor "Quản trị viên" as A_ADMIN
actor "Bộ lập lịch hệ thống" as A_SCHED
actor "OneSignal" as A_PUSH <<External System>>

rectangle "ENG//HABIT" {
  usecase "Xác thực và quản lý\ntài khoản cá nhân\n<size:10>AUTH</size>" as M_AUTH
  usecase "Quản lý thư viện bộ\nthẻ\n<size:10>LIB</size>" as M_LIB
  usecase "Học và ôn tập từ vựng\n<size:10>STU</size>" as M_STU
  usecase "Theo dõi thói quen và\nmục tiêu\n<size:10>HAB</size>" as M_HAB
  usecase "Xem thống kê và xếp\nhạng\n<size:10>STAT</size>" as M_STAT
  usecase "Nhận phần thưởng và\ngiữ chuỗi\n<size:10>REW</size>" as M_REW
  usecase "Mua và dùng vật phẩm\n<size:10>SHOP</size>" as M_SHOP
  usecase "Trao đổi trên cộng\nđồng\n<size:10>COM</size>" as M_COM
  usecase "Tham gia và điều hành\nnhóm lớp\n<size:10>GRP</size>" as M_GRP
  usecase "Nhận thông báo và nhắc\nnhở\n<size:10>NOTI</size>" as M_NOTI
  usecase "Quản trị tài khoản và\ntruy cập\n<size:10>AUSR</size>" as M_AUSR
  usecase "Quản trị nội dung học\ntập\n<size:10>ACNT</size>" as M_ACNT
  usecase "Kiểm soát nhóm lớp\n<size:10>AGRP</size>" as M_AGRP
  usecase "Quản trị danh mục cửa\nhàng\n<size:10>ASHP</size>" as M_ASHP
  usecase "Cấu hình hệ thống\n<size:10>ASYS</size>" as M_ASYS
}

A_LEARNER --|> A_AUTH
A_ADMIN --|> A_AUTH
A_LEADER --|> A_LEARNER
A_GUEST --> M_AUTH
A_AUTH --> M_AUTH
A_LEARNER --> M_LIB
A_LEARNER --> M_STU
A_LEARNER --> M_HAB
A_LEARNER --> M_STAT
A_LEARNER --> M_REW
A_SCHED --> M_REW
A_LEARNER --> M_SHOP
A_AUTH --> M_COM
A_LEARNER --> M_GRP
A_LEADER --> M_GRP
A_AUTH --> M_NOTI
A_LEARNER --> M_NOTI
A_SCHED --> M_NOTI
A_ADMIN --> M_AUSR
A_ADMIN --> M_ACNT
A_ADMIN --> M_AGRP
A_ADMIN --> M_ASHP
A_ADMIN --> M_ASYS
M_NOTI --> A_PUSH
@enduml
```

## Use case tóm tắt

| Mã | Use case tóm tắt | Module | Số use case chi tiết | Sơ đồ chi tiết |
|---|---|---|---|---|
| AUTH | Xác thực và quản lý tài khoản cá nhân | Xác thực và tài khoản cá nhân | 8 | [module-auth-use-case.md](module-auth-use-case.md) |
| LIB | Quản lý thư viện bộ thẻ | Thư viện bộ thẻ | 9 | [module-library-use-case.md](module-library-use-case.md) |
| STU | Học và ôn tập từ vựng | Học và ôn tập | 7 | [module-study-use-case.md](module-study-use-case.md) |
| HAB | Theo dõi thói quen và mục tiêu | Thói quen và mục tiêu | 6 | [module-habits-goals-use-case.md](module-habits-goals-use-case.md) |
| STAT | Xem thống kê và xếp hạng | Thống kê và xếp hạng | 3 | [module-statistics-use-case.md](module-statistics-use-case.md) |
| REW | Nhận phần thưởng và giữ chuỗi | Phần thưởng | 4 | [module-rewards-use-case.md](module-rewards-use-case.md) |
| SHOP | Mua và dùng vật phẩm | Cửa hàng, ví và kho vật phẩm | 6 | [module-shop-use-case.md](module-shop-use-case.md) |
| COM | Trao đổi trên cộng đồng | Cộng đồng | 8 | [module-community-use-case.md](module-community-use-case.md) |
| GRP | Tham gia và điều hành nhóm lớp | Nhóm lớp | 18 | [module-groups-use-case.md](module-groups-use-case.md) |
| NOTI | Nhận thông báo và nhắc nhở | Thông báo và nhắc nhở | 8 | [module-notifications-use-case.md](module-notifications-use-case.md) |
| AUSR | Quản trị tài khoản và truy cập | Quản trị tài khoản và truy cập | 9 | [module-admin-accounts-use-case.md](module-admin-accounts-use-case.md) |
| ACNT | Quản trị nội dung học tập | Quản trị nội dung và kiểm duyệt bộ thẻ | 7 | [module-admin-content-use-case.md](module-admin-content-use-case.md) |
| AGRP | Kiểm soát nhóm lớp | Quản trị nhóm lớp | 5 | [module-admin-groups-use-case.md](module-admin-groups-use-case.md) |
| ASHP | Quản trị danh mục cửa hàng | Quản trị cửa hàng | 2 | [module-admin-shop-use-case.md](module-admin-shop-use-case.md) |
| ASYS | Cấu hình hệ thống | Cấu hình hệ thống và thông báo chung | 2 | [module-admin-system-use-case.md](module-admin-system-use-case.md) |
