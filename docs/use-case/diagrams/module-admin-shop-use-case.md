# Module ASHP — Quản trị cửa hàng

2 use case.

![Module ASHP — Quản trị cửa hàng](svg/module-admin-shop-use-case.svg)

**Cách đọc:** hình người là actor, hình elip là use case, khung ngoài là ranh giới hệ thống
`ENG//HABIT`, khung trong là module. Mũi tên liền từ actor tới use case là association;
mũi tên nét đứt `<<include>>` trỏ từ use case gốc tới use case luôn được gọi; `<<extend>>` trỏ từ
use case mở rộng tới use case gốc; mũi tên tam giác rỗng là generalization (con → cha).
Use case nền vàng mang nhãn `<<Partially Confirmed>>`: có bằng chứng ở mã nguồn nhưng chưa đủ
(xem cột Trạng thái trong `USE-CASE-INVENTORY.md`).

## Mã nguồn PlantUML

```plantuml
@startuml module-admin-shop-use-case
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
title Module ASHP — Quản trị cửa hàng

actor "Quản trị viên" as A_ADMIN

rectangle "ENG//HABIT" {
  package "Quản trị cửa hàng" {
    usecase "Quản lý loại vật phẩm\n<size:10>UC-ADM-22</size>" as UC_ADM_22
    usecase "Quản lý vật phẩm\n<size:10>UC-ADM-23</size>" as UC_ADM_23
  }
}

A_ADMIN --> UC_ADM_22
A_ADMIN --> UC_ADM_23
@enduml
```

## Use case trong sơ đồ

| ID | Use Case | Actor (association) | Trạng thái |
|---|---|---|---|
| UC-ADM-22 | Quản lý loại vật phẩm | Quản trị viên | Confirmed |
| UC-ADM-23 | Quản lý vật phẩm | Quản trị viên | Confirmed |
