# Vai trò Người học

Mọi use case một tài khoản `USER` dùng được: các use case gắn với Người học, cộng các use case gắn với actor cha Người dùng đã xác thực (vẽ qua quan hệ generalization). Không gồm quyền Trưởng nhóm — xem `role-group-leader-use-case.md`.

Tổng số use case của vai trò trong tài liệu này: 60, chia thành 5 sơ đồ theo nhóm module để giữ sơ đồ dễ đọc.

**Cách đọc:** hình người là actor, hình elip là use case, khung ngoài là ranh giới hệ thống
`ENG//HABIT`, khung trong là module. Mũi tên liền từ actor tới use case là association;
mũi tên nét đứt `<<include>>` trỏ từ use case gốc tới use case luôn được gọi; `<<extend>>` trỏ từ
use case mở rộng tới use case gốc; mũi tên tam giác rỗng là generalization (con → cha).
Use case nền vàng mang nhãn `<<Partially Confirmed>>`: có bằng chứng ở mã nguồn nhưng chưa đủ
(xem cột Trạng thái trong `USE-CASE-INVENTORY.md`).

## Vai trò Người học — Phần 1 — Thư viện, Học và Ôn tập

14 use case.

![Vai trò Người học — Phần 1 — Thư viện, Học và Ôn tập](svg/role-learner-use-case-1.svg)

```plantuml
@startuml role-learner-use-case-1
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
title Vai trò Người học — Phần 1 — Thư viện, Học và Ôn tập

actor "Người học" as A_LEARNER

rectangle "ENG//HABIT" {
  package "Thư viện bộ thẻ" {
    usecase "Tìm kiếm bộ thẻ công\nkhai\n<size:10>UC-LIB-01</size>" as UC_LIB_01
    usecase "Xem bộ thẻ của tôi\n<size:10>UC-LIB-02</size>" as UC_LIB_02
    usecase "Xem chi tiết bộ thẻ\n<size:10>UC-LIB-03</size>" as UC_LIB_03
    usecase "Quản lý bộ thẻ của tôi\n<size:10>UC-LIB-04</size>" as UC_LIB_04
    usecase "Nhập bộ thẻ mới từ tệp\n<size:10>UC-LIB-05</size>" as UC_LIB_05
    usecase "Quản lý thẻ trong bộ\n<size:10>UC-LIB-06</size>" as UC_LIB_06
    usecase "Nhập thẻ từ tệp vào bộ\n<size:10>UC-LIB-07</size>" as UC_LIB_07
    usecase "Chia sẻ liên kết bộ thẻ\n<size:10>UC-LIB-08</size>" as UC_LIB_08
    usecase "Báo cáo vi phạm bộ thẻ\n<size:10>UC-LIB-09</size>" as UC_LIB_09
  }
  package "Học và ôn tập" {
    usecase "Học bộ thẻ\n<size:10>UC-STU-01</size>" as UC_STU_01
    usecase "Ôn tập thẻ theo lịch\n<size:10>UC-STU-02</size>" as UC_STU_02
    usecase "Ôn nhanh (Cram)\n<size:10>UC-STU-03</size>" as UC_STU_03
    usecase "Trả lời và chấm thẻ\n<size:10>UC-STU-04</size>" as UC_STU_04
    usecase "Ghi nhận hoàn thành\nphiên học\n<size:10>UC-STU-05</size>" as UC_STU_05
    usecase "Xem thống kê học và ôn\n<size:10>UC-STU-06</size>" as UC_STU_06
    usecase "Xem lịch sử ôn tập\n<size:10>UC-STU-07</size>" as UC_STU_07
  }
}

A_LEARNER --> UC_LIB_01
A_LEARNER --> UC_LIB_02
A_LEARNER --> UC_LIB_03
A_LEARNER --> UC_LIB_04
A_LEARNER --> UC_LIB_05
A_LEARNER --> UC_LIB_06
A_LEARNER --> UC_LIB_07
A_LEARNER --> UC_LIB_08
A_LEARNER --> UC_LIB_09
A_LEARNER --> UC_STU_01
A_LEARNER --> UC_STU_02
A_LEARNER --> UC_STU_03
A_LEARNER --> UC_STU_06
A_LEARNER --> UC_STU_07
UC_STU_01 .> UC_STU_04 : <<include>>
UC_STU_02 .> UC_STU_04 : <<include>>
UC_STU_03 .> UC_STU_04 : <<include>>
UC_LIB_08 .> UC_LIB_03 : <<extend>>
UC_LIB_09 .> UC_LIB_03 : <<extend>>
UC_STU_05 .> UC_STU_01 : <<extend>>
@enduml
```

| ID | Use Case | Actor (association) | Trạng thái |
|---|---|---|---|
| UC-LIB-01 | Tìm kiếm bộ thẻ công khai | Người học | Confirmed |
| UC-LIB-02 | Xem bộ thẻ của tôi | Người học | Confirmed |
| UC-LIB-03 | Xem chi tiết bộ thẻ | Người học | Confirmed |
| UC-LIB-04 | Quản lý bộ thẻ của tôi | Người học | Confirmed |
| UC-LIB-05 | Nhập bộ thẻ mới từ tệp | Người học | Confirmed |
| UC-LIB-06 | Quản lý thẻ trong bộ | Người học | Confirmed |
| UC-LIB-07 | Nhập thẻ từ tệp vào bộ | Người học | Confirmed |
| UC-LIB-08 | Chia sẻ liên kết bộ thẻ | Người học | Confirmed |
| UC-LIB-09 | Báo cáo vi phạm bộ thẻ | Người học | Confirmed |
| UC-STU-01 | Học bộ thẻ | Người học | Confirmed |
| UC-STU-02 | Ôn tập thẻ theo lịch | Người học | Confirmed |
| UC-STU-03 | Ôn nhanh (Cram) | Người học | Confirmed |
| UC-STU-04 | Trả lời và chấm thẻ | — (chỉ qua quan hệ) | Confirmed |
| UC-STU-05 | Ghi nhận hoàn thành phiên học | — (chỉ qua quan hệ) | Confirmed |
| UC-STU-06 | Xem thống kê học và ôn | Người học | Confirmed |
| UC-STU-07 | Xem lịch sử ôn tập | Người học | Confirmed |

## Vai trò Người học — Phần 2 — Thói quen, Mục tiêu, Thống kê

9 use case.

![Vai trò Người học — Phần 2 — Thói quen, Mục tiêu, Thống kê](svg/role-learner-use-case-2.svg)

```plantuml
@startuml role-learner-use-case-2
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
title Vai trò Người học — Phần 2 — Thói quen, Mục tiêu, Thống kê

actor "Người học" as A_LEARNER

rectangle "ENG//HABIT" {
  package "Thói quen và mục tiêu" {
    usecase "Quản lý thói quen\n<size:10>UC-HAB-01</size>" as UC_HAB_01 <<Partially Confirmed>>
    usecase "Check-in thói quen\n<size:10>UC-HAB-02</size>" as UC_HAB_02
    usecase "Check-in bù thói quen\n<size:10>UC-HAB-03</size>" as UC_HAB_03 <<Partially Confirmed>>
    usecase "Xem lịch sử và tỷ lệ\nhoàn thành thói quen\n<size:10>UC-HAB-04</size>" as UC_HAB_04
    usecase "Quản lý mục tiêu\n<size:10>UC-HAB-05</size>" as UC_HAB_05
    usecase "Xem tiến độ mục tiêu\n<size:10>UC-HAB-06</size>" as UC_HAB_06
  }
  package "Thống kê và xếp hạng" {
    usecase "Xem tổng quan học tập\n<size:10>UC-STAT-01</size>" as UC_STAT_01
    usecase "Xem báo cáo học tập\n<size:10>UC-STAT-02</size>" as UC_STAT_02
    usecase "Xem bảng xếp hạng\n<size:10>UC-STAT-03</size>" as UC_STAT_03
  }
}

A_LEARNER --> UC_HAB_01
A_LEARNER --> UC_HAB_02
A_LEARNER --> UC_HAB_03
A_LEARNER --> UC_HAB_04
A_LEARNER --> UC_HAB_05
A_LEARNER --> UC_HAB_06
A_LEARNER --> UC_STAT_01
A_LEARNER --> UC_STAT_02
A_LEARNER --> UC_STAT_03
UC_HAB_03 .> UC_HAB_02 : <<extend>>
@enduml
```

| ID | Use Case | Actor (association) | Trạng thái |
|---|---|---|---|
| UC-HAB-01 | Quản lý thói quen | Người học | Partially Confirmed |
| UC-HAB-02 | Check-in thói quen | Người học | Confirmed |
| UC-HAB-03 | Check-in bù thói quen | Người học | Partially Confirmed |
| UC-HAB-04 | Xem lịch sử và tỷ lệ hoàn thành thói quen | Người học | Confirmed |
| UC-HAB-05 | Quản lý mục tiêu | Người học | Confirmed |
| UC-HAB-06 | Xem tiến độ mục tiêu | Người học | Confirmed |
| UC-STAT-01 | Xem tổng quan học tập | Người học | Confirmed |
| UC-STAT-02 | Xem báo cáo học tập | Người học | Confirmed |
| UC-STAT-03 | Xem bảng xếp hạng | Người học | Confirmed |

## Vai trò Người học — Phần 3 — Phần thưởng và Cửa hàng

9 use case.

![Vai trò Người học — Phần 3 — Phần thưởng và Cửa hàng](svg/role-learner-use-case-3.svg)

```plantuml
@startuml role-learner-use-case-3
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
title Vai trò Người học — Phần 3 — Phần thưởng và Cửa hàng

actor "Người học" as A_LEARNER

rectangle "ENG//HABIT" {
  package "Phần thưởng" {
    usecase "Điểm danh nhận xu\n<size:10>UC-REW-01</size>" as UC_REW_01
    usecase "Nhận thưởng nhiệm vụ\nngày\n<size:10>UC-REW-02</size>" as UC_REW_02
    usecase "Mua vật phẩm giữ chuỗi\n<size:10>UC-REW-03</size>" as UC_REW_03
  }
  package "Cửa hàng, ví và kho vật phẩm" {
    usecase "Xem và tìm vật phẩm\n<size:10>UC-SHOP-01</size>" as UC_SHOP_01
    usecase "Mua vật phẩm\n<size:10>UC-SHOP-02</size>" as UC_SHOP_02
    usecase "Đánh dấu yêu thích vật\nphẩm\n<size:10>UC-SHOP-03</size>" as UC_SHOP_03
    usecase "Xem kho vật phẩm\n<size:10>UC-SHOP-04</size>" as UC_SHOP_04
    usecase "Sử dụng hoặc bỏ dùng vật\nphẩm\n<size:10>UC-SHOP-05</size>" as UC_SHOP_05
    usecase "Xem ví xu\n<size:10>UC-SHOP-06</size>" as UC_SHOP_06
  }
}

A_LEARNER --> UC_REW_01
A_LEARNER --> UC_REW_02
A_LEARNER --> UC_REW_03
A_LEARNER --> UC_SHOP_01
A_LEARNER --> UC_SHOP_02
A_LEARNER --> UC_SHOP_03
A_LEARNER --> UC_SHOP_04
A_LEARNER --> UC_SHOP_05
A_LEARNER --> UC_SHOP_06
@enduml
```

| ID | Use Case | Actor (association) | Trạng thái |
|---|---|---|---|
| UC-REW-01 | Điểm danh nhận xu | Người học | Confirmed |
| UC-REW-02 | Nhận thưởng nhiệm vụ ngày | Người học | Confirmed |
| UC-REW-03 | Mua vật phẩm giữ chuỗi | Người học | Confirmed |
| UC-SHOP-01 | Xem và tìm vật phẩm | Người học | Confirmed |
| UC-SHOP-02 | Mua vật phẩm | Người học | Confirmed |
| UC-SHOP-03 | Đánh dấu yêu thích vật phẩm | Người học | Confirmed |
| UC-SHOP-04 | Xem kho vật phẩm | Người học | Confirmed |
| UC-SHOP-05 | Sử dụng hoặc bỏ dùng vật phẩm | Người học | Confirmed |
| UC-SHOP-06 | Xem ví xu | Người học | Confirmed |

## Vai trò Người học — Phần 4 — Cộng đồng và Nhóm lớp

18 use case.

![Vai trò Người học — Phần 4 — Cộng đồng và Nhóm lớp](svg/role-learner-use-case-4.svg)

```plantuml
@startuml role-learner-use-case-4
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
title Vai trò Người học — Phần 4 — Cộng đồng và Nhóm lớp

actor "Người dùng đã xác thực" as A_AUTH <<abstract>>
actor "Người học" as A_LEARNER

rectangle "ENG//HABIT" {
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
  package "Nhóm lớp" {
    usecase "Xem nhóm của tôi\n<size:10>UC-GRP-01</size>" as UC_GRP_01
    usecase "Tìm nhóm công khai\n<size:10>UC-GRP-02</size>" as UC_GRP_02
    usecase "Tìm nhóm bằng mã\n<size:10>UC-GRP-03</size>" as UC_GRP_03
    usecase "Tạo nhóm\n<size:10>UC-GRP-04</size>" as UC_GRP_04
    usecase "Tham gia nhóm\n<size:10>UC-GRP-05</size>" as UC_GRP_05
    usecase "Rời nhóm\n<size:10>UC-GRP-06</size>" as UC_GRP_06
    usecase "Xem bảng tin nhóm\n<size:10>UC-GRP-07</size>" as UC_GRP_07
    usecase "Đăng bài trong nhóm\n<size:10>UC-GRP-08</size>" as UC_GRP_08
    usecase "Xem tài liệu nhóm\n<size:10>UC-GRP-09</size>" as UC_GRP_09
    usecase "Xem bộ thẻ của nhóm\n<size:10>UC-GRP-10</size>" as UC_GRP_10
  }
}

A_LEARNER --|> A_AUTH
A_AUTH --> UC_COM_01
A_AUTH --> UC_COM_02
A_AUTH --> UC_COM_03
A_AUTH --> UC_COM_04
A_AUTH --> UC_COM_05
A_AUTH --> UC_COM_06
A_AUTH --> UC_COM_07
A_AUTH --> UC_COM_08
A_LEARNER --> UC_GRP_01
A_LEARNER --> UC_GRP_02
A_LEARNER --> UC_GRP_03
A_LEARNER --> UC_GRP_04
A_LEARNER --> UC_GRP_05
A_LEARNER --> UC_GRP_06
A_LEARNER --> UC_GRP_07
A_LEARNER --> UC_GRP_08
A_LEARNER --> UC_GRP_09
A_LEARNER --> UC_GRP_10
UC_GRP_05 .> UC_GRP_02 : <<extend>>
UC_GRP_05 .> UC_GRP_03 : <<extend>>
UC_COM_08 .> UC_COM_02 : <<extend>>
UC_COM_08 .> UC_GRP_09 : <<extend>>
UC_GRP_08 --|> UC_COM_03
@enduml
```

| ID | Use Case | Actor (association) | Trạng thái |
|---|---|---|---|
| UC-COM-01 | Xem và tìm bài viết | Người dùng đã xác thực | Confirmed |
| UC-COM-02 | Xem chi tiết bài viết | Người dùng đã xác thực | Confirmed |
| UC-COM-03 | Đăng bài viết | Người dùng đã xác thực | Confirmed |
| UC-COM-04 | Bình luận bài viết | Người dùng đã xác thực | Confirmed |
| UC-COM-05 | Thả tim bài viết | Người dùng đã xác thực | Confirmed |
| UC-COM-06 | Xoá bài viết | Người dùng đã xác thực | Confirmed |
| UC-COM-07 | Xoá bình luận | Người dùng đã xác thực | Confirmed |
| UC-COM-08 | Tải tệp đính kèm | Người dùng đã xác thực | Confirmed |
| UC-GRP-01 | Xem nhóm của tôi | Người học | Confirmed |
| UC-GRP-02 | Tìm nhóm công khai | Người học | Confirmed |
| UC-GRP-03 | Tìm nhóm bằng mã | Người học | Confirmed |
| UC-GRP-04 | Tạo nhóm | Người học | Confirmed |
| UC-GRP-05 | Tham gia nhóm | Người học | Confirmed |
| UC-GRP-06 | Rời nhóm | Người học | Confirmed |
| UC-GRP-07 | Xem bảng tin nhóm | Người học | Confirmed |
| UC-GRP-08 | Đăng bài trong nhóm | Người học | Confirmed |
| UC-GRP-09 | Xem tài liệu nhóm | Người học | Confirmed |
| UC-GRP-10 | Xem bộ thẻ của nhóm | Người học | Confirmed |

## Vai trò Người học — Phần 5 — Tài khoản và Thông báo

10 use case.

![Vai trò Người học — Phần 5 — Tài khoản và Thông báo](svg/role-learner-use-case-5.svg)

```plantuml
@startuml role-learner-use-case-5
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
title Vai trò Người học — Phần 5 — Tài khoản và Thông báo

actor "Người dùng đã xác thực" as A_AUTH <<abstract>>
actor "Người học" as A_LEARNER

rectangle "ENG//HABIT" {
  package "Xác thực và tài khoản cá nhân" {
    usecase "Đăng xuất\n<size:10>UC-AUTH-05</size>" as UC_AUTH_05
    usecase "Cập nhật thông tin cá\nnhân\n<size:10>UC-AUTH-06</size>" as UC_AUTH_06
    usecase "Quản lý ảnh đại diện\n<size:10>UC-AUTH-07</size>" as UC_AUTH_07
    usecase "Đổi mật khẩu\n<size:10>UC-AUTH-08</size>" as UC_AUTH_08
  }
  package "Thông báo và nhắc nhở" {
    usecase "Xem thông báo\n<size:10>UC-NOTI-01</size>" as UC_NOTI_01
    usecase "Đánh dấu thông báo đã\nđọc\n<size:10>UC-NOTI-02</size>" as UC_NOTI_02
    usecase "Xoá thông báo\n<size:10>UC-NOTI-03</size>" as UC_NOTI_03
    usecase "Cấu hình nhắc nhở\n<size:10>UC-NOTI-04</size>" as UC_NOTI_04
    usecase "Quản lý mốc nhắc học\n<size:10>UC-NOTI-05</size>" as UC_NOTI_05
    usecase "Đăng ký thiết bị nhận\nthông báo đẩy\n<size:10>UC-NOTI-06</size>" as UC_NOTI_06 <<Partially Confirmed>>
  }
}

A_LEARNER --|> A_AUTH
A_AUTH --> UC_AUTH_05
A_AUTH --> UC_AUTH_06
A_AUTH --> UC_AUTH_07
A_AUTH --> UC_AUTH_08
A_AUTH --> UC_NOTI_01
A_AUTH --> UC_NOTI_02
A_AUTH --> UC_NOTI_03
A_LEARNER --> UC_NOTI_04
A_LEARNER --> UC_NOTI_05
A_AUTH --> UC_NOTI_06
@enduml
```

| ID | Use Case | Actor (association) | Trạng thái |
|---|---|---|---|
| UC-AUTH-05 | Đăng xuất | Người dùng đã xác thực | Confirmed |
| UC-AUTH-06 | Cập nhật thông tin cá nhân | Người dùng đã xác thực | Confirmed |
| UC-AUTH-07 | Quản lý ảnh đại diện | Người dùng đã xác thực | Confirmed |
| UC-AUTH-08 | Đổi mật khẩu | Người dùng đã xác thực | Confirmed |
| UC-NOTI-01 | Xem thông báo | Người dùng đã xác thực | Confirmed |
| UC-NOTI-02 | Đánh dấu thông báo đã đọc | Người dùng đã xác thực | Confirmed |
| UC-NOTI-03 | Xoá thông báo | Người dùng đã xác thực | Confirmed |
| UC-NOTI-04 | Cấu hình nhắc nhở | Người học | Confirmed |
| UC-NOTI-05 | Quản lý mốc nhắc học | Người học | Confirmed |
| UC-NOTI-06 | Đăng ký thiết bị nhận thông báo đẩy | Người dùng đã xác thực | Partially Confirmed |
