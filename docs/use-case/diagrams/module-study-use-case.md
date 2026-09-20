# Module STU — Học và ôn tập

7 use case.

![Module STU — Học và ôn tập](svg/module-study-use-case.svg)

**Cách đọc:** hình người là actor, hình elip là use case, khung ngoài là ranh giới hệ thống
`ENG//HABIT`, khung trong là module. Mũi tên liền từ actor tới use case là association;
mũi tên nét đứt `<<include>>` trỏ từ use case gốc tới use case luôn được gọi; `<<extend>>` trỏ từ
use case mở rộng tới use case gốc; mũi tên tam giác rỗng là generalization (con → cha).
Use case nền vàng mang nhãn `<<Partially Confirmed>>`: có bằng chứng ở mã nguồn nhưng chưa đủ
(xem cột Trạng thái trong `USE-CASE-INVENTORY.md`).

## Mã nguồn PlantUML

```plantuml
@startuml module-study-use-case
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
title Module STU — Học và ôn tập

actor "Người học" as A_LEARNER

rectangle "ENG//HABIT" {
  package "Học và ôn tập" {
    usecase "Học bộ thẻ\n<size:10>UC-STU-01</size>" as UC_STU_01
    usecase "Ôn tập thẻ theo lịch\n<size:10>UC-STU-02</size>" as UC_STU_02
    usecase "Ôn nhanh (Cram)\n<size:10>UC-STU-03</size>" as UC_STU_03
    usecase "Trả lời và chấm thẻ\n<size:10>UC-STU-04</size>" as UC_STU_04
    usecase "Ghi nhận hoàn thành\nphiên học\n<size:10>UC-STU-05</size>" as UC_STU_05
    usecase "Xem thống kê học và ôn\n<size:10>UC-STU-06</size>" as UC_STU_06
    usecase "Xem lịch sử ôn tập\n<size:10>UC-STU-07</size>" as UC_STU_07
  }
}

A_LEARNER --> UC_STU_01
A_LEARNER --> UC_STU_02
A_LEARNER --> UC_STU_03
A_LEARNER --> UC_STU_06
A_LEARNER --> UC_STU_07
UC_STU_01 .> UC_STU_04 : <<include>>
UC_STU_02 .> UC_STU_04 : <<include>>
UC_STU_03 .> UC_STU_04 : <<include>>
UC_STU_05 .> UC_STU_01 : <<extend>>
@enduml
```

## Use case trong sơ đồ

| ID | Use Case | Actor (association) | Trạng thái |
|---|---|---|---|
| UC-STU-01 | Học bộ thẻ | Người học | Confirmed |
| UC-STU-02 | Ôn tập thẻ theo lịch | Người học | Confirmed |
| UC-STU-03 | Ôn nhanh (Cram) | Người học | Confirmed |
| UC-STU-04 | Trả lời và chấm thẻ | — (chỉ qua quan hệ) | Confirmed |
| UC-STU-05 | Ghi nhận hoàn thành phiên học | — (chỉ qua quan hệ) | Confirmed |
| UC-STU-06 | Xem thống kê học và ôn | Người học | Confirmed |
| UC-STU-07 | Xem lịch sử ôn tập | Người học | Confirmed |
