# Module LIB — Thư viện bộ thẻ

9 use case.

![Module LIB — Thư viện bộ thẻ](svg/module-library-use-case.svg)

**Cách đọc:** hình người là actor, hình elip là use case, khung ngoài là ranh giới hệ thống
`ENG//HABIT`, khung trong là module. Mũi tên liền từ actor tới use case là association;
mũi tên nét đứt `<<include>>` trỏ từ use case gốc tới use case luôn được gọi; `<<extend>>` trỏ từ
use case mở rộng tới use case gốc; mũi tên tam giác rỗng là generalization (con → cha).
Use case nền vàng mang nhãn `<<Partially Confirmed>>`: có bằng chứng ở mã nguồn nhưng chưa đủ
(xem cột Trạng thái trong `USE-CASE-INVENTORY.md`).

## Mã nguồn PlantUML

```plantuml
@startuml module-library-use-case
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
title Module LIB — Thư viện bộ thẻ

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
UC_LIB_08 .> UC_LIB_03 : <<extend>>
UC_LIB_09 .> UC_LIB_03 : <<extend>>
@enduml
```

## Use case trong sơ đồ

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
