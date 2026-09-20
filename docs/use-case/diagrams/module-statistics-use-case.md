# Module STAT — Thống kê và xếp hạng

3 use case.

![Module STAT — Thống kê và xếp hạng](svg/module-statistics-use-case.svg)

**Cách đọc:** hình người là actor, hình elip là use case, khung ngoài là ranh giới hệ thống
`ENG//HABIT`, khung trong là module. Mũi tên liền từ actor tới use case là association;
mũi tên nét đứt `<<include>>` trỏ từ use case gốc tới use case luôn được gọi; `<<extend>>` trỏ từ
use case mở rộng tới use case gốc; mũi tên tam giác rỗng là generalization (con → cha).
Use case nền vàng mang nhãn `<<Partially Confirmed>>`: có bằng chứng ở mã nguồn nhưng chưa đủ
(xem cột Trạng thái trong `USE-CASE-INVENTORY.md`).

## Mã nguồn PlantUML

```plantuml
@startuml module-statistics-use-case
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
title Module STAT — Thống kê và xếp hạng

actor "Người học" as A_LEARNER

rectangle "ENG//HABIT" {
  package "Thống kê và xếp hạng" {
    usecase "Xem tổng quan học tập\n<size:10>UC-STAT-01</size>" as UC_STAT_01
    usecase "Xem báo cáo học tập\n<size:10>UC-STAT-02</size>" as UC_STAT_02
    usecase "Xem bảng xếp hạng\n<size:10>UC-STAT-03</size>" as UC_STAT_03
  }
}

A_LEARNER --> UC_STAT_01
A_LEARNER --> UC_STAT_02
A_LEARNER --> UC_STAT_03
@enduml
```

## Use case trong sơ đồ

| ID | Use Case | Actor (association) | Trạng thái |
|---|---|---|---|
| UC-STAT-01 | Xem tổng quan học tập | Người học | Confirmed |
| UC-STAT-02 | Xem báo cáo học tập | Người học | Confirmed |
| UC-STAT-03 | Xem bảng xếp hạng | Người học | Confirmed |
