# Module NOTI — Thông báo và nhắc nhở

8 use case.

![Module NOTI — Thông báo và nhắc nhở](svg/module-notifications-use-case.svg)

**Cách đọc:** hình người là actor, hình elip là use case, khung ngoài là ranh giới hệ thống
`ENG//HABIT`, khung trong là module. Mũi tên liền từ actor tới use case là association;
mũi tên nét đứt `<<include>>` trỏ từ use case gốc tới use case luôn được gọi; `<<extend>>` trỏ từ
use case mở rộng tới use case gốc; mũi tên tam giác rỗng là generalization (con → cha).
Use case nền vàng mang nhãn `<<Partially Confirmed>>`: có bằng chứng ở mã nguồn nhưng chưa đủ
(xem cột Trạng thái trong `USE-CASE-INVENTORY.md`).

## Mã nguồn PlantUML

```plantuml
@startuml module-notifications-use-case
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
title Module NOTI — Thông báo và nhắc nhở

actor "Người dùng đã xác thực" as A_AUTH <<abstract>>
actor "Người học" as A_LEARNER
actor "Quản trị viên" as A_ADMIN
actor "Bộ lập lịch hệ thống" as A_SCHED
actor "OneSignal" as A_PUSH <<External System>>

rectangle "ENG//HABIT" {
  package "Thông báo và nhắc nhở" {
    usecase "Xem thông báo\n<size:10>UC-NOTI-01</size>" as UC_NOTI_01
    usecase "Đánh dấu thông báo đã\nđọc\n<size:10>UC-NOTI-02</size>" as UC_NOTI_02
    usecase "Xoá thông báo\n<size:10>UC-NOTI-03</size>" as UC_NOTI_03
    usecase "Cấu hình nhắc nhở\n<size:10>UC-NOTI-04</size>" as UC_NOTI_04
    usecase "Quản lý mốc nhắc học\n<size:10>UC-NOTI-05</size>" as UC_NOTI_05
    usecase "Đăng ký thiết bị nhận\nthông báo đẩy\n<size:10>UC-NOTI-06</size>" as UC_NOTI_06 <<Partially Confirmed>>
    usecase "Gửi lời nhắc học\n<size:10>UC-NOTI-07</size>" as UC_NOTI_07
    usecase "Cảnh báo chuỗi sắp đứt\n<size:10>UC-NOTI-08</size>" as UC_NOTI_08
  }
}

A_LEARNER --|> A_AUTH
A_ADMIN --|> A_AUTH
A_AUTH --> UC_NOTI_01
A_AUTH --> UC_NOTI_02
A_AUTH --> UC_NOTI_03
A_LEARNER --> UC_NOTI_04
A_LEARNER --> UC_NOTI_05
A_AUTH --> UC_NOTI_06
A_SCHED --> UC_NOTI_07
UC_NOTI_07 --> A_PUSH
A_SCHED --> UC_NOTI_08
UC_NOTI_08 --> A_PUSH
@enduml
```

## Use case trong sơ đồ

| ID | Use Case | Actor (association) | Trạng thái |
|---|---|---|---|
| UC-NOTI-01 | Xem thông báo | Người dùng đã xác thực | Confirmed |
| UC-NOTI-02 | Đánh dấu thông báo đã đọc | Người dùng đã xác thực | Confirmed |
| UC-NOTI-03 | Xoá thông báo | Người dùng đã xác thực | Confirmed |
| UC-NOTI-04 | Cấu hình nhắc nhở | Người học | Confirmed |
| UC-NOTI-05 | Quản lý mốc nhắc học | Người học | Confirmed |
| UC-NOTI-06 | Đăng ký thiết bị nhận thông báo đẩy | Người dùng đã xác thực | Partially Confirmed |
| UC-NOTI-07 | Gửi lời nhắc học | Bộ lập lịch hệ thống, OneSignal | Confirmed |
| UC-NOTI-08 | Cảnh báo chuỗi sắp đứt | Bộ lập lịch hệ thống, OneSignal | Confirmed |
