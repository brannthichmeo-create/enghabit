# Module AGRP — Quản trị nhóm lớp

5 use case.

![Module AGRP — Quản trị nhóm lớp](svg/module-admin-groups-use-case.svg)

**Cách đọc:** hình người là actor, hình elip là use case, khung ngoài là ranh giới hệ thống
`ENG//HABIT`, khung trong là module. Mũi tên liền từ actor tới use case là association;
mũi tên nét đứt `<<include>>` trỏ từ use case gốc tới use case luôn được gọi; `<<extend>>` trỏ từ
use case mở rộng tới use case gốc; mũi tên tam giác rỗng là generalization (con → cha).
Use case nền vàng mang nhãn `<<Partially Confirmed>>`: có bằng chứng ở mã nguồn nhưng chưa đủ
(xem cột Trạng thái trong `USE-CASE-INVENTORY.md`).

## Mã nguồn PlantUML

```plantuml
@startuml module-admin-groups-use-case
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
title Module AGRP — Quản trị nhóm lớp

actor "Quản trị viên" as A_ADMIN

rectangle "ENG//HABIT" {
  package "Quản trị nhóm lớp" {
    usecase "Tìm kiếm và lọc nhóm\n<size:10>UC-ADM-17</size>" as UC_ADM_17
    usecase "Xem chi tiết nhóm\n<size:10>UC-ADM-18</size>" as UC_ADM_18
    usecase "Gửi cảnh báo vi phạm tới\nnhóm\n<size:10>UC-ADM-19</size>" as UC_ADM_19
    usecase "Chặn nhóm\n<size:10>UC-ADM-20</size>" as UC_ADM_20
    usecase "Mở chặn nhóm\n<size:10>UC-ADM-21</size>" as UC_ADM_21
  }
}

A_ADMIN --> UC_ADM_17
A_ADMIN --> UC_ADM_18
A_ADMIN --> UC_ADM_19
A_ADMIN --> UC_ADM_20
A_ADMIN --> UC_ADM_21
@enduml
```

## Use case trong sơ đồ

| ID | Use Case | Actor (association) | Trạng thái |
|---|---|---|---|
| UC-ADM-17 | Tìm kiếm và lọc nhóm | Quản trị viên | Confirmed |
| UC-ADM-18 | Xem chi tiết nhóm | Quản trị viên | Confirmed |
| UC-ADM-19 | Gửi cảnh báo vi phạm tới nhóm | Quản trị viên | Confirmed |
| UC-ADM-20 | Chặn nhóm | Quản trị viên | Confirmed |
| UC-ADM-21 | Mở chặn nhóm | Quản trị viên | Confirmed |
