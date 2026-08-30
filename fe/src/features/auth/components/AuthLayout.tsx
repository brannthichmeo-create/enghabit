import { CalendarCheck, Flame, Layers, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { Logo } from '../../../shared/components/Logo';

/**
 * Khung hai cột cho màn hình đăng nhập / đăng ký.
 *
 * Cột trái giới thiệu giá trị của app (chỉ hiện từ màn hình lớn), cột phải là form.
 * Trên mobile chỉ còn form kèm logo nhỏ — không nhồi nhét panel giới thiệu vào
 * màn hình hẹp làm user phải cuộn mới thấy ô nhập.
 */

const HIGHLIGHTS: { icon: LucideIcon; title: string; description: string }[] = [
  {
    icon: Flame,
    title: 'Chuỗi ngày học',
    description: 'Theo dõi số ngày học liên tiếp để duy trì động lực mỗi ngày',
  },
  {
    icon: Layers,
    title: 'Ôn tập thông minh',
    description: 'Flashcard tự tính lịch ôn theo mức độ bạn nhớ từng từ',
  },
  {
    icon: CalendarCheck,
    title: 'Thống kê rõ ràng',
    description: 'Nhìn lại cả năm học của bạn chỉ trong một biểu đồ',
  },
];

export function AuthLayout({ children }: { children: ReactNode }): JSX.Element {
  return (
    <div className="flex min-h-screen bg-white">
      <BrandPanel />

      <div className="flex flex-1 items-center justify-center px-5 py-10">
        <div className="w-full max-w-sm">
          {/* Logo chỉ hiện trên mobile, vì màn hình lớn đã có logo ở panel trái */}
          <div className="mb-8 lg:hidden">
            <Logo size="md" />
          </div>

          {children}
        </div>
      </div>
    </div>
  );
}

/**
 * Panel lấy đúng công thức phối màu của logo: nền xanh ngọc sáng, chữ navy,
 * điểm nhấn vàng.
 *
 * Chữ navy trên nền xanh ngọc đạt 9.81:1 nên rất dễ đọc — trong khi chữ trắng
 * trên cùng nền đó chỉ đạt 1.59:1, tức là không dùng được.
 */
function BrandPanel(): JSX.Element {
  return (
    <div className="relative hidden w-[45%] max-w-lg overflow-hidden bg-brand-vivid lg:flex lg:flex-col lg:justify-between">
      {/* Nền động: các khối màu mờ trôi chậm, chỉ dùng transform nên nhẹ với trình duyệt */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -left-16 top-10 h-72 w-72 animate-drift-a rounded-full bg-white/40 blur-3xl" />
        <div className="absolute -right-10 bottom-0 h-80 w-80 animate-drift-b rounded-full bg-accent/25 blur-3xl" />
        <div className="absolute left-1/3 top-1/2 h-52 w-52 animate-drift-a rounded-full bg-brand/20 blur-3xl [animation-delay:-6s]" />
      </div>

      <div className="relative p-10">
        <div className="animate-enter-up">
          <span className="inline-flex items-center gap-2.5">
            {/*
              Thân linh vật cùng màu xanh ngọc với nền panel nên sẽ chìm mất.
              Đặt trên nền trắng bo góc để tách khỏi nền.
            */}
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white p-1.5 shadow-sm">
              <img src="/logo.png" alt="" aria-hidden className="h-full w-full object-contain" />
            </span>
            <span className="text-xl font-bold tracking-tight text-ink">Enghabit</span>
          </span>
        </div>
      </div>

      <div className="relative px-10">
        <h2 className="max-w-sm animate-enter-up text-3xl font-bold leading-tight text-ink [animation-delay:80ms]">
          Học tiếng Anh đều đặn, mỗi ngày một chút
        </h2>
        <p className="mt-3 max-w-sm animate-enter-up text-sm leading-relaxed text-ink/75 [animation-delay:140ms]">
          Vấn đề không nằm ở thiếu tài liệu, mà ở việc duy trì. Enghabit giúp bạn biến việc học
          thành thói quen và thấy rõ mình đang tiến bộ.
        </p>

        <ul className="mt-9 space-y-5">
          {HIGHLIGHTS.map((item, index) => (
            <li
              key={item.title}
              className="flex animate-enter-up gap-3"
              style={{ animationDelay: `${220 + index * 90}ms` }}
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/60">
                <item.icon className="h-4 w-4 text-brand-strong" aria-hidden />
              </div>
              <div>
                <p className="text-sm font-semibold text-ink">{item.title}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-ink/70">{item.description}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="relative p-10">
        <p className="animate-enter-up text-xs text-ink/60 [animation-delay:520ms]">
          Ứng dụng hỗ trợ xây dựng và duy trì thói quen học tiếng Anh
        </p>
      </div>
    </div>
  );
}
