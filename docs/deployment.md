# Hướng dẫn deploy

Kiến trúc khi deploy: **Vercel** chạy frontend, **Render** chạy backend, **Aiven** chạy MySQL.

Ba thành phần nằm ở ba tên miền khác nhau nên có vài điểm dễ sai — phần cuối tài liệu liệt kê rõ.

## 1. Database — Aiven for MySQL

Aiven có gói miễn phí vĩnh viễn (1 GB RAM, 1 GB dung lượng), không cần thẻ tín dụng, và là MySQL thật chứ không phải bản "tương thích MySQL".

1. Tạo tài khoản tại [aiven.io](https://aiven.io), chọn **Free plan**
2. Tạo service **MySQL**, đặt tên `enghabit-db`
3. Chọn vùng gần Việt Nam nhất (Singapore) để giảm độ trễ
4. Copy **Service URI**, dạng `mysql://avnadmin:...@...aivencloud.com:PORT/defaultdb?ssl-mode=REQUIRED`

Đổi phần đuôi cho phù hợp Prisma:

```
mysql://avnadmin:MẬT_KHẨU@HOST:PORT/defaultdb?connection_limit=5&sslaccept=strict
```

`connection_limit=5` là **bắt buộc** — gói free chỉ cho vài kết nối đồng thời, để Prisma dùng pool mặc định sẽ làm hết connection và app chết với lỗi khó hiểu.

## 2. Backend — Render

1. Tạo tài khoản tại [render.com](https://render.com), kết nối repo GitHub
2. **New → Web Service**, chọn repo `enghabit`
3. Render sẽ đọc `render.yaml` ở thư mục gốc
4. Vào tab **Environment**, thêm các biến sau:

| Biến | Giá trị |
|---|---|
| `DATABASE_URL` | Chuỗi kết nối Aiven ở bước 1 |
| `CORS_ORIGIN` | Tên miền Vercel, vd `https://enghabit.vercel.app` |
| `JWT_ACCESS_SECRET` | Chuỗi ngẫu nhiên ≥32 ký tự |
| `JWT_REFRESH_SECRET` | Chuỗi ngẫu nhiên khác, ≥32 ký tự |
| `ENABLE_REMINDER_JOB` | `false` |

Sinh chuỗi ngẫu nhiên: `openssl rand -hex 32`

Sau khi deploy xong, chạy seed **một lần** qua tab Shell của Render:

```bash
pnpm --filter @enghabit/be db:seed
```

## 3. Frontend — Vercel

```bash
cd fe
npx vercel login      # cần thao tác trên trình duyệt
npx vercel link
npx vercel env add VITE_API_URL production   # nhập URL backend, vd https://enghabit-api.onrender.com
npx vercel --prod
```

Hoặc qua giao diện web: **Import Project** → chọn repo → đặt **Root Directory** là `fe` → thêm biến `VITE_API_URL`.

Vì đây là monorepo pnpm, phần **Build Command** phải build `shared` trước:

```
cd .. && pnpm install && pnpm --filter @enghabit/shared build && pnpm --filter @enghabit/fe build
```

Output Directory: `dist`

## 4. Nối hai đầu lại

Sau khi có tên miền Vercel thật, quay lại Render cập nhật `CORS_ORIGIN` cho đúng rồi deploy lại backend. Thiếu bước này thì trình duyệt sẽ chặn mọi request vì CORS.

## Những chỗ dễ sai

**Cookie cross-site.** Frontend và backend khác tên miền nên cookie refresh token là cross-site. Trình duyệt chỉ gửi khi có `SameSite=None` kèm `Secure` — code đã tự chuyển sang chế độ này khi `NODE_ENV=production`. Nếu quên đặt `NODE_ENV`, cookie bị chặn **âm thầm**: đăng nhập được nhưng hết 15 phút là văng ra, không có thông báo lỗi nào.

**Trust proxy.** Render đứng sau proxy; không bật `trust proxy` thì Express coi kết nối là http và từ chối đặt cookie `Secure`. Đã bật sẵn trong `be/src/app.ts`.

**Gói free của Render ngủ đông.** Không có request trong 15 phút thì service ngủ, lần gọi tiếp theo mất khoảng 50 giây để khởi động lại. Lần đầu mở trang demo sẽ chậm — đây là hành vi bình thường, không phải lỗi. Vì lý do này `ENABLE_REMINDER_JOB` để `false`: cron không chạy đáng tin khi service ngủ.

**Build trên monorepo.** Cả Render lẫn Vercel đều phải build `shared` trước `be`/`fe`, vì hai app import từ bản `dist` của nó.

**Migration.** `start` script đã có `prisma migrate deploy` chạy trước khi mở cổng, nên schema luôn khớp với code sau mỗi lần deploy. Không chạy `migrate dev` trên production.
