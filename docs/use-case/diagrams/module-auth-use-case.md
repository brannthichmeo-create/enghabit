# Module AUTH — Xác thực và tài khoản cá nhân

8 use case.

![Module AUTH — Xác thực và tài khoản cá nhân](svg/module-auth-use-case.svg)

**Cách đọc:** hình người là actor, hình elip là use case, khung ngoài là ranh giới hệ thống
`ENG//HABIT`, khung trong là module. Mũi tên liền từ actor tới use case là association;
mũi tên nét đứt `<<include>>` trỏ từ use case gốc tới use case luôn được gọi; `<<extend>>` trỏ từ
use case mở rộng tới use case gốc; mũi tên tam giác rỗng là generalization (con → cha).
Use case nền vàng mang nhãn `<<Partially Confirmed>>`: có bằng chứng ở mã nguồn nhưng chưa đủ
(xem cột Trạng thái trong `USE-CASE-INVENTORY.md`).

## Mã nguồn PlantUML

```plantuml
@startuml module-auth-use-case
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
title Module AUTH — Xác thực và tài khoản cá nhân

actor "Khách" as A_GUEST
actor "Người dùng đã xác thực" as A_AUTH <<abstract>>
actor "Người học" as A_LEARNER
actor "Quản trị viên" as A_ADMIN

rectangle "ENG//HABIT" {
  package "Xác thực và tài khoản cá nhân" {
    usecase "Đăng ký tài khoản\n<size:10>UC-AUTH-01</size>" as UC_AUTH_01
    usecase "Đăng nhập\n<size:10>UC-AUTH-02</size>" as UC_AUTH_02
    usecase "Yêu cầu cấp lại mật khẩu\n<size:10>UC-AUTH-03</size>" as UC_AUTH_03
    usecase "Đặt mật khẩu mới sau khi\nđược duyệt\n<size:10>UC-AUTH-04</size>" as UC_AUTH_04
    usecase "Đăng xuất\n<size:10>UC-AUTH-05</size>" as UC_AUTH_05
    usecase "Cập nhật thông tin cá\nnhân\n<size:10>UC-AUTH-06</size>" as UC_AUTH_06
    usecase "Quản lý ảnh đại diện\n<size:10>UC-AUTH-07</size>" as UC_AUTH_07
    usecase "Đổi mật khẩu\n<size:10>UC-AUTH-08</size>" as UC_AUTH_08
  }
}

A_LEARNER --|> A_AUTH
A_ADMIN --|> A_AUTH
A_GUEST --> UC_AUTH_01
A_GUEST --> UC_AUTH_02
A_GUEST --> UC_AUTH_03
A_GUEST --> UC_AUTH_04
A_AUTH --> UC_AUTH_05
A_AUTH --> UC_AUTH_06
A_AUTH --> UC_AUTH_07
A_AUTH --> UC_AUTH_08
UC_AUTH_04 .> UC_AUTH_03 : <<extend>>
@enduml
```

## Use case trong sơ đồ

| ID | Use Case | Actor (association) | Trạng thái |
|---|---|---|---|
| UC-AUTH-01 | Đăng ký tài khoản | Khách | Confirmed |
| UC-AUTH-02 | Đăng nhập | Khách | Confirmed |
| UC-AUTH-03 | Yêu cầu cấp lại mật khẩu | Khách | Confirmed |
| UC-AUTH-04 | Đặt mật khẩu mới sau khi được duyệt | Khách | Confirmed |
| UC-AUTH-05 | Đăng xuất | Người dùng đã xác thực | Confirmed |
| UC-AUTH-06 | Cập nhật thông tin cá nhân | Người dùng đã xác thực | Confirmed |
| UC-AUTH-07 | Quản lý ảnh đại diện | Người dùng đã xác thực | Confirmed |
| UC-AUTH-08 | Đổi mật khẩu | Người dùng đã xác thực | Confirmed |
