# ENGHABIT

Ứng dụng xây dựng thói quen học tiếng Anh — học từ vựng, ôn flashcard, theo dõi chuỗi ngày
học và thống kê tiến độ.

Quy ước code và lý do đằng sau: [CLAUDE.md](CLAUDE.md).
Đưa hệ thống lên Internet: [docs/deployment.md](docs/deployment.md).
Chi tiết về Aiven — giới hạn gói free, SSL, bảng lỗi: [docs/aiven-setup.md](docs/aiven-setup.md).

---

## Quy ước đọc

**⊞** = phím Windows (hình 4 ô vuông, giữa `Ctrl` và `Alt`).

Chép lệnh: bôi đen → `Ctrl` + `C` → sang PowerShell **bấm chuột phải** → `Enter`.

Lệnh chạy xong khi cửa sổ hiện lại dấu `>`. Chưa thấy thì đợi, đừng gõ chồng lệnh.

---

## Bước 1 — Cài phần mềm

### 1.1. Node.js

1. Vào `nodejs.org` → bấm **Download Node.js (LTS)**
2. Mở file trong thư mục **Downloads** (tên dạng `node-v22...msi`)
3. **Next** → tích **I accept the terms...** → **Next** 3 lần
4. Màn hình *Tools for Native Modules*: **không tích ô nào** → **Next**
5. **Install** → *Do you want to allow...* bấm **Yes** → **Finish**

### 1.2. Git

1. Vào `git-scm.com/downloads` → **Download for Windows** → **64-bit Git for Windows Setup**
2. Mở file vừa tải
3. Bấm **Next** liên tục (~10 lần, giữ nguyên mọi lựa chọn) → **Install** → **Finish**

### 1.3. XAMPP

**Chỉ cần cho Cách B ở Bước 4.** Chọn Cách A thì bỏ qua mục này.

1. Vào `apachefriends.org` → **XAMPP for Windows**
2. Mở file vừa tải → cảnh báo *User Account Control* bấm **OK**
3. **Next** 5 lần (thư mục để nguyên `C:\xampp`) → **Install** → **Finish**

### 1.4. Khởi động lại máy

Bắt buộc. Bỏ qua thì máy chưa nhận phần mềm vừa cài.

---

## Bước 2 — Mở PowerShell

Bấm **⊞** → gõ `powershell` → `Enter`.

Kiểm tra Node.js:

```powershell
node -v
```

Hiện dãy số kiểu `v22.14.0` là đạt. Hiện *not recognized* thì quay lại Bước 1.

Cài pnpm:

```powershell
npm install -g pnpm
```

---

## Bước 3 — Tải mã nguồn

```powershell
cd $HOME\Desktop
git clone https://github.com/brannthichmeo-create/enghabit.git
cd enghabit
```

Dòng lệnh giờ kết thúc bằng `...\Desktop\enghabit>`.

Lỡ đóng cửa sổ thì mở lại rồi gõ `cd $HOME\Desktop\enghabit`.

---

## Bước 4 — Chuẩn bị database

Chọn **một** cách:

| | Cách A — Aiven | Cách B — XAMPP |
|---|---|---|
| Dữ liệu giữa các máy | Giống nhau tức thì | Mỗi máy một bộ riêng |
| Cần XAMPP | Không | Có |
| Cần mạng | Có | Không |

Nhiều máy cùng làm → **Cách A**. Một máy, hay làm khi không có mạng → **Cách B**.

---

### Cách A — database dùng chung trên Aiven

**Chỉ làm trên máy chính.** Máy thứ hai trở đi xin chuỗi kết nối rồi sang Bước 5.

Đã có service `enghabit-db` thì bỏ qua 4A.1 và 4A.2.

#### 4A.1. Đăng ký

1. Vào `aiven.io` → **Sign up** (Google/GitHub/email, không cần thẻ tín dụng)
2. Dùng luôn organization và project mặc định

#### 4A.2. Tạo service MySQL

1. Cột trái → **Services** → **Create service**
2. Chọn **MySQL**
3. **Service plan** → tab **Free**
4. **Cloud provider & region** → **Singapore**
5. **Service name** → `enghabit-db`
6. **Create service**
7. Đợi trạng thái **Rebuilding** chuyển sang **Running**

#### 4A.3. Tạo database dev

1. Bấm vào service `enghabit-db` → tab **Databases**
2. **Create database** → ô **Name** gõ `enghabit_dev` → **Add database**

> `defaultdb` là database production của Render. Máy dev **không được** dùng nó.

#### 4A.4. Ghép chuỗi kết nối

Lấy Host, Port, Password ở tab **Overview** → khối **Connection information**
(bấm **Show** để hiện password). Thay ba chỗ in hoa:

```text
mysql://avnadmin:MẬT_KHẨU@HOST:PORT/enghabit_dev?connection_limit=3&connect_timeout=15
```

Bốn chỗ dễ sai:

- Port **không phải 3306**
- Đuôi là `/enghabit_dev`, **không phải** `/defaultdb`
- **Bỏ** `ssl-mode=REQUIRED` mà Aiven cho sẵn — Prisma không hiểu tham số này
- Giữ nguyên `connection_limit=3` và `connect_timeout=15`

File `be/.env` nằm trong `.gitignore` nên **không đi theo `git clone`** — chuỗi này phải
truyền tay cho máy khác. Đừng dán vào chat nhóm.

Xong → **sang Bước 5**.

---

### Cách B — database riêng bằng XAMPP

#### 4B.1. Bật MySQL

1. Bấm **⊞** → gõ `xampp` → `Enter`
2. Dòng **Apache** bấm **Start**, dòng **MySQL** bấm **Start**
3. Hộp thoại tường lửa → **Allow access**
4. Hai dòng chuyển **nền xanh lá** là xong

#### 4B.2. Tạo database rỗng

1. Dòng **MySQL** bấm **Admin** → trình duyệt mở **phpMyAdmin**
   *(không tự mở thì vào `localhost/phpmyadmin`)*
2. Cột trái → **New**
3. Ô **Database name** → gõ `enghabit`
4. Ô **Collation** → gõ `utf8mb4_uni` để lọc → chọn **utf8mb4_unicode_ci**
5. **Create**

> Chọn sai Collation thì tiếng Việt hiện thành `?????`.

---

## Bước 5 — Tạo file cấu hình

```powershell
Copy-Item be\.env.example be\.env
notepad be\.env
```

Trong Notepad, xoá cả dòng `DATABASE_URL` rồi chép dòng ứng với cách đã chọn:

**Cách A:**

```ini
DATABASE_URL="mysql://avnadmin:MẬT_KHẨU@HOST:PORT/enghabit_dev?connection_limit=3&connect_timeout=15"
```

**Cách B:**

```ini
DATABASE_URL="mysql://root:@localhost:3306/enghabit?connection_limit=5"
```

**Cách A, máy thứ hai trở đi:** chép thêm hai dòng `JWT_ACCESS_SECRET` và
`JWT_REFRESH_SECRET` từ `be/.env` của máy chính sang, giống hệt từng ký tự.

> Secret lệch nhau thì đăng nhập được nhưng 15 phút sau bị đá ra, không báo lỗi gì.

`Ctrl` + `S` để lưu, `Alt` + `F4` để đóng. Các dòng khác giữ nguyên.

---

## Bước 6 — Cài đặt và nạp dữ liệu

Chép **từng lệnh một**, đợi dấu `>` quay lại mới sang lệnh tiếp.

```powershell
pnpm install
```

```powershell
pnpm build:shared
```

```powershell
pnpm hooks:install
```

```powershell
pnpm db:deploy
```

```powershell
pnpm db:seed
```

Ba điều bắt buộc:

- **Không dùng `pnpm db:migrate`** trên Cách A. Lệnh đó có thể xoá sạch database dùng chung.
- **Máy thứ hai trở đi (Cách A): bỏ qua `pnpm db:seed`.** Dữ liệu đã có trên server.
- `pnpm hooks:install` chạy **một lần trên mỗi máy**.

`pnpm db:deploy` trên máy thứ hai in `No pending migrations to apply` — đúng.

Sau `pnpm db:seed`: 9 tài khoản, 5 chủ đề, 40 từ vựng, 45 ngày lịch sử học mẫu.

### Kiểm tra bảng mã

```powershell
pnpm db:studio
```

Mở `localhost:5555` → bảng **User** → cột `name`. Thấy `Quản trị viên`,
`Nguyễn Minh Anh` đủ dấu là đạt. Thấy `?????` thì xem [bảng lỗi](#gặp-lỗi).

Xem xong bấm `Ctrl` + `C` để tắt — Prisma Studio giữ kết nối tới database.

---

## Bước 7 — Chạy chương trình

Cần **hai cửa sổ PowerShell**.

Cửa sổ 1:

```powershell
pnpm dev:be
```

Cửa sổ 2 — bấm **⊞** → `powershell` → `Enter`, rồi:

```powershell
cd $HOME\Desktop\enghabit
pnpm dev:fe
```

> Hai cửa sổ này **không** quay lại dấu `>` mà đứng yên. Đó là chương trình đang chạy.
> Đóng cửa sổ là tắt chương trình.

Mở trình duyệt vào `localhost:5173`.

---

## Đăng nhập

| Vai trò | Email | Mật khẩu |
|---|---|---|
| Quản trị viên | `admin@enghabit.com` | `A1234567` |
| Người học (có sẵn dữ liệu) | `user@enghabit.com` | `A1234567` |
| Tài khoản trắng | `newbie@enghabit.com` | `A1234567` |

---

## Tắt chương trình

1. Cả hai cửa sổ PowerShell: `Ctrl` + `C`, hỏi thì gõ `Y` + `Enter`
2. **Cách B:** mở XAMPP Control Panel, bấm **Stop** ở **MySQL** và **Apache**

---

## Những lần sau

1. **Cách B:** mở XAMPP → **Start** ở dòng **MySQL**
2. Hai cửa sổ PowerShell, mỗi cửa sổ `cd $HOME\Desktop\enghabit`, rồi `pnpm dev:be` và
   `pnpm dev:fe`
3. Trình duyệt vào `localhost:5173`

---

## Thêm một máy nữa vào dự án (Cách A)

Xin từ máy chính ba dòng trong `be/.env`: `DATABASE_URL`, `JWT_ACCESS_SECRET`,
`JWT_REFRESH_SECRET`.

1. Cài Node.js và Git theo [Bước 1](#bước-1--cài-phần-mềm) — **bỏ qua XAMPP**. Khởi động lại máy.
2. `npm install -g pnpm`
3. Clone theo [Bước 3](#bước-3--tải-mã-nguồn)
4. `Copy-Item be\.env.example be\.env` rồi `notepad be\.env`, thay cả ba dòng đã xin
5. Cài đặt: `pnpm hooks:install` rồi `pnpm sync`
6. Chạy theo [Bước 7](#bước-7--chạy-chương-trình)

**Không chạy `pnpm db:seed`.** Dữ liệu đã có trên server.

Đăng nhập xong, dữ liệu phải giống hệt máy chính. Không giống thì `DATABASE_URL` sai —
kiểm đuôi có đúng `/enghabit_dev` không.

---

## Cập nhật khi có bản mới

```powershell
git pull
```

Một lệnh. Hook `post-merge` tự chạy phần cần chạy:

| Commit đụng vào | Hook chạy |
|---|---|
| `package.json`, `pnpm-lock.yaml` | `pnpm install` |
| `shared/` | `pnpm build:shared` |
| `be/prisma/` | `prisma migrate deploy` + `prisma generate` |

Điều kiện: đã chạy `pnpm hooks:install`, và database kết nối được lúc pull.

Hook **không** chạy seed. Muốn nạp lại dữ liệu mẫu thì tự gọi `pnpm db:seed`.

**Cách A:** schema đổi ngay khi một máy pull. Máy chưa pull sẽ lỗi cột không tồn tại — cả
nhóm nên pull cùng lúc khi commit có đụng `be/prisma/`.

Hook lỗi, hoặc máy vừa clone:

```powershell
pnpm sync
```

---

## Gặp lỗi

| Màn hình hiện gì | Làm gì |
|---|---|
| `pnpm : not recognized` | Đóng PowerShell, mở lại, gõ `npm install -g pnpm` |
| `Can't reach database server` | **B:** mở XAMPP bấm **Start** ở **MySQL**. **A:** kiểm mạng; mở Aiven Console xem service có **Running**; nhớ port **không phải 3306** |
| `Too many connections` | Đóng bớt Prisma Studio; kiểm `connection_limit=3` có trong `DATABASE_URL` |
| `unknown Cert Authority` | Bỏ `sslaccept=strict` khỏi `DATABASE_URL` |
| `Unknown database 'enghabit_dev'` | Aiven Console → tab **Databases** → **Create database** |
| `Unknown database 'enghabit'` | Làm lại mục 4B.2 |
| `Access denied for user 'root'` | Chép lại dòng `DATABASE_URL` ở Bước 5 |
| `Port 4000 is already in use` | Đã có cửa sổ chạy `pnpm dev:be` — tìm và bấm `Ctrl` + `C` |
| Trình duyệt báo *không thể truy cập trang* | Chạy lại `pnpm dev:fe` |
| Trang trắng | `Ctrl` + `C` cả hai cửa sổ, chạy `pnpm build:shared`, làm lại Bước 7 |
| Tiếng Việt thành `?????` | **B:** phpMyAdmin → database `enghabit` → **Operations** → **Drop**, làm lại 4B.2. **A:** Aiven Console → **Databases** → xoá `enghabit_dev`, tạo lại. Rồi chạy lại `pnpm db:deploy` và `pnpm db:seed` |
| Đăng nhập xong ~15 phút bị đá ra | Chép lại `JWT_ACCESS_SECRET` và `JWT_REFRESH_SECRET` từ máy chính, khởi động lại `pnpm dev:be` |
| Dữ liệu khác máy chính | `DATABASE_URL` trỏ sai — kiểm đuôi `/enghabit_dev` |
| Nút **Start** MySQL trong XAMPP bật rồi tắt ngay | Máy đã có MySQL khác chiếm cổng 3306, tắt nó đi |

**Xem thẳng dữ liệu:** `pnpm db:studio` → `localhost:5555`. Xem xong `Ctrl` + `C`.
