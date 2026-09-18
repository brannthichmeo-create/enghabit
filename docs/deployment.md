# Hướng dẫn deploy

Kiến trúc khi deploy: **Vercel** chạy frontend, **Render** chạy backend, **Aiven** chạy MySQL.

Ba thành phần nằm ở ba tên miền khác nhau nên có vài điểm dễ sai — phần cuối tài liệu liệt kê rõ.

## 1. Database — Aiven for MySQL

**Hướng dẫn đầy đủ từng bước: [aiven-setup.md](aiven-setup.md)** — gồm cả cách xử lý SSL,
kiểm tra utf8mb4, chạy migration và bảng lỗi thường gặp. Tóm tắt:

1. Tạo tài khoản tại [aiven.io](https://aiven.io) (không cần thẻ tín dụng)
2. **Services → Create service → MySQL**, chọn gói **Free**, vùng Singapore, tên `enghabit-db`
3. Chờ trạng thái chuyển sang **Running**, lấy host/port/user/password ở trang **Overview**
4. Ghép thành `DATABASE_URL` cho Prisma:

```
mysql://avnadmin:MẬT_KHẨU@HOST:PORT/defaultdb?connection_limit=5&connect_timeout=15
```

Bỏ `ssl-mode=REQUIRED` trong chuỗi Aiven cho sẵn — đó là tham số của MySQL CLI, Prisma
không hiểu. Kết nối vẫn được mã hoá vì Aiven bắt buộc TLS.

`connection_limit=5` là **bắt buộc**: Prisma mặc định mở `số_CPU × 2 + 1` kết nối mỗi tiến
trình, cộng thêm lần `migrate deploy` lúc khởi động là đủ chạm trần 76 kết nối của gói free.

## 2. Backend — Render

1. Tạo tài khoản tại [render.com](https://render.com), kết nối repo GitHub
2. **New → Blueprint**, chọn repo `enghabit` — đúng mục này, Render chỉ đọc `render.yaml`
   qua luồng Blueprint. Chọn **Web Service** thì phải tự nhập `buildCommand` và
   `startCommand` bằng tay.
3. Vào tab **Environment**, thêm các biến sau:

| Biến | Giá trị |
|---|---|
| `DATABASE_URL` | Chuỗi Aiven trỏ vào **`defaultdb`** — không phải `enghabit_dev` của máy dev |
| `CORS_ORIGIN` | Tên miền Vercel, vd `https://enghabit.vercel.app` |
| `JWT_ACCESS_SECRET` | Chuỗi ngẫu nhiên ≥32 ký tự |
| `JWT_REFRESH_SECRET` | Chuỗi ngẫu nhiên khác, ≥32 ký tự |
| `ENABLE_REMINDER_JOB` | `false` |

Sinh chuỗi ngẫu nhiên: `openssl rand -hex 32`, hoặc trên Windows:

```powershell
node -e "const c=require('crypto');console.log(c.randomBytes(32).toString('hex'))"
```

Hai secret này phải **khác** secret của môi trường dev.

Sau khi deploy xong, chạy seed **một lần từ máy của bạn**, trỏ vào `defaultdb`.
Gói free của Render **không có tab Shell**, nên không chạy được từ trên đó:

```powershell
$env:DATABASE_URL = "mysql://avnadmin:MẬT_KHẨU@HOST:PORT/defaultdb?connection_limit=5&connect_timeout=15"
pnpm --filter @enghabit/be db:seed
```

## 3. Frontend — Vercel

**Root Directory để nguyên thư mục gốc của repo, KHÔNG đặt là `fe`.** Vercel không cho
truy cập file nằm ngoài Root Directory và **không cho dùng `..` để đi lên**. Đặt `fe` thì
build không thấy `shared/`, `pnpm-workspace.yaml` hay `pnpm-lock.yaml`.

Toàn bộ cấu hình build nằm trong [`vercel.json`](../vercel.json) ở thư mục gốc, nên trên
bảng điều khiển chỉ cần làm hai việc:

1. **Add New → Project** → import repo → **Root Directory** để trống (thư mục gốc)
2. **Environment Variables** → thêm `VITE_API_URL` = URL backend, vd
   `https://enghabit-api.onrender.com`
   - Chỉ tên miền gốc: **không** `/api/v1`, **không** dấu `/` cuối — `fe/src/shared/lib/config.ts` tự nối
   - Vite nướng biến này vào file JS lúc build, nên phải đặt **trước** khi bấm Deploy

**Không bật Override cho Install Command.** Vercel tự chọn pnpm theo `lockfileVersion` của
`pnpm-lock.yaml` — bản 9.0 ra pnpm 9 hoặc 10. Nhưng khi bạn tự khai một lệnh install kiểu
`pnpm install`, Vercel dùng **bản pnpm cũ nhất có trong máy build, tức pnpm 6**, và pnpm 6
không đọc được lockfile 9.0. Muốn ghim đúng `pnpm@9.15.4` của `packageManager` thì thêm
biến môi trường `ENABLE_EXPERIMENTAL_COREPACK=1` thay vì override install command.

Install mặc định của Vercel **có** cài devDependencies, nên không cần `--prod=false` như
bên Render.

`vercel.json` cũng khai `rewrites` cho SPA — thiếu nó thì bấm `F5` ở `/statistics` sẽ ra
404. Chuỗi regex trong đó phải viết `\\.` (escape hai lần), vì `\.` không phải escape hợp
lệ trong JSON và cả file sẽ hỏng.

## 4. Nối hai đầu lại

Sau khi có tên miền Vercel thật, quay lại Render cập nhật `CORS_ORIGIN` cho đúng rồi deploy lại backend. Thiếu bước này thì trình duyệt sẽ chặn mọi request vì CORS.

## Những chỗ dễ sai

**Cookie cross-site.** Frontend và backend khác tên miền nên cookie refresh token là cross-site. Trình duyệt chỉ gửi khi có `SameSite=None` kèm `Secure` — code đã tự chuyển sang chế độ này khi `NODE_ENV=production`. Nếu quên đặt `NODE_ENV`, cookie bị chặn **âm thầm**: đăng nhập được nhưng hết 15 phút là văng ra, không có thông báo lỗi nào.

**Trust proxy.** Render đứng sau proxy; không bật `trust proxy` thì Express coi kết nối là http và từ chối đặt cookie `Secure`. Đã bật sẵn trong `be/src/app.ts`.

**Gói free của Render ngủ đông.** Không có request trong 15 phút thì service ngủ, lần gọi tiếp theo mất khoảng 50 giây để khởi động lại. Lần đầu mở trang demo sẽ chậm — đây là hành vi bình thường, không phải lỗi. Vì lý do này `ENABLE_REMINDER_JOB` để `false`: cron không chạy đáng tin khi service ngủ.

**Build trên monorepo.** Cả Render lẫn Vercel đều phải build `shared` trước `be`/`fe`, vì hai app import từ bản `dist` của nó.

**Migration.** `start` script đã có `prisma migrate deploy` chạy trước khi mở cổng, nên schema luôn khớp với code sau mỗi lần deploy. Không chạy `migrate dev` trên production.

**Migration tạo BẢNG, không mang DỮ LIỆU.** Đây là chỗ dễ tưởng là "deploy chưa lên": API
và giao diện có đủ tính năng mới, nhưng màn hình vẫn rỗng vì bảng chưa có dòng nào.

Với danh mục cửa hàng, việc này đã **tự động**: `startCommand` chạy
`node dist/scripts/seed-shop.js --soft` giữa `migrate deploy` và `node dist/server.js`,
nên push git xong là production có đủ 20 linh vật, không phải nạp tay lần nào. Chi tiết và
lý do từng quyết định: CLAUDE.md > Cửa hàng, Ví và Kho vật phẩm.

Chạy tay chỉ cần khi muốn nạp vào một DB khác:

```powershell
$env:DATABASE_URL = Read-Host "Dan DATABASE_URL"
pnpm --filter @enghabit/be db:seed-shop
Remove-Item Env:\DATABASE_URL
```

Dùng `Read-Host` thay vì gõ thẳng chuỗi vào lệnh: PSReadLine lưu nguyên mật khẩu vào
`ConsoleHost_history.txt` trên ổ đĩa. Script in ra host đích trước khi ghi — đọc dòng đó để
chắc chắn không nạp nhầm chỗ. Nhớ xoá biến sau khi xong, nếu không mọi lệnh `dev:be`,
`db:seed`, `prisma studio` tiếp theo **trong cùng cửa sổ** đều trỏ vào DB đó.

Đừng chạy `pnpm db:seed` đầy đủ lên production: phần cửa hàng trong đó còn mua hộ tài khoản
demo, tức trừ xu thật trong ví một người dùng thật.
