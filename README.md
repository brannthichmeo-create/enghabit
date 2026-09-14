# ENGHABIT

Ứng dụng hỗ trợ xây dựng và duy trì thói quen học tiếng Anh — học từ vựng, ôn flashcard,
làm quiz, theo dõi chuỗi ngày học và thống kê tiến độ.



## Vài quy ước đọc hướng dẫn

**Phím Windows** là phím có hình 4 ô vuông (logo Windows), nằm giữa `Ctrl` và `Alt` ở hàng
dưới cùng bên trái bàn phím. Trong hướng dẫn viết tắt là **⊞**.

**Cách chép lệnh trong tài liệu này vào máy** (khỏi gõ tay, tránh sai chính tả):

1. Bôi đen dòng lệnh bằng chuột
2. Bấm `Ctrl` + `C` để chép
3. Sang cửa sổ PowerShell, **bấm chuột phải** một cái — lệnh tự dán vào
4. Bấm `Enter` để chạy

---

## Bước 1 — Cài 3 phần mềm

> **Làm ở đâu:** trình duyệt web (Chrome, Edge, Cốc Cốc — cái nào cũng được)

### 1.1. Node.js

1. Mở trình duyệt, gõ vào thanh địa chỉ trên cùng: `nodejs.org` rồi bấm `Enter`
2. Bấm nút màu xanh lá có chữ **Download Node.js (LTS)**
3. File tải xong nằm trong thư mục **Downloads**. Bấm vào file đó (tên dạng `node-v22...msi`)
4. Cửa sổ cài đặt hiện ra → bấm **Next**
5. Tích vào ô **I accept the terms...** → bấm **Next**
6. Bấm **Next** tiếp 3 lần nữa, không đổi gì cả
7. Tới màn hình có chữ *Tools for Native Modules* — **không tích ô nào**, bấm **Next**
8. Bấm **Install** → nếu Windows hỏi *Do you want to allow...* thì bấm **Yes**
9. Đợi khoảng 1 phút → bấm **Finish**

### 1.2. Git

1. Vào địa chỉ: `git-scm.com/downloads`
2. Bấm **Download for Windows** → chọn **64-bit Git for Windows Setup**
3. Mở file vừa tải trong thư mục **Downloads**
4. Bấm **Next** liên tục cho tới khi nút chuyển thành **Install** (khoảng 10 lần, giữ nguyên mọi lựa chọn có sẵn)
5. Bấm **Install** → đợi → bỏ tích ô *View Release Notes* → bấm **Finish**

### 1.3. XAMPP — phần mềm chạy database

> **Nhiều máy cùng làm một dự án thì bỏ qua mục này.** Bước 4 cho chọn giữa database dùng
> chung trên Internet (Cách A — không cần XAMPP) và database riêng trên máy (Cách B — cần
> XAMPP). Đọc trước bảng so sánh ở [Bước 4](#bước-4--chuẩn-bị-database) rồi quay lại đây
> nếu chọn Cách B.

1. Vào địa chỉ: `apachefriends.org`
2. Bấm nút **XAMPP for Windows**
3. Mở file vừa tải (tên dạng `xampp-windows-x64...exe`)
4. Nếu hiện cảnh báo màu vàng về *User Account Control* → bấm **OK**
5. Bấm **Next** → **Next** → thư mục cài để nguyên `C:\xampp` → **Next** → **Next** → **Next**
6. Bấm **Install**, đợi 3–5 phút
7. Bấm **Finish**

### 1.4. Khởi động lại máy

Bấm **⊞** → biểu tượng nguồn → **Restart**. Bước này bắt buộc; bỏ qua thì máy chưa nhận
các phần mềm vừa cài.

---

## Bước 2 — Mở cửa sổ dòng lệnh

> **Phần mềm dùng:** Windows PowerShell — có sẵn trong Windows, không phải cài

1. Bấm phím **⊞**
2. Gõ: `powershell`
3. Bấm `Enter`

Một cửa sổ nền xanh đậm hoặc đen hiện ra, có dòng chữ kết thúc bằng dấu `>` và con trỏ
nhấp nháy. Đây là nơi gõ lệnh.

**Kiểm tra Bước 1 đã xong chưa** — chép lệnh sau vào rồi bấm `Enter`:

```powershell
node -v
```

- Hiện ra dãy số kiểu `v22.14.0` → **đạt**, đi tiếp
- Hiện chữ đỏ *not recognized* → Node.js chưa cài xong hoặc chưa khởi động lại máy, quay lại Bước 1

**Cài thêm công cụ `pnpm`** — chép lệnh sau, bấm `Enter`, đợi khoảng 30 giây:

```powershell
npm install -g pnpm
```

> **Cách biết một lệnh đã chạy xong:** cửa sổ hiện lại dòng kết thúc bằng dấu `>` và con
> trỏ nhấp nháy chờ bạn. Chưa thấy thì cứ đợi, đừng gõ chồng lệnh khác vào.

---

## Bước 3 — Tải mã nguồn về máy

> **Phần mềm dùng:** vẫn cửa sổ PowerShell ở Bước 2

Chép từng lệnh, mỗi lệnh bấm `Enter` rồi đợi chạy xong mới sang lệnh sau.

Lệnh 1 — chuyển vào màn hình Desktop:

```powershell
cd $HOME\Desktop
```

Lệnh 2 — tải dự án về, mất khoảng 1 phút:

```powershell
git clone https://github.com/brannthichmeo-create/enghabit.git
```

Lệnh 3 — đi vào thư mục vừa tải:

```powershell
cd enghabit
```

Sau lệnh này, dòng chữ trong PowerShell kết thúc bằng `...\Desktop\enghabit>`. Nhìn thấy
chữ `enghabit` ở cuối là đúng.

> **Đừng đóng cửa sổ này** — các bước sau vẫn dùng nó. Lỡ đóng thì mở lại theo Bước 2 rồi
> gõ `cd $HOME\Desktop\enghabit` để quay về đúng chỗ.

---

## Bước 4 — Chuẩn bị database

Chọn **một** trong hai cách. Đọc bảng rồi quyết, vì Bước 5 điền khác nhau.

| Tiêu chí | Cách A — dùng chung trên Aiven | Cách B — database riêng bằng XAMPP |
|---|---|---|
| Dữ liệu giữa các máy | **Giống nhau tức thì** | Mỗi máy một bộ riêng |
| Cần cài XAMPP | Không | Có |
| Cần mạng | Có — mất mạng là không chạy được | Không |
| Rủi ro | Máy nào xoá nhầm là mất ở mọi máy | Không ảnh hưởng máy khác |

**Nhiều máy cùng làm một dự án → chọn A.** Một máy duy nhất, hoặc hay làm khi không có
mạng → chọn B.

Chọn A thì làm mục 4A rồi bỏ qua 4.1 và 4.2. Chọn B thì bỏ qua 4A.

---

### 4A. Cách A — database dùng chung trên Aiven

> **Phần mềm dùng:** trình duyệt web

**Toàn bộ mục 4A chỉ làm một lần, trên máy chính.** Máy thứ hai trở đi bỏ qua hết — chỉ
cần xin chuỗi kết nối ở mục 4A.6 rồi nhảy tới [Bước 5](#bước-5--tạo-file-cấu-hình).

Đã có sẵn service `enghabit-db` trên Aiven thì bỏ qua 4A.1 và 4A.2, vào thẳng 4A.3.

#### 4A.1. Đăng ký tài khoản Aiven

1. Mở trình duyệt, vào địa chỉ `aiven.io`
2. Bấm nút **Sign up** ở góc trên bên phải
3. Đăng ký bằng Google, GitHub hoặc email. **Không cần thẻ tín dụng.**
4. Đăng ký xong, Aiven tạo sẵn một *organization* và một *project* mặc định — dùng luôn,
   không cần tạo mới

#### 4A.2. Tạo service MySQL

1. Cột bên trái → bấm **Services**
2. Bấm nút **Create service**
3. Danh sách loại service hiện ra → chọn **MySQL**
4. Kéo xuống mục **Service plan** → chọn tab **Free**
   *(gói free hiển thị là **Free plan** hoặc `free-1-5gb`)*
   - Không thấy tab **Free** thì đổi nhà cung cấp ở mục 5 — gói free chỉ có ở một số cloud
5. Mục **Cloud provider & region** → chọn vùng **Singapore**
   - Phải khớp `region: singapore` trong `render.yaml`. Đặt lệch châu lục thì **mỗi truy
     vấn** chậm thêm vài trăm mili giây, trang thống kê thấy rõ bằng mắt
6. Ô **Service name** → gõ `enghabit-db`
7. Bấm **Create service**
8. Trang service hiện ra, trạng thái ban đầu là **Rebuilding**. Đợi vài phút tới khi
   chuyển sang **Running** — chưa Running thì chưa kết nối được

#### 4A.3. Tạo database riêng cho việc phát triển

1. Trong danh sách **Services**, bấm vào `enghabit-db`
2. Thanh tab phía trên → bấm tab **Databases**
3. Bấm nút **Create database**
4. Ô **Name** → gõ chính xác `enghabit_dev`
5. Bấm **Add database**

Danh sách giờ có hai dòng: `defaultdb` và `enghabit_dev`.

> **Hai database này có vai trò khác nhau, đừng dùng lẫn:**
>
> - `defaultdb` — production, **chỉ Render dùng**
> - `enghabit_dev` — mọi máy dev dùng chung
>
> Máy dev trỏ vào `defaultdb` là ghi thẳng vào dữ liệu thật của người dùng, và một lần
> chạy migration nhầm là đổi schema production. Tách ra không tốn thêm đồng nào — gói free
> giới hạn một *service*, không giới hạn số database bên trong.

#### 4A.4. Lấy thông tin kết nối

1. Bấm tab **Overview**
2. Tìm khối **Connection information**
3. Ghi lại bốn giá trị (bấm **Show** ở dòng Password để hiện mật khẩu):

| Trường | Ví dụ |
|---|---|
| Host | `enghabit-db-xxxx.f.aivencloud.com` |
| Port | `12691` |
| User | `avnadmin` |
| Password | chuỗi ngẫu nhiên dài |

#### 4A.5. Ghép chuỗi kết nối

Thay ba chỗ in hoa bằng giá trị vừa ghi:

```text
mysql://avnadmin:MẬT_KHẨU@HOST:PORT/enghabit_dev?connection_limit=3&connect_timeout=15
```

Bốn chỗ dễ sai:

- **Port không phải 3306** — Aiven dùng cổng ngẫu nhiên
- **Tên database là `enghabit_dev`**, không phải `defaultdb`
- **Bỏ `ssl-mode=REQUIRED`** mà Aiven cho sẵn trong Service URI — đó là tham số của MySQL
  CLI, Prisma không hiểu. Kết nối vẫn mã hoá vì Aiven bắt buộc TLS
- **`connection_limit=3`**, không phải 5 — gói free cho tối đa 76 kết nối, mà giờ chia cho
  nhiều máy dev cộng với Render cộng với Prisma Studio. Chạm trần thì lỗi báo ra là
  `Too many connections`, rất khó đoán nguyên nhân

#### 4A.6. Đưa chuỗi này cho các máy khác

Chuỗi có mật khẩu quản trị toàn database. File `.env` nằm trong `.gitignore` nên **không
đi theo `git pull`** — phải truyền tay. Đừng dán vào chat nhóm hay ảnh chụp màn hình.

Xong mục 4A thì **nhảy thẳng tới Bước 5**.

---

### 4.1. Bật hai dịch vụ

1. Bấm **⊞**, gõ `xampp`, bấm `Enter` để mở **XAMPP Control Panel**
2. Cửa sổ hiện bảng có các dòng: **Apache**, **MySQL**, FileZilla, Mercury, Tomcat
3. Ở dòng **Apache**, bấm nút **Start** (cột *Actions*)
4. Ở dòng **MySQL**, bấm nút **Start**
5. Nếu Windows hiện hộp thoại tường lửa → bấm **Allow access**
6. Đợi vài giây, tên **Apache** và **MySQL** chuyển sang **nền xanh lá** là đã chạy

*MySQL chính là database. Apache chỉ cần để mở trang quản lý ở mục tiếp theo.*

### 4.2. Tạo database rỗng

1. Vẫn trong XAMPP Control Panel, ở dòng **MySQL** bấm nút **Admin** — trình duyệt tự mở
   trang **phpMyAdmin**
   *(không tự mở thì vào trình duyệt gõ địa chỉ `localhost/phpmyadmin`)*
2. Ở **cột bên trái**, bấm chữ **New** (bản tiếng Việt là **Mới**)
3. Khung giữa hiện ô trống **Database name** → gõ vào: `enghabit`
4. Ô thả xuống ngay bên phải (nhãn *Collation*) → bấm vào, gõ `utf8mb4_uni` để lọc, rồi
   chọn dòng **utf8mb4_unicode_ci**
5. Bấm nút **Create** (**Tạo**)
6. Tên `enghabit` xuất hiện ở cột trái là xong

> Chọn sai ở mục 4 thì tiếng Việt trong ứng dụng sẽ hiện thành `?????`.

---

## Bước 5 — Tạo file cấu hình

> **Phần mềm dùng:** PowerShell (cửa sổ ở Bước 3), sau đó là Notepad

Chép lệnh sau vào PowerShell, bấm `Enter` — lệnh này tạo file cấu hình từ file mẫu:

```powershell
Copy-Item be\.env.example be\.env
```

Chép tiếp lệnh này, bấm `Enter` — Notepad sẽ mở file vừa tạo:

```powershell
notepad be\.env
```

Trong cửa sổ **Notepad**:

1. Tìm dòng bắt đầu bằng `DATABASE_URL`, khoảng dòng thứ 9 từ trên xuống
2. Bôi đen **toàn bộ dòng đó** rồi bấm `Delete` để xoá
3. Chép dòng ứng với cách bạn đã chọn ở Bước 4 vào đúng chỗ vừa xoá:

**Cách A — dùng chung trên Aiven.** Thay ba chỗ in hoa bằng giá trị ở mục 4A.3:

```ini
DATABASE_URL="mysql://avnadmin:MẬT_KHẨU@HOST:PORT/enghabit_dev?connection_limit=3&connect_timeout=15"
```

**Cách B — XAMPP trên máy này:**

```ini
DATABASE_URL="mysql://root:@localhost:3306/enghabit?connection_limit=5"
```

4. Bấm `Ctrl` + `S` để lưu
5. Bấm `Alt` + `F4` để đóng Notepad

Các dòng khác trong file giữ nguyên, không đụng tới.

### Riêng Cách A — thêm một việc nữa

Trên **máy thứ hai trở đi**, chép thêm hai dòng `JWT_ACCESS_SECRET` và `JWT_REFRESH_SECRET`
từ file `be/.env` của máy chính sang, thay vào đúng hai dòng cùng tên.

> **Vì sao phải giống nhau.** Database dùng chung nên bảng `refresh_tokens` cũng dùng
> chung. Đăng nhập ở máy A ghi một dòng token vào đó; máy B có secret khác sẽ không xác
> thực được token ấy và đá người dùng ra ngoài sau 15 phút — không có thông báo lỗi nào.
> Đặt giống nhau thì phiên đăng nhập dùng được ở mọi máy.

---

## Bước 6 — Cài đặt và nạp dữ liệu

> **Phần mềm dùng:** PowerShell

Chép **từng lệnh một**, bấm `Enter`, đợi thấy dấu `>` quay lại rồi mới sang lệnh tiếp.

Lệnh 1 — tải thư viện, lâu nhất, khoảng 2–3 phút:

```powershell
pnpm install
```

Lệnh 2 — chuẩn bị phần dùng chung:

```powershell
pnpm build:shared
```

Lệnh 3 — bật đồng bộ tự động cho những lần `git pull` sau này:

```powershell
pnpm hooks:install
```

Lệnh này chạy **một lần duy nhất trên mỗi máy**. Giải thích ở mục
[Cập nhật khi máy chính có bản mới](#cập-nhật-khi-máy-chính-có-bản-mới).

Lệnh 4 — tạo toàn bộ bảng trong database:

```powershell
pnpm db:deploy
```

Cách A trên máy thứ hai trở đi sẽ thấy `No pending migrations to apply` — đúng, vì máy
chính đã tạo bảng rồi.

> **Dùng `pnpm db:deploy`, tuyệt đối không dùng `pnpm db:migrate`.**
> `db:migrate` gọi `prisma migrate dev`, và `migrate dev` được phép **xoá rồi tạo lại**
> database khi thấy lệch. Trên database dùng chung, một lần chạy nhầm là xoá sạch dữ liệu
> của mọi máy. `db:migrate` chỉ dành cho Cách B, và chỉ khi bạn đang tự sửa schema.

Lệnh 5 — nạp dữ liệu mẫu:

```powershell
pnpm db:seed
```

> **Cách A: chỉ chạy lệnh 5 một lần, trên máy chính.** Database dùng chung nên máy thứ hai
> chạy lại là ghi đè lên dữ liệu mẫu mà mọi máy đang dùng. Seed idempotent nên không nhân
> đôi dữ liệu, nhưng nó **đặt lại** các bản ghi mẫu về trạng thái gốc — mất mọi chỉnh sửa
> bạn đã làm lên chúng. **Máy thứ hai trở đi bỏ qua lệnh này**, dữ liệu đã có sẵn trên
> server.

Sau lệnh 5, màn hình hiện dòng *Seed hoàn tất* kèm danh sách tài khoản. Lúc này database
đã có 3 tài khoản, 5 chủ đề, 40 từ vựng và 45 ngày lịch sử học mẫu.

### Kiểm tra bảng mã một lần

Dữ liệu có tiếng Việt có dấu, nên database bắt buộc dùng bảng mã `utf8mb4`. Sai bảng mã
thì mọi chữ có dấu biến thành `?????`, và phát hiện muộn thì phải nạp lại toàn bộ dữ liệu.

Cách kiểm nhanh nhất là nhìn chính dữ liệu vừa nạp:

```powershell
pnpm db:studio
```

Trình duyệt mở `localhost:5555`. Bấm bảng **Topic** ở cột trái, nhìn cột `name`.

- Thấy chữ có dấu đầy đủ (*Giao tiếp hằng ngày*, *Công việc*…) → **đạt**
- Thấy `?????` hoặc ký tự lạ → sai bảng mã, xem dòng *Tiếng Việt hiện thành `?????`* ở
  [bảng lỗi](#gặp-lỗi-thì-xem-bảng-này)

Xem xong bấm `Ctrl` + `C` ở PowerShell để tắt Prisma Studio — nó giữ kết nối tới database,
để mở lâu sẽ ăn mất phần kết nối của các máy khác.

---

## Bước 7 — Chạy chương trình

> **Phần mềm dùng:** hai cửa sổ PowerShell và trình duyệt

Chương trình gồm hai phần chạy song song nên cần **hai cửa sổ** riêng.

### 7.1. Cửa sổ thứ nhất — phần xử lý dữ liệu

Dùng luôn cửa sổ đang mở, chép lệnh sau rồi bấm `Enter`:

```powershell
pnpm dev:be
```

### 7.2. Cửa sổ thứ hai — phần giao diện

1. Bấm **⊞**, gõ `powershell`, bấm `Enter` — cửa sổ mới hiện ra, cửa sổ cũ để yên
2. Chép lệnh này, bấm `Enter`:

```powershell
cd $HOME\Desktop\enghabit
```

3. Chép lệnh này, bấm `Enter`:

```powershell
pnpm dev:fe
```

> **Lưu ý quan trọng:** sau hai lệnh này, cửa sổ **không** quay lại dấu `>` nữa mà đứng
> yên. Đó là bình thường — nghĩa là chương trình đang chạy chứ không phải bị treo. Đóng
> cửa sổ là chương trình tắt. Chuyển qua lại giữa hai cửa sổ bằng `Alt` + `Tab`.

### 7.3. Mở ứng dụng

Mở trình duyệt, gõ vào thanh địa chỉ `localhost:5173` rồi bấm `Enter`.

---

## Đăng nhập

Trang đăng nhập hiện ra, dùng một trong ba tài khoản sau:

| Vai trò | Email | Mật khẩu |
|---|---|---|
| Quản trị viên | `admin@enghabit.com` | `A1234567` |
| Người học (có sẵn dữ liệu) | `user@enghabit.com` | `A1234567` |
| Tài khoản trắng | `newbie@enghabit.com` | `A1234567` |

Tài khoản **quản trị viên** vào trang quản lý hệ thống. Tài khoản **người học** vào màn
hình học tập.

---

## Tắt chương trình

1. Ở **cả hai cửa sổ PowerShell**: bấm `Ctrl` + `C`; nếu được hỏi thì gõ `Y` rồi bấm `Enter`
2. **Chỉ Cách B:** mở **XAMPP Control Panel**, bấm **Stop** ở dòng **MySQL** và **Apache**
   *(Cách A không có gì để tắt — database chạy trên Aiven)*

---

## Những lần sau muốn chạy lại

Bước 1–6 chỉ làm một lần duy nhất. Lần sau còn 3 việc, mất khoảng 1 phút:

1. Mở **XAMPP Control Panel** → bấm **Start** ở dòng **MySQL**
   *(không cần Apache, trừ khi muốn mở lại phpMyAdmin)*
   **Cách A bỏ qua bước này** — database chạy trên Aiven, chỉ cần có mạng
2. Mở **hai cửa sổ PowerShell**, ở mỗi cửa sổ gõ `cd $HOME\Desktop\enghabit`, rồi:
   - Cửa sổ 1 gõ `pnpm dev:be`
   - Cửa sổ 2 gõ `pnpm dev:fe`
3. Mở trình duyệt vào `localhost:5173`

---

## Cách A — thêm một máy nữa vào dự án

Máy chính đã làm xong Bước 1–7. Máy mới cần đúng 6 việc, khoảng 10 phút.

**Chuẩn bị:** xin từ máy chính ba giá trị trong file `be/.env` — `DATABASE_URL`,
`JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`. Ba dòng này **không đi theo `git clone`** vì
`.env` nằm trong `.gitignore`.

**1.** Cài Node.js và Git theo [Bước 1](#bước-1--cài-3-phần-mềm) — **bỏ qua mục 1.3
(XAMPP)**, database chạy trên Aiven. Khởi động lại máy.

**2.** Cài pnpm theo [Bước 2](#bước-2--mở-cửa-sổ-dòng-lệnh):

```powershell
npm install -g pnpm
```

**3.** Tải mã nguồn:

```powershell
cd $HOME\Desktop
git clone https://github.com/brannthichmeo-create/enghabit.git
cd enghabit
```

**4.** Tạo file cấu hình rồi dán ba giá trị đã xin:

```powershell
Copy-Item be\.env.example be\.env
notepad be\.env
```

Thay cả ba dòng `DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` bằng giá trị của
máy chính, **giống hệt từng ký tự**. Lưu bằng `Ctrl` + `S`, đóng bằng `Alt` + `F4`.

**5.** Cài đặt — một lệnh làm hết:

```powershell
pnpm hooks:install
pnpm sync
```

`pnpm sync` chạy `pnpm install` + `build:shared` + `db:deploy` + `prisma generate`.
Dòng `No pending migrations to apply` là kết quả đúng — máy chính đã tạo bảng rồi.

> **Không chạy `pnpm db:seed`.** Dữ liệu đã nằm trên server. Chạy lại sẽ đặt các bản ghi
> mẫu về trạng thái gốc, xoá mọi chỉnh sửa máy chính đã làm lên chúng.

**6.** Chạy thử theo [Bước 7](#bước-7--chạy-chương-trình). Đăng nhập xong, dữ liệu phải
**giống hệt máy chính**. Không giống thì `DATABASE_URL` đang trỏ sai database — kiểm lại
đuôi có đúng `/enghabit_dev` không.

---

## Cập nhật khi máy chính có bản mới

Kéo code mới về thì **database không tự đổi theo**. Commit mới có thể thêm bảng hoặc thêm
cột; chạy code mới trên database cũ sẽ báo lỗi cột không tồn tại, và thông báo lỗi đó
không nói gì về nguyên nhân thật.

### Bật một lần duy nhất trên mỗi máy

Đã chạy ở lệnh 3 của [Bước 6](#bước-6--cài-đặt-và-nạp-dữ-liệu). Máy nào bỏ sót thì chạy
lại, không hại gì:

```powershell
pnpm hooks:install
```

Lệnh này bảo git dùng các hook nằm trong thư mục `.githooks` của dự án.

### Từ đó về sau

```powershell
git pull
```

Chỉ một lệnh. Sau khi kéo code về, hook `post-merge` tự kiểm tra xem commit mới đụng vào
những gì rồi chạy đúng phần cần chạy:

| Commit mới đụng vào | Hook tự chạy |
|---|---|
| `package.json`, `pnpm-lock.yaml` | `pnpm install` |
| `shared/` | `pnpm build:shared` |
| `be/prisma/` | `prisma migrate deploy` + `prisma generate` |

Không đụng gì thì hook không chạy gì, `git pull` xong ngay.

> **Database phải kết nối được lúc `git pull`.** Cách A cần có mạng; Cách B cần bật MySQL
> trong XAMPP. Không kết nối được thì hook in `CẢNH BÁO: không áp được migration` — không
> sao cả, nối lại rồi chạy `pnpm db:deploy` là xong.

**Cách A — database dùng chung.** Máy nào pull trước sẽ áp migration; các máy pull sau nhận
`No pending migrations to apply` và bỏ qua. Đó là hành vi đúng, không phải lỗi. Nhưng có
một hệ quả thật: **schema đổi ngay khi một máy pull, kể cả máy khác chưa pull.** Máy chưa
pull đang chạy code cũ trên schema mới, và sẽ lỗi cột không tồn tại. Cả nhóm nên pull cùng
lúc khi commit mới có đụng `be/prisma/`.

Hook **cố ý không chạy seed**. Seed ghi đè dữ liệu mẫu; chạy tự động sau mỗi lần pull là
cách nhanh nhất để mất dữ liệu bạn vừa tạo tay để thử. Muốn nạp lại dữ liệu mẫu thì tự
gọi `pnpm db:seed`.

### Máy vừa clone về, hoặc hook báo lỗi

Một lệnh làm hết mọi thứ:

```powershell
pnpm sync
```

Tương đương `pnpm install` + `pnpm build:shared` + `pnpm db:deploy` + `prisma generate`.

---

## Gặp lỗi thì xem bảng này

| Màn hình hiện gì | Nguyên nhân | Làm gì |
|---|---|---|
| `pnpm : not recognized` | Chưa cài pnpm, hoặc cài xong chưa mở lại cửa sổ | Đóng PowerShell, mở lại theo Bước 2, gõ `npm install -g pnpm` |
| `Can't reach database server` | **Cách B:** chưa bật MySQL. **Cách A:** mất mạng, sai host/port, hoặc service Aiven đang ngủ | Cách B: mở XAMPP, bấm **Start** ở dòng **MySQL**. Cách A: kiểm tra mạng, mở Aiven Console xem service có **Running** không — nhớ port **không phải 3306** |
| `Too many connections` | Cách A: nhiều máy cộng Render cộng Prisma Studio vượt trần 76 kết nối | Đóng bớt Prisma Studio; kiểm `connection_limit=3` có trong `DATABASE_URL` không |
| `Error opening a TLS connection: unknown Cert Authority` | Cách A: có `sslaccept=strict` mà thiếu `sslcert` | Bỏ `sslaccept=strict` khỏi `DATABASE_URL` — Aiven đã bắt buộc TLS sẵn |
| `Unknown database 'enghabit_dev'` | Cách A: chưa tạo database ở mục 4A.1 | Vào Aiven Console → tab **Databases** → **Create database** |
| `Unknown database 'enghabit'` | Chưa tạo database | Làm lại mục 4.2 |
| `Access denied for user 'root'` | Dòng `DATABASE_URL` sai | Làm lại Bước 5, chép đúng nguyên dòng |
| `Port 4000 is already in use` | Đang có một cửa sổ chạy `pnpm dev:be` rồi | Tìm cửa sổ đó, bấm `Ctrl` + `C` |
| Trình duyệt báo *không thể truy cập trang* | Chưa chạy `pnpm dev:fe`, hoặc đã lỡ đóng cửa sổ | Làm lại mục 7.2 |
| Trang trắng, không hiện gì | Thiếu bước `pnpm build:shared` | Bấm `Ctrl` + `C` ở cả hai cửa sổ, chạy `pnpm build:shared`, rồi làm lại Bước 7 |
| Tiếng Việt hiện thành `?????` | **Cách B:** database tạo sai bảng mã | Vào phpMyAdmin, chọn database `enghabit`, bấm tab **Operations** → **Drop**; làm lại mục 4.2 rồi chạy lại lệnh 4 và 5 của Bước 6 |
| Tiếng Việt hiện thành `?????` | **Cách A:** database Aiven sai bảng mã | Vào Aiven Console → tab **Databases** → xoá `enghabit_dev`, tạo lại; rồi chạy lại lệnh 4 và 5 của Bước 6 trên máy chính |
| Đăng nhập được nhưng khoảng 15 phút là văng ra, không báo lỗi | Cách A: `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` ở máy này khác máy chính | Mở `be/.env`, chép lại hai dòng đó từ máy chính cho giống hệt, rồi khởi động lại `pnpm dev:be` |
| Dữ liệu khác máy chính, hoặc trống trơn | Cách A: `DATABASE_URL` trỏ sai database | Mở `be/.env`, kiểm đuôi có đúng `/enghabit_dev` không — trỏ vào `defaultdb` là đang đụng dữ liệu production |
| Nút **Start** của MySQL trong XAMPP bật rồi tắt ngay | Máy đã có MySQL khác chiếm cổng 3306 | Tắt phần mềm MySQL kia rồi bấm **Start** lại |

**Muốn xem thẳng dữ liệu bên trong:** mở cửa sổ PowerShell thứ ba, gõ `cd $HOME\Desktop\enghabit`
rồi `pnpm db:studio`, sau đó vào trình duyệt mở `localhost:5555`.

> **Cách A: xem xong thì tắt Prisma Studio** bằng `Ctrl` + `C`. Nó giữ kết nối tới database
> suốt thời gian mở; nhiều máy cùng để mở là chạm trần 76 kết nối của gói free, và lỗi báo
> ra khi đó là `Too many connections` ở một máy hoàn toàn khác.

---

## Dành cho người phát triển

Quy ước viết code, đặt tên commit, cấu trúc thư mục: [CLAUDE.md](CLAUDE.md).
Hướng dẫn đưa hệ thống lên Internet: [docs/deployment.md](docs/deployment.md) và
[docs/aiven-setup.md](docs/aiven-setup.md).
