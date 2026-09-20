# Module SHOP — Cửa hàng, ví và kho vật phẩm

6 use case.

![Module SHOP — Cửa hàng, ví và kho vật phẩm](svg/module-shop-use-case.svg)

**Cách đọc:** hình người là actor, hình elip là use case, khung ngoài là ranh giới hệ thống
`ENG//HABIT`, khung trong là module. Mũi tên liền từ actor tới use case là association;
mũi tên nét đứt `<<include>>` trỏ từ use case gốc tới use case luôn được gọi; `<<extend>>` trỏ từ
use case mở rộng tới use case gốc; mũi tên tam giác rỗng là generalization (con → cha).
Use case nền vàng mang nhãn `<<Partially Confirmed>>`: có bằng chứng ở mã nguồn nhưng chưa đủ
(xem cột Trạng thái trong `USE-CASE-INVENTORY.md`).

## Mã nguồn PlantUML

```plantuml
@startuml module-shop-use-case
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
title Module SHOP — Cửa hàng, ví và kho vật phẩm

actor "Người học" as A_LEARNER

rectangle "ENG//HABIT" {
  package "Cửa hàng, ví và kho vật phẩm" {
    usecase "Xem và tìm vật phẩm\n<size:10>UC-SHOP-01</size>" as UC_SHOP_01
    usecase "Mua vật phẩm\n<size:10>UC-SHOP-02</size>" as UC_SHOP_02
    usecase "Đánh dấu yêu thích vật\nphẩm\n<size:10>UC-SHOP-03</size>" as UC_SHOP_03
    usecase "Xem kho vật phẩm\n<size:10>UC-SHOP-04</size>" as UC_SHOP_04
    usecase "Sử dụng hoặc bỏ dùng vật\nphẩm\n<size:10>UC-SHOP-05</size>" as UC_SHOP_05
    usecase "Xem ví xu\n<size:10>UC-SHOP-06</size>" as UC_SHOP_06
  }
}

A_LEARNER --> UC_SHOP_01
A_LEARNER --> UC_SHOP_02
A_LEARNER --> UC_SHOP_03
A_LEARNER --> UC_SHOP_04
A_LEARNER --> UC_SHOP_05
A_LEARNER --> UC_SHOP_06
@enduml
```

## Use case trong sơ đồ

| ID | Use Case | Actor (association) | Trạng thái |
|---|---|---|---|
| UC-SHOP-01 | Xem và tìm vật phẩm | Người học | Confirmed |
| UC-SHOP-02 | Mua vật phẩm | Người học | Confirmed |
| UC-SHOP-03 | Đánh dấu yêu thích vật phẩm | Người học | Confirmed |
| UC-SHOP-04 | Xem kho vật phẩm | Người học | Confirmed |
| UC-SHOP-05 | Sử dụng hoặc bỏ dùng vật phẩm | Người học | Confirmed |
| UC-SHOP-06 | Xem ví xu | Người học | Confirmed |
