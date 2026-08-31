# Thiết lập database MySQL trên Aiven

Hướng dẫn từng bước đưa database của ENG//HABIT lên Aiven — từ lúc chưa có tài khoản
đến lúc backend trên Render đọc ghi được dữ liệu thật.

Tài liệu này chỉ nói về **database**. Phần deploy backend (Render) và frontend (Vercel)
xem [deployment.md](deployment.md).

---

## 0. Biết trước 6 giới hạn của gói free

Đọc phần này trước khi bấm nút nào — có mấy giới hạn ảnh hưởng thẳng tới cách dùng.

| Giới hạn | Con số | Ảnh hưởng tới dự án |
|---|---|---|
| RAM / CPU / dung lượng | 1 GB / 1 CPU / 1 GB | Đủ xa cho vài trăm user và vài chục nghìn `activity_logs` |
| Số kết nối đồng thời | `max_connections = 76` | Vẫn phải đặt `connection_limit` — xem [bước 4](#4-chuyển-service-uri-thành-database_url-cho-prisma) |
| Số service free | **Một service mỗi loại cho mỗi tổ chức** | Không tạo được hai DB free để tách staging và production |
| Mạng | Không VPC, không static IP, không integration | Không giới hạn được truy cập theo IP của Render (xem [bước 7](#7-giới-hạn-truy-cập-theo-ip-tuỳ-chọn)) |
| Thời hạn | Miễn phí vĩnh viễn, không cần thẻ tín dụng | — |
| **Không hoạt động** | Aiven **tắt service** khi lâu không có truy vấn, có báo email trước | Quan trọng với đồ án: trước buổi bảo vệ phải mở app một lần để chắc DB đang chạy |

Giới hạn cuối là thứ dễ mất điểm nhất: gói free của Render cũng ngủ sau 15 phút không có
request. Hai cái ngủ cộng lại thì lần mở đầu tiên có thể mất gần một phút.

---

## 1. Tạo tài khoản

1. Vào [aiven.io](https://aiven.io) → **Sign up**
2. Đăng ký bằng Google/GitHub hoặc email. **Không cần thẻ tín dụng.**
3. Aiven tạo sẵn cho bạn một **organization** và một **project** mặc định. Cứ dùng project
   đó, không cần tạo mới.

---

## 2. Tạo service MySQL

Trong bảng điều khiển Aiven (Aiven Console):

1. Chọn project → mục **Services** → **Create service**
2. Chọn **MySQL** trong danh sách loại service
3. **Service plan**: chọn tab/nhãn **Free** (gói free tên là `free-1-5gb` hoặc hiển thị là
   *Free plan*). Nếu không thấy, đổi nhà cung cấp cloud ở bước dưới — gói free chỉ có ở
   một số cloud và vùng nhất định.
4. **Cloud provider & region**: chọn vùng **gần Việt Nam nhất** trong các vùng còn gói free
   (thường là Singapore hoặc Sydney). Vùng càng xa thì mỗi truy vấn càng chậm — với trang
   thống kê phải chạy nhiều truy vấn, khác biệt này thấy được bằng mắt.
5. **Service name**: đặt `enghabit-db` cho dễ nhận ra
6. Bấm **Create service**

Service hiện trạng thái **Rebuilding** vài phút rồi chuyển sang **Running**. Chỉ khi
**Running** mới kết nối được.

> **Chọn vùng cho khớp với Render.** Ở `render.yaml` backend đang đặt `region: singapore`.
> Đặt database cùng vùng Singapore thì độ trễ giữa app và DB chỉ vài mili giây; đặt lệch
> châu lục có thể thành vài trăm mili giây **cho mỗi truy vấn**.

---

## 3. Lấy thông tin kết nối

Vào service vừa tạo → trang **Overview**. Khối **Connection information** có sẵn:

| Trường | Giá trị mẫu | Ghi chú |
|---|---|---|
| Host | `enghabit-db-xxxx.f.aivencloud.com` | |
| Port | `12691` | Aiven dùng cổng ngẫu nhiên, **không phải 3306** |
| User | `avnadmin` | tài khoản quản trị mặc định |
| Password | (bấm *Show* để hiện) | |
| Database | `defaultdb` | database có sẵn |
| SSL | `REQUIRED` | Aiven **bắt buộc** kết nối mã hoá |

Ở cùng khối này có nút tải **CA certificate** (`ca.pem`) — cần cho cách kết nối chặt ở
bước sau. Ngoài ra nút **Quick connect** cho sẵn câu lệnh kết nối theo từng công cụ.

> ⚠️ **Mật khẩu này là bí mật.** Đừng dán vào chat, đừng commit lên git, đừng chụp màn hình
> gửi cho ai. Nếu lỡ lộ, vào tab **Users** bấm **Reset password** rồi cập nhật lại biến
> môi trường trên Render.

---

## 4. Chuyển Service URI thành DATABASE_URL cho Prisma

Aiven cho bạn chuỗi dạng:

```
mysql://avnadmin:MẬT_KHẨU@enghabit-db-xxxx.f.aivencloud.com:12691/defaultdb?ssl-mode=REQUIRED
```

**Không dán thẳng chuỗi này vào `DATABASE_URL`.** Prisma không hiểu tham số `ssl-mode`
(đó là tham số của MySQL CLI). Chuỗi đúng cho dự án này:

```
mysql://avnadmin:MẬT_KHẨU@enghabit-db-xxxx.f.aivencloud.com:12691/defaultdb?connection_limit=5&connect_timeout=15
```

Giải thích từng tham số:

- **`connection_limit=5`** — bắt buộc theo quy ước dự án (CLAUDE.md). Gói free cho tối đa
  76 kết nối, nghe thì nhiều, nhưng Prisma mặc định mở `số_CPU × 2 + 1` kết nối **cho mỗi
  tiến trình**; thêm lần `prisma migrate deploy` lúc khởi động và một phiên Prisma Studio
  là đủ chạm trần. Chạm trần thì lỗi báo ra là `Too many connections`, rất khó đoán nguyên nhân.
- **`connect_timeout=15`** — mặc định 5 giây. Service free vừa được đánh thức sau thời gian
  ngủ thì lần bắt tay đầu tiên hay lâu hơn 5 giây và app sẽ chết ngay lúc khởi động.

### Về SSL — chỗ dễ sai nhất

Kết nối tới Aiven **luôn được mã hoá** vì server bắt buộc TLS, kể cả khi bạn không ghi
tham số SSL nào. Khác biệt giữa hai cách dưới đây là **có xác thực danh tính máy chủ hay
không**:

| Cách | Chuỗi thêm vào | Kết quả |
|---|---|---|
| Mặc định của Prisma | *(không thêm gì)* | Mã hoá, **không** xác thực CA. Đủ dùng cho đồ án. |
| Xác thực đầy đủ | `&sslaccept=strict&sslcert=ca.pem` | Mã hoá **và** xác thực máy chủ đúng là Aiven |

> **Đừng ghi `sslaccept=strict` mà không kèm `sslcert`.** Chứng chỉ của Aiven do CA riêng
> của từng project ký, không nằm trong kho chứng chỉ gốc của hệ điều hành. Thiếu `sslcert`
> thì `strict` sẽ ném lỗi `Error opening a TLS connection: unknown Cert Authority` —
> đây chính là lý do dòng gợi ý cũ trong `be/.env.example` đã được sửa lại.

Muốn dùng cách xác thực đầy đủ:

1. Tải `ca.pem` từ trang Overview của service
2. Đặt vào `be/prisma/ca.pem` — Prisma tìm đường dẫn tương đối tính từ thư mục `prisma/`
3. File này **không phải bí mật** (chỉ là chứng chỉ công khai) nên commit lên git được
4. Chạy `pnpm --filter @enghabit/be exec prisma db execute --stdin` với `SELECT 1;` để xác
   nhận kết nối chạy được trước khi deploy

---

## 5. Kiểm tra bảng mã utf8mb4

Dự án lưu tiếng Việt có dấu và có thể có emoji, nên **bắt buộc** `utf8mb4` (CLAUDE.md).
MySQL 8 trên Aiven mặc định đã đúng, nhưng kiểm tra mất 10 giây còn phát hiện muộn thì
phải migrate lại toàn bộ dữ liệu.

Cách nhanh nhất là dùng chính Prisma, không cần cài thêm MySQL client:

```bash
cd be
echo "SELECT @@character_set_database, @@collation_database;" | npx prisma db execute --stdin --url "$DATABASE_URL"
```

Kết quả phải là `utf8mb4` và `utf8mb4_0900_ai_ci` (hoặc `utf8mb4_unicode_ci`). Nếu không
đúng, sửa bằng:

```sql
ALTER DATABASE defaultdb CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

---

## 6. Tạo bảng và nạp dữ liệu mẫu

Chạy **từ máy của bạn**, trỏ vào DB trên Aiven. Cách này an toàn hơn chạy trên Render vì
bạn thấy được lỗi ngay.

```bash
# 1. Trỏ tạm biến môi trường sang Aiven (chỉ trong phiên terminal này)
export DATABASE_URL="mysql://avnadmin:MẬT_KHẨU@host:port/defaultdb?connection_limit=5&connect_timeout=15"

# 2. Tạo bảng theo đúng các migration đã commit
pnpm --filter @enghabit/be exec prisma migrate deploy

# 3. Nạp dữ liệu mẫu (idempotent, chạy lại không nhân đôi dữ liệu)
pnpm --filter @enghabit/be db:seed
```

Trên Windows PowerShell, dòng 1 viết là:

```powershell
$env:DATABASE_URL = "mysql://avnadmin:MẬT_KHẨU@host:port/defaultdb?connection_limit=5&connect_timeout=15"
```

Sau bước này database có: 3 tài khoản mẫu, 5 chủ đề, 40 từ vựng, 5 quiz và 45 ngày lịch
sử học của tài khoản demo.

> **Dùng `migrate deploy`, không dùng `migrate dev`.** `migrate dev` được phép **xoá và
> tạo lại** database khi thấy lệch — chạy nhầm lên DB thật là mất sạch dữ liệu. Quy ước
> dự án: `dev` chỉ dùng ở máy local (CLAUDE.md).

Kiểm tra dữ liệu đã vào chưa bằng giao diện:

```bash
pnpm --filter @enghabit/be exec prisma studio
```

---

## 7. Giới hạn truy cập theo IP (tuỳ chọn)

Mặc định database Aiven mở ra Internet, ai biết host + cổng + mật khẩu đều kết nối được.
Aiven có mục **IP allowlist** (trong tab **Overview** hoặc **Service settings**) để chỉ cho
phép một dải IP nhất định.

Vấn đề: **gói free của Render không có địa chỉ IP cố định**, nên không có dải IP nào để
khai báo. Ba lựa chọn:

1. **Để mở (`0.0.0.0/0`)** và bù lại bằng mật khẩu mạnh do Aiven sinh — chấp nhận được cho
   đồ án, đây là mặc định.
2. Nâng Render lên gói trả phí có static outbound IP rồi khai báo đúng IP đó.
3. Khi cần thao tác thủ công từ máy cá nhân, tạm thêm IP nhà mình vào allowlist rồi xoá đi.

Dù chọn cách nào cũng **không được** đặt mật khẩu tự nghĩ cho dễ nhớ — cứ để nguyên chuỗi
ngẫu nhiên Aiven sinh ra.

---

## 8. Nối vào Render

Vào Render → service `enghabit-api` → tab **Environment**, thêm:

| Biến | Giá trị |
|---|---|
| `DATABASE_URL` | chuỗi ở [bước 4](#4-chuyển-service-uri-thành-database_url-cho-prisma), có đủ `connection_limit` |
| `CORS_ORIGIN` | tên miền Vercel, vd `https://enghabit.vercel.app` |
| `JWT_ACCESS_SECRET` | chuỗi ngẫu nhiên ≥ 32 ký tự |
| `JWT_REFRESH_SECRET` | chuỗi ngẫu nhiên **khác**, ≥ 32 ký tự |
| `ENABLE_REMINDER_JOB` | `false` |

Sinh chuỗi ngẫu nhiên: `openssl rand -hex 32`, hoặc trong PowerShell:

```powershell
-join ((48..57) + (97..102) | Get-Random -Count 64 | ForEach-Object { [char]$_ })
```

Nhập trực tiếp vào bảng điều khiển Render — **không** ghi vào `render.yaml` hay bất kỳ file
nào được commit.

`startCommand` của dự án đã có sẵn `prisma migrate deploy`, nên mỗi lần deploy schema tự
đồng bộ, không ai phải chạy tay.

---

## 9. Xác nhận chạy được

```bash
# 1. API sống chưa
curl https://enghabit-api.onrender.com/health

# 2. Đăng nhập được không — chứng tỏ API đọc được DB
curl -X POST https://enghabit-api.onrender.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@enghabit.com","password":"A1234567"}'
```

Lần gọi đầu có thể mất 30–60 giây vì Render và Aiven cùng phải thức dậy. Gọi lại lần hai
mà vẫn chậm thì mới là có vấn đề.

Ở phía Aiven, tab **Metrics** của service cho thấy số kết nối và truy vấn — nhìn vào đó là
biết app đã thật sự nói chuyện với DB hay chưa.

---

## Lỗi thường gặp

| Thông báo | Nguyên nhân | Cách xử lý |
|---|---|---|
| `P1001: Can't reach database server` | Service đang ngủ hoặc sai host/port | Mở Aiven Console xem trạng thái có **Running** không; nhớ cổng **không phải 3306** |
| `Error opening a TLS connection: unknown Cert Authority` | Ghi `sslaccept=strict` mà thiếu `sslcert` | Bỏ `sslaccept=strict`, hoặc thêm `ca.pem` theo [bước 4](#về-ssl--chỗ-dễ-sai-nhất) |
| `Too many connections` | Thiếu `connection_limit`, hoặc mở nhiều Prisma Studio | Thêm `?connection_limit=5`, đóng bớt phiên đang mở |
| Kết nối lúc được lúc không, hay timeout lần đầu | Service vừa bị đánh thức | Thêm `connect_timeout=15` |
| Tiếng Việt thành `?????` | Database không phải utf8mb4 | Chạy `ALTER DATABASE` ở [bước 5](#5-kiểm-tra-bảng-mã-utf8mb4) rồi nạp lại dữ liệu |
| Ngày/streak lệch một ngày | Nghi timezone server | Không phải lỗi DB: dự án lưu UTC và group theo `local_date`; kiểm tra `User.timezone` trước (CLAUDE.md > Quy tắc debug) |
| Email báo service sắp bị tắt | Lâu không dùng | Mở app một lần, hoặc bấm **Power on** trong Console |

---

## Khi nào nên rời gói free

Gói free đủ cho đồ án và demo. Cân nhắc nâng cấp khi gặp một trong ba dấu hiệu:

- Dung lượng chạm gần 1 GB (xem tab **Metrics**) — với dự án này tức là khoảng vài triệu
  dòng `activity_logs`
- Cần chạy đồng thời hai môi trường staging và production (gói free chỉ cho một service)
- Cần cam kết uptime — gói free **không** có SLA và có thể bị tắt khi không hoạt động

---

## Nguồn

- [Aiven for MySQL free tier — tài liệu chính thức](https://aiven.io/docs/products/mysql/concepts/mysql-free-tier)
- [Aiven for MySQL — Get started](https://aiven.io/docs/products/mysql/get-started)
- [Prisma — MySQL connector, tham số chuỗi kết nối](https://www.prisma.io/docs/orm/v6/overview/databases/mysql)
- [Prisma issue #2676 — unknown Cert Authority với CA riêng của nhà cung cấp](https://github.com/prisma/prisma/issues/2676)
