# ENG//HABIT

Ứng dụng hỗ trợ xây dựng và duy trì thói quen học tiếng Anh — học từ vựng, ôn flashcard,
làm quiz, theo dõi chuỗi ngày học và thống kê tiến độ.

Hướng dẫn dưới đây viết cho người **chưa từng lập trình**. Cứ làm lần lượt từ Bước 1
xuống Bước 7, tổng cộng khoảng **15–20 phút**. Chương trình chạy trên máy của bạn.

---

## Bước 1 — Cài 3 phần mềm (chỉ làm một lần)

| Phần mềm | Tải ở đâu | Cài thế nào |
|---|---|---|
| **Node.js** | [nodejs.org](https://nodejs.org) | Tải bản **LTS**, mở file và bấm Next đến hết |
| **Git** | [git-scm.com/downloads](https://git-scm.com/downloads) | Mở file và bấm Next đến hết |
| **XAMPP** | [apachefriends.org](https://www.apachefriends.org) | Mở file và bấm Next đến hết (đây là phần mềm chạy database) |

Cài xong **khởi động lại máy** để máy nhận các phần mềm mới.

---

## Bước 2 — Mở cửa sổ dòng lệnh

Nhiều bước sau cần gõ lệnh. Cách mở:

1. Bấm phím **Windows**, gõ `powershell`
2. Bấm vào **Windows PowerShell**

Một cửa sổ nền xanh/đen hiện ra — đây là nơi bạn gõ lệnh. Mỗi lệnh gõ xong bấm **Enter**.

Cách biết một lệnh đã chạy xong: cửa sổ hiện lại dòng chữ kết thúc bằng dấu `>` và con
trỏ nhấp nháy chờ bạn gõ tiếp. Chưa thấy dấu đó thì cứ đợi, đừng gõ chồng lên.

Gõ thử lệnh này để kiểm tra Bước 1 đã xong chưa:

```powershell
node -v
```

Nếu hiện ra số phiên bản (ví dụ `v22.14.0`) là được. Nếu báo *not recognized*, nghĩa là
Node.js chưa cài xong — quay lại Bước 1.

Tiếp theo, cài công cụ `pnpm` bằng lệnh:

```powershell
npm install -g pnpm
```

---

## Bước 3 — Tải mã nguồn về máy

Gõ lần lượt 2 lệnh sau. Lệnh đầu chuyển vào màn hình Desktop, lệnh sau tải dự án về:

```powershell
cd $HOME\Desktop
git clone https://github.com/brannthichmeo-create/enghabit.git
```

Xong sẽ có thư mục **enghabit** trên Desktop. Chuyển vào thư mục đó:

```powershell
cd enghabit
```

> Từ đây trở đi, **mọi lệnh đều gõ trong cửa sổ này**, đừng đóng nó lại.

---

## Bước 4 — Bật database

1. Mở **XAMPP Control Panel** (bấm phím Windows, gõ `xampp`)
2. Bấm nút **Start** ở **cả hai dòng**: **Apache** và **MySQL**
   *(MySQL là database; Apache chỉ để mở trang quản lý database ở bước tiếp theo)*
3. Đợi đến khi tên cả hai chuyển sang **nền xanh lá** là xong

Tiếp theo tạo một database rỗng cho ứng dụng:

4. Mở trình duyệt, vào <http://localhost/phpmyadmin>
5. Bấm **New** (Mới) ở cột bên trái
6. Ô tên database gõ: `enghabit`
7. Ô bên cạnh chọn: `utf8mb4_unicode_ci` — **bắt buộc**, nếu chọn sai thì tiếng Việt sẽ hiện thành dấu hỏi
8. Bấm **Create** (Tạo)

---

## Bước 5 — Tạo file cấu hình

Trong cửa sổ PowerShell, gõ:

```powershell
Copy-Item be\.env.example be\.env
```

Lệnh này tạo file cấu hình từ file mẫu. Tiếp theo mở file đó ra để sửa một dòng:

```powershell
notepad be\.env
```

Notepad hiện ra. Tìm dòng bắt đầu bằng `DATABASE_URL` và sửa thành đúng như sau:

```ini
DATABASE_URL="mysql://root:@localhost:3306/enghabit?connection_limit=5"
```

Bấm **Ctrl+S** để lưu rồi đóng Notepad. Các dòng khác giữ nguyên.

---

## Bước 6 — Cài đặt và chuẩn bị dữ liệu

Gõ lần lượt **4 lệnh**, chờ lệnh trước chạy xong mới gõ lệnh sau:

```powershell
pnpm install
```

```powershell
pnpm build:shared
```

```powershell
pnpm db:migrate
```

```powershell
pnpm db:seed
```

Lệnh 1 tải các thư viện cần thiết (lâu nhất, khoảng 2–3 phút). Lệnh 3 tạo toàn bộ bảng
trong database. Lệnh 4 nạp dữ liệu mẫu: 3 tài khoản, 5 chủ đề, 40 từ vựng, 5 bài quiz và
45 ngày lịch sử học để bạn có sẵn số liệu mà xem.

---

## Bước 7 — Chạy chương trình

Cần **hai cửa sổ PowerShell** chạy song song.

**Cửa sổ 1** — chính là cửa sổ đang mở, gõ:

```powershell
pnpm dev:be
```

Để nguyên, đừng đóng. Đây là phần máy chủ xử lý dữ liệu.

**Cửa sổ 2** — mở thêm một cửa sổ PowerShell nữa (làm lại Bước 2: bấm phím Windows, gõ
`powershell`, bấm vào **Windows PowerShell**), rồi gõ 2 lệnh:

```powershell
cd $HOME\Desktop\enghabit
pnpm dev:fe
```

Đây là phần giao diện. Cũng để nguyên, đừng đóng.

> **Lưu ý quan trọng:** sau hai lệnh này, cửa sổ sẽ **không** quay lại dấu nhắc `>` nữa mà
> đứng yên. Đó là bình thường — nghĩa là chương trình đang chạy, không phải bị treo. Đóng
> cửa sổ là chương trình tắt.

Cuối cùng mở trình duyệt vào: **<http://localhost:5173>**

---

## Đăng nhập

| Vai trò | Email | Mật khẩu |
|---|---|---|
| Quản trị viên | `admin@enghabit.com` | `A1234567` |
| Người học (có sẵn dữ liệu) | `user@enghabit.com` | `A1234567` |
| Tài khoản trắng | `newbie@enghabit.com` | `A1234567` |

Đăng nhập bằng tài khoản **quản trị viên** sẽ vào trang quản lý hệ thống; tài khoản
**người học** vào màn hình học tập.

---

## Những lần sau muốn chạy lại

Bước 1–6 chỉ làm một lần. Lần sau chỉ cần 3 việc:

1. Mở XAMPP → bấm **Start** ở dòng **MySQL** (lần này không cần Apache, trừ khi bạn muốn mở lại phpMyAdmin)
2. Mở 2 cửa sổ PowerShell, mỗi cửa sổ gõ `cd $HOME\Desktop\enghabit` rồi lần lượt `pnpm dev:be` và `pnpm dev:fe`
3. Vào <http://localhost:5173>

**Muốn tắt chương trình:** bấm **Ctrl+C** trong cả hai cửa sổ, rồi bấm **Stop** ở XAMPP.

---

## Gặp lỗi thì xem bảng này

| Hiện tượng | Nguyên nhân | Cách sửa |
|---|---|---|
| `pnpm : not recognized` | Chưa cài pnpm, hoặc cài xong chưa mở lại cửa sổ | Đóng PowerShell, mở lại rồi gõ `npm install -g pnpm` |
| `Can't reach database server` | Chưa bật MySQL | Mở XAMPP, bấm **Start** ở dòng MySQL |
| `Unknown database 'enghabit'` | Chưa tạo database | Làm lại Bước 4, phần phpMyAdmin |
| `Access denied for user 'root'` | Dòng `DATABASE_URL` sai | Làm lại Bước 5, chép đúng nguyên dòng đó |
| `Port 4000 is already in use` | Đã có một cửa sổ chạy `pnpm dev:be` rồi | Đóng cửa sổ cũ, hoặc bấm Ctrl+C trong đó |
| Trang trắng, không hiện gì | Thiếu bước `pnpm build:shared` | Bấm Ctrl+C ở cả 2 cửa sổ, chạy `pnpm build:shared` rồi chạy lại Bước 7 |
| Tiếng Việt hiện thành `?????` | Database tạo sai bảng mã | Xoá database `enghabit` trong phpMyAdmin, làm lại Bước 4 với `utf8mb4_unicode_ci`, rồi chạy lại `pnpm db:migrate` và `pnpm db:seed` |

Muốn xem thẳng dữ liệu trong database: gõ `pnpm db:studio`, rồi mở <http://localhost:5555>

---

## Dành cho người phát triển

Quy ước viết code, đặt tên commit, cấu trúc thư mục: [CLAUDE.md](CLAUDE.md).
Hướng dẫn đưa hệ thống lên Internet: [docs/deployment.md](docs/deployment.md) và
[docs/aiven-setup.md](docs/aiven-setup.md).
