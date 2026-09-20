# Module COM — Cộng đồng

8 use case.
Use case của module khác xuất hiện trong khung "(tham chiếu)" chỉ để thể hiện quan hệ; association của chúng vẽ ở sơ đồ module gốc: UC-GRP-09, UC-GRP-08.


![Module COM — Cộng đồng](svg/module-community-use-case.svg)

**Cách đọc:** hình người là actor, hình elip là use case, khung ngoài là ranh giới hệ thống
`ENG//HABIT`, khung trong là module. Mũi tên liền từ actor tới use case là association;
mũi tên nét đứt `<<include>>` trỏ từ use case gốc tới use case luôn được gọi; `<<extend>>` trỏ từ
use case mở rộng tới use case gốc; mũi tên tam giác rỗng là generalization (con → cha).
Use case nền vàng mang nhãn `<<Partially Confirmed>>`: có bằng chứng ở mã nguồn nhưng chưa đủ
(xem cột Trạng thái trong `USE-CASE-INVENTORY.md`).

## Mã nguồn PlantUML

```plantuml
@startuml module-community-use-case
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
title Module COM — Cộng đồng

actor "Người dùng đã xác thực" as A_AUTH <<abstract>>
actor "Người học" as A_LEARNER
actor "Quản trị viên" as A_ADMIN

rectangle "ENG//HABIT" {
  package "Cộng đồng" {
    usecase "Xem và tìm bài viết\n<size:10>UC-COM-01</size>" as UC_COM_01
    usecase "Xem chi tiết bài viết\n<size:10>UC-COM-02</size>" as UC_COM_02
    usecase "Đăng bài viết\n<size:10>UC-COM-03</size>" as UC_COM_03
    usecase "Bình luận bài viết\n<size:10>UC-COM-04</size>" as UC_COM_04
    usecase "Thả tim bài viết\n<size:10>UC-COM-05</size>" as UC_COM_05
    usecase "Xoá bài viết\n<size:10>UC-COM-06</size>" as UC_COM_06
    usecase "Xoá bình luận\n<size:10>UC-COM-07</size>" as UC_COM_07
    usecase "Tải tệp đính kèm\n<size:10>UC-COM-08</size>" as UC_COM_08
  }
  package "Nhóm lớp (tham chiếu)" {
    usecase "Đăng bài trong nhóm\n<size:10>UC-GRP-08</size>" as UC_GRP_08
    usecase "Xem tài liệu nhóm\n<size:10>UC-GRP-09</size>" as UC_GRP_09
  }
}

A_LEARNER --|> A_AUTH
A_ADMIN --|> A_AUTH
A_AUTH --> UC_COM_01
A_AUTH --> UC_COM_02
A_AUTH --> UC_COM_03
A_AUTH --> UC_COM_04
A_AUTH --> UC_COM_05
A_AUTH --> UC_COM_06
A_AUTH --> UC_COM_07
A_AUTH --> UC_COM_08
UC_COM_08 .> UC_COM_02 : <<extend>>
UC_COM_08 .> UC_GRP_09 : <<extend>>
UC_GRP_08 --|> UC_COM_03
@enduml
```

## Use case trong sơ đồ

| ID | Use Case | Actor (association) | Trạng thái |
|---|---|---|---|
| UC-COM-01 | Xem và tìm bài viết | Người dùng đã xác thực | Confirmed |
| UC-COM-02 | Xem chi tiết bài viết | Người dùng đã xác thực | Confirmed |
| UC-COM-03 | Đăng bài viết | Người dùng đã xác thực | Confirmed |
| UC-COM-04 | Bình luận bài viết | Người dùng đã xác thực | Confirmed |
| UC-COM-05 | Thả tim bài viết | Người dùng đã xác thực | Confirmed |
| UC-COM-06 | Xoá bài viết | Người dùng đã xác thực | Confirmed |
| UC-COM-07 | Xoá bình luận | Người dùng đã xác thực | Confirmed |
| UC-COM-08 | Tải tệp đính kèm | Người dùng đã xác thực | Confirmed |
| UC-GRP-08 | Đăng bài trong nhóm | Người học | Confirmed |
| UC-GRP-09 | Xem tài liệu nhóm | Người học | Confirmed |
