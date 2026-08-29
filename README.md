# Enghabit

Ứng dụng hỗ trợ xây dựng và duy trì thói quen học tiếng Anh — kết hợp học từ vựng/quiz, quản lý mục tiêu & thói quen, và theo dõi tiến độ bằng streak và thống kê.

## Yêu cầu môi trường

- Node.js >= 20
- pnpm >= 9
- MySQL 8 (chạy local qua Docker hoặc cài trực tiếp)

## Chạy dự án lần đầu

```bash
# 1. Cài dependencies
pnpm install

# 2. Build package dùng chung (bắt buộc trước khi chạy be/fe)
pnpm build:shared

# 3. Tạo database MySQL với charset utf8mb4
#    Docker: docker run --name enghabit-mysql -e MYSQL_ROOT_PASSWORD=password \
#            -e MYSQL_DATABASE=enghabit -p 3306:3306 -d mysql:8 \
#            --character-set-server=utf8mb4 --collation-server=utf8mb4_unicode_ci

# 4. Cấu hình biến môi trường
cp be/.env.example be/.env    # rồi sửa DATABASE_URL và các JWT secret

# 5. Tạo bảng và dữ liệu mẫu
pnpm db:migrate
pnpm db:seed

# 6. Chạy (mở 2 terminal)
pnpm dev:be    # http://localhost:4000
pnpm dev:fe    # http://localhost:5173
```

Tài khoản mẫu sau khi seed:

| Vai trò | Email | Mật khẩu |
|---|---|---|
| Quản trị viên | admin@enghabit.local | Admin12345 |
| Người học | user@enghabit.local | User12345 |

## Cấu trúc

```
enghabit/
├── fe/       Web app (React + Vite + TailwindCSS)
├── be/       API (Node + Express + Prisma + MySQL)
├── shared/   Code dùng chung: enum, Zod schema, thuật toán SRS & streak
└── docs/     Tài liệu kiến trúc, ERD, API
```

## Lệnh thường dùng

| Lệnh | Tác dụng |
|---|---|
| `pnpm build:shared` | Build package `shared` (chạy lại sau khi sửa `shared/`) |
| `pnpm dev:be` / `pnpm dev:fe` | Chạy backend / frontend ở chế độ dev |
| `pnpm test` | Chạy test toàn bộ workspace |
| `pnpm db:migrate` | Tạo & áp migration (dev) |
| `pnpm db:seed` | Nạp dữ liệu mẫu (idempotent) |
| `pnpm db:studio` | Mở Prisma Studio xem/sửa dữ liệu |
| `pnpm --filter @enghabit/be db:recompute-streak` | Tính lại streak từ ActivityLog khi số liệu sai |

Quy ước phát triển (viết code, đặt tên commit, kết nối database, debug) xem [CLAUDE.md](CLAUDE.md).
