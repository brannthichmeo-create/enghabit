# Module ASYS — Cấu hình hệ thống và thông báo chung

2 use case.

![Module ASYS — Cấu hình hệ thống và thông báo chung](svg/module-admin-system-use-case.svg)

**Cách đọc:** hình người là actor, hình elip là use case, khung ngoài là ranh giới hệ thống
`ENG//HABIT`, khung trong là module. Mũi tên liền từ actor tới use case là association;
mũi tên nét đứt `<<include>>` trỏ từ use case gốc tới use case luôn được gọi; `<<extend>>` trỏ từ
use case mở rộng tới use case gốc; mũi tên tam giác rỗng là generalization (con → cha).
Use case nền vàng mang nhãn `<<Partially Confirmed>>`: có bằng chứng ở mã nguồn nhưng chưa đủ
(xem cột Trạng thái trong `USE-CASE-INVENTORY.md`).

## Mã nguồn PlantUML

```plantuml
@startuml module-admin-system-use-case
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
title Module ASYS — Cấu hình hệ thống và thông báo chung

actor "Quản trị viên" as A_ADMIN

rectangle "ENG//HABIT" {
  package "Cấu hình hệ thống và thông báo chung" {
    usecase "Bật hoặc tắt tính năng\n<size:10>UC-ADM-24</size>" as UC_ADM_24
    usecase "Gửi thông báo tới người\ndùng\n<size:10>UC-ADM-25</size>" as UC_ADM_25
  }
}

A_ADMIN --> UC_ADM_24
A_ADMIN --> UC_ADM_25
@enduml
```

## Use case trong sơ đồ

| ID | Use Case | Actor (association) | Trạng thái |
|---|---|---|---|
| UC-ADM-24 | Bật hoặc tắt tính năng | Quản trị viên | Confirmed |
| UC-ADM-25 | Gửi thông báo tới người dùng | Quản trị viên | Confirmed |
