# Module AUSR — Quản trị tài khoản và truy cập

9 use case.

![Module AUSR — Quản trị tài khoản và truy cập](svg/module-admin-accounts-use-case.svg)

**Cách đọc:** hình người là actor, hình elip là use case, khung ngoài là ranh giới hệ thống
`ENG//HABIT`, khung trong là module. Mũi tên liền từ actor tới use case là association;
mũi tên nét đứt `<<include>>` trỏ từ use case gốc tới use case luôn được gọi; `<<extend>>` trỏ từ
use case mở rộng tới use case gốc; mũi tên tam giác rỗng là generalization (con → cha).
Use case nền vàng mang nhãn `<<Partially Confirmed>>`: có bằng chứng ở mã nguồn nhưng chưa đủ
(xem cột Trạng thái trong `USE-CASE-INVENTORY.md`).

## Mã nguồn PlantUML

```plantuml
@startuml module-admin-accounts-use-case
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
title Module AUSR — Quản trị tài khoản và truy cập

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
@enduml
```

## Use case trong sơ đồ

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
