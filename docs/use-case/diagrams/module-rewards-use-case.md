# Module REW — Phần thưởng

4 use case.

![Module REW — Phần thưởng](svg/module-rewards-use-case.svg)

**Cách đọc:** hình người là actor, hình elip là use case, khung ngoài là ranh giới hệ thống
`ENG//HABIT`, khung trong là module. Mũi tên liền từ actor tới use case là association;
mũi tên nét đứt `<<include>>` trỏ từ use case gốc tới use case luôn được gọi; `<<extend>>` trỏ từ
use case mở rộng tới use case gốc; mũi tên tam giác rỗng là generalization (con → cha).
Use case nền vàng mang nhãn `<<Partially Confirmed>>`: có bằng chứng ở mã nguồn nhưng chưa đủ
(xem cột Trạng thái trong `USE-CASE-INVENTORY.md`).

## Mã nguồn PlantUML

```plantuml
@startuml module-rewards-use-case
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
title Module REW — Phần thưởng

actor "Người học" as A_LEARNER
actor "Bộ lập lịch hệ thống" as A_SCHED

rectangle "ENG//HABIT" {
  package "Phần thưởng" {
    usecase "Điểm danh nhận xu\n<size:10>UC-REW-01</size>" as UC_REW_01
    usecase "Nhận thưởng nhiệm vụ\nngày\n<size:10>UC-REW-02</size>" as UC_REW_02
    usecase "Mua vật phẩm giữ chuỗi\n<size:10>UC-REW-03</size>" as UC_REW_03
    usecase "Tự động dùng vật phẩm\ngiữ chuỗi\n<size:10>UC-REW-04</size>" as UC_REW_04
  }
}

A_LEARNER --> UC_REW_01
A_LEARNER --> UC_REW_02
A_LEARNER --> UC_REW_03
A_SCHED --> UC_REW_04
@enduml
```

## Use case trong sơ đồ

| ID | Use Case | Actor (association) | Trạng thái |
|---|---|---|---|
| UC-REW-01 | Điểm danh nhận xu | Người học | Confirmed |
| UC-REW-02 | Nhận thưởng nhiệm vụ ngày | Người học | Confirmed |
| UC-REW-03 | Mua vật phẩm giữ chuỗi | Người học | Confirmed |
| UC-REW-04 | Tự động dùng vật phẩm giữ chuỗi | Bộ lập lịch hệ thống | Confirmed |
