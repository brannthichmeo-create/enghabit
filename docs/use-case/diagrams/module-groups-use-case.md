# Module GRP — Nhóm lớp

18 use case.
Use case của module khác xuất hiện trong khung "(tham chiếu)" chỉ để thể hiện quan hệ; association của chúng vẽ ở sơ đồ module gốc: UC-COM-08, UC-COM-03.


![Module GRP — Nhóm lớp](svg/module-groups-use-case.svg)

**Cách đọc:** hình người là actor, hình elip là use case, khung ngoài là ranh giới hệ thống
`ENG//HABIT`, khung trong là module. Mũi tên liền từ actor tới use case là association;
mũi tên nét đứt `<<include>>` trỏ từ use case gốc tới use case luôn được gọi; `<<extend>>` trỏ từ
use case mở rộng tới use case gốc; mũi tên tam giác rỗng là generalization (con → cha).
Use case nền vàng mang nhãn `<<Partially Confirmed>>`: có bằng chứng ở mã nguồn nhưng chưa đủ
(xem cột Trạng thái trong `USE-CASE-INVENTORY.md`).

## Mã nguồn PlantUML

```plantuml
@startuml module-groups-use-case
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
title Module GRP — Nhóm lớp

actor "Người học" as A_LEARNER
actor "Trưởng nhóm" as A_LEADER

rectangle "ENG//HABIT" {
  package "Cộng đồng (tham chiếu)" {
    usecase "Đăng bài viết\n<size:10>UC-COM-03</size>" as UC_COM_03
    usecase "Tải tệp đính kèm\n<size:10>UC-COM-08</size>" as UC_COM_08
  }
  package "Nhóm lớp" {
    usecase "Xem nhóm của tôi\n<size:10>UC-GRP-01</size>" as UC_GRP_01
    usecase "Tìm nhóm công khai\n<size:10>UC-GRP-02</size>" as UC_GRP_02
    usecase "Tìm nhóm bằng mã\n<size:10>UC-GRP-03</size>" as UC_GRP_03
    usecase "Tạo nhóm\n<size:10>UC-GRP-04</size>" as UC_GRP_04
    usecase "Tham gia nhóm\n<size:10>UC-GRP-05</size>" as UC_GRP_05
    usecase "Rời nhóm\n<size:10>UC-GRP-06</size>" as UC_GRP_06
    usecase "Xem bảng tin nhóm\n<size:10>UC-GRP-07</size>" as UC_GRP_07
    usecase "Đăng bài trong nhóm\n<size:10>UC-GRP-08</size>" as UC_GRP_08
    usecase "Xem tài liệu nhóm\n<size:10>UC-GRP-09</size>" as UC_GRP_09
    usecase "Xem bộ thẻ của nhóm\n<size:10>UC-GRP-10</size>" as UC_GRP_10
    usecase "Cập nhật cài đặt nhóm\n<size:10>UC-GRP-11</size>" as UC_GRP_11
    usecase "Xoá nhóm\n<size:10>UC-GRP-12</size>" as UC_GRP_12
    usecase "Duyệt yêu cầu tham gia\nnhóm\n<size:10>UC-GRP-13</size>" as UC_GRP_13
    usecase "Thêm thành viên\n<size:10>UC-GRP-14</size>" as UC_GRP_14
    usecase "Xoá thành viên\n<size:10>UC-GRP-15</size>" as UC_GRP_15
    usecase "Phân quyền trưởng nhóm\n<size:10>UC-GRP-16</size>" as UC_GRP_16
    usecase "Chia sẻ bộ thẻ vào nhóm\n<size:10>UC-GRP-17</size>" as UC_GRP_17
    usecase "Gỡ bộ thẻ khỏi nhóm\n<size:10>UC-GRP-18</size>" as UC_GRP_18
  }
}

A_LEADER --|> A_LEARNER
A_LEARNER --> UC_GRP_01
A_LEARNER --> UC_GRP_02
A_LEARNER --> UC_GRP_03
A_LEARNER --> UC_GRP_04
A_LEARNER --> UC_GRP_05
A_LEARNER --> UC_GRP_06
A_LEARNER --> UC_GRP_07
A_LEARNER --> UC_GRP_08
A_LEARNER --> UC_GRP_09
A_LEARNER --> UC_GRP_10
A_LEADER --> UC_GRP_11
A_LEADER --> UC_GRP_12
A_LEADER --> UC_GRP_13
A_LEADER --> UC_GRP_14
A_LEADER --> UC_GRP_15
A_LEADER --> UC_GRP_16
A_LEADER --> UC_GRP_17
A_LEADER --> UC_GRP_18
UC_GRP_05 .> UC_GRP_02 : <<extend>>
UC_GRP_05 .> UC_GRP_03 : <<extend>>
UC_COM_08 .> UC_GRP_09 : <<extend>>
UC_GRP_08 --|> UC_COM_03
@enduml
```

## Use case trong sơ đồ

| ID | Use Case | Actor (association) | Trạng thái |
|---|---|---|---|
| UC-COM-03 | Đăng bài viết | Người dùng đã xác thực | Confirmed |
| UC-COM-08 | Tải tệp đính kèm | Người dùng đã xác thực | Confirmed |
| UC-GRP-01 | Xem nhóm của tôi | Người học | Confirmed |
| UC-GRP-02 | Tìm nhóm công khai | Người học | Confirmed |
| UC-GRP-03 | Tìm nhóm bằng mã | Người học | Confirmed |
| UC-GRP-04 | Tạo nhóm | Người học | Confirmed |
| UC-GRP-05 | Tham gia nhóm | Người học | Confirmed |
| UC-GRP-06 | Rời nhóm | Người học | Confirmed |
| UC-GRP-07 | Xem bảng tin nhóm | Người học | Confirmed |
| UC-GRP-08 | Đăng bài trong nhóm | Người học | Confirmed |
| UC-GRP-09 | Xem tài liệu nhóm | Người học | Confirmed |
| UC-GRP-10 | Xem bộ thẻ của nhóm | Người học | Confirmed |
| UC-GRP-11 | Cập nhật cài đặt nhóm | Trưởng nhóm | Confirmed |
| UC-GRP-12 | Xoá nhóm | Trưởng nhóm | Confirmed |
| UC-GRP-13 | Duyệt yêu cầu tham gia nhóm | Trưởng nhóm | Confirmed |
| UC-GRP-14 | Thêm thành viên | Trưởng nhóm | Confirmed |
| UC-GRP-15 | Xoá thành viên | Trưởng nhóm | Confirmed |
| UC-GRP-16 | Phân quyền trưởng nhóm | Trưởng nhóm | Confirmed |
| UC-GRP-17 | Chia sẻ bộ thẻ vào nhóm | Trưởng nhóm | Confirmed |
| UC-GRP-18 | Gỡ bộ thẻ khỏi nhóm | Trưởng nhóm | Confirmed |
