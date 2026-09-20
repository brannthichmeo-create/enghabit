# Module HAB — Thói quen và mục tiêu

6 use case.

![Module HAB — Thói quen và mục tiêu](svg/module-habits-goals-use-case.svg)

**Cách đọc:** hình người là actor, hình elip là use case, khung ngoài là ranh giới hệ thống
`ENG//HABIT`, khung trong là module. Mũi tên liền từ actor tới use case là association;
mũi tên nét đứt `<<include>>` trỏ từ use case gốc tới use case luôn được gọi; `<<extend>>` trỏ từ
use case mở rộng tới use case gốc; mũi tên tam giác rỗng là generalization (con → cha).
Use case nền vàng mang nhãn `<<Partially Confirmed>>`: có bằng chứng ở mã nguồn nhưng chưa đủ
(xem cột Trạng thái trong `USE-CASE-INVENTORY.md`).

## Mã nguồn PlantUML

```plantuml
@startuml module-habits-goals-use-case
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
title Module HAB — Thói quen và mục tiêu

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
}

A_LEARNER --> UC_HAB_01
A_LEARNER --> UC_HAB_02
A_LEARNER --> UC_HAB_03
A_LEARNER --> UC_HAB_04
A_LEARNER --> UC_HAB_05
A_LEARNER --> UC_HAB_06
UC_HAB_03 .> UC_HAB_02 : <<extend>>
@enduml
```

## Use case trong sơ đồ

| ID | Use Case | Actor (association) | Trạng thái |
|---|---|---|---|
| UC-HAB-01 | Quản lý thói quen | Người học | Partially Confirmed |
| UC-HAB-02 | Check-in thói quen | Người học | Confirmed |
| UC-HAB-03 | Check-in bù thói quen | Người học | Partially Confirmed |
| UC-HAB-04 | Xem lịch sử và tỷ lệ hoàn thành thói quen | Người học | Confirmed |
| UC-HAB-05 | Quản lý mục tiêu | Người học | Confirmed |
| UC-HAB-06 | Xem tiến độ mục tiêu | Người học | Confirmed |
