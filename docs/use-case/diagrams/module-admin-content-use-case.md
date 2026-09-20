# Module ACNT — Quản trị nội dung và kiểm duyệt bộ thẻ

7 use case.

![Module ACNT — Quản trị nội dung và kiểm duyệt bộ thẻ](svg/module-admin-content-use-case.svg)

**Cách đọc:** hình người là actor, hình elip là use case, khung ngoài là ranh giới hệ thống
`ENG//HABIT`, khung trong là module. Mũi tên liền từ actor tới use case là association;
mũi tên nét đứt `<<include>>` trỏ từ use case gốc tới use case luôn được gọi; `<<extend>>` trỏ từ
use case mở rộng tới use case gốc; mũi tên tam giác rỗng là generalization (con → cha).
Use case nền vàng mang nhãn `<<Partially Confirmed>>`: có bằng chứng ở mã nguồn nhưng chưa đủ
(xem cột Trạng thái trong `USE-CASE-INVENTORY.md`).

## Mã nguồn PlantUML

```plantuml
@startuml module-admin-content-use-case
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
title Module ACNT — Quản trị nội dung và kiểm duyệt bộ thẻ

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
}

A_ADMIN --> UC_ADM_10
A_ADMIN --> UC_ADM_11
A_ADMIN --> UC_ADM_12
A_ADMIN --> UC_ADM_13
A_ADMIN --> UC_ADM_14
A_ADMIN --> UC_ADM_15
A_ADMIN --> UC_ADM_16
@enduml
```

## Use case trong sơ đồ

| ID | Use Case | Actor (association) | Trạng thái |
|---|---|---|---|
| UC-ADM-10 | Quản lý chủ đề hệ thống | Quản trị viên | Confirmed |
| UC-ADM-11 | Quản lý từ vựng hệ thống | Quản trị viên | Confirmed |
| UC-ADM-12 | Xem báo cáo vi phạm bộ thẻ | Quản trị viên | Confirmed |
| UC-ADM-13 | Xem chi tiết bộ thẻ bị báo cáo | Quản trị viên | Confirmed |
| UC-ADM-14 | Chặn bộ thẻ | Quản trị viên | Confirmed |
| UC-ADM-15 | Mở chặn bộ thẻ | Quản trị viên | Confirmed |
| UC-ADM-16 | Bỏ qua báo cáo vi phạm | Quản trị viên | Confirmed |
