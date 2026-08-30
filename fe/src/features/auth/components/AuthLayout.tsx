import { CalendarCheck, Flame, Layers, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

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
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand">
              <span className="text-sm font-bold text-white">E</span>
            </div>
            <span className="text-lg font-bold tracking-tight text-slate-900">Enghabit</span>
          </div>

          {children}
        </div>
      </div>
    </div>
  );
}

function BrandPanel(): JSX.Element {
  return (
    <div className="relative hidden w-[45%] max-w-lg overflow-hidden bg-brand-strong lg:flex lg:flex-col lg:justify-between">
      {/* Nền động: hai khối màu mờ trôi chậm, chỉ dùng transform nên nhẹ với trình duyệt */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -left-16 top-10 h-72 w-72 animate-drift-a rounded-full bg-indigo-400/30 blur-3xl" />
        <div className="absolute -right-10 bottom-0 h-80 w-80 animate-drift-b rounded-full bg-violet-400/30 blur-3xl" />
        <div className="absolute left-1/3 top-1/2 h-52 w-52 animate-drift-a rounded-full bg-sky-400/20 blur-3xl [animation-delay:-6s]" />
      </div>

      <div className="relative p-10">
        <div className="flex animate-enter-up items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
            <span className="font-bold text-white">E</span>
          </div>
          <span className="text-xl font-bold tracking-tight text-white">Enghabit</span>
        </div>
      </div>

      <div className="relative px-10">
        <h2 className="max-w-sm animate-enter-up text-3xl font-bold leading-tight text-white [animation-delay:80ms]">
          Học tiếng Anh đều đặn, mỗi ngày một chút
        </h2>
        <p className="mt-3 max-w-sm animate-enter-up text-sm leading-relaxed text-indigo-100 [animation-delay:140ms]">
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
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 backdrop-blur">
                <item.icon className="h-4 w-4 text-white" aria-hidden />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{item.title}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-indigo-200">{item.description}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="relative p-10">
        <p className="animate-enter-up text-xs text-indigo-200 [animation-delay:520ms]">
          Ứng dụng hỗ trợ xây dựng và duy trì thói quen học tiếng Anh
        </p>
      </div>
    </div>
  );
}
