import { Component, type ErrorInfo, type ReactNode } from 'react';
import { useT, type TranslateFn } from '../i18n/language';

/**
 * Error Boundary theo từng feature.
 *
 * Bọc mỗi feature lớn để lỗi ở một chỗ (vd flashcards) không làm sập toàn bộ app —
 * người dùng vẫn dùng được các phần còn lại (xem CLAUDE.md > Quy tắc debug).
 */

interface Props {
  /** Tên feature, hiện trong thông báo lỗi và log để biết ngay hỏng ở đâu. */
  feature: string;
  /**
   * Hàm dịch truyền từ ngoài vào: đây là class component nên không gọi hook được.
   * Bọc sẵn bằng `FeatureErrorBoundary` (bản hàm) ở dưới thay vì tự truyền tay.
   */
  t: TranslateFn;
  children: ReactNode;
}

interface State {
  error: Error | null;
}

class ErrorBoundaryView extends Component<Props, State> {
  override state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error(`[${this.props.feature}] Lỗi hiển thị:`, error, info.componentStack);
  }

  override render(): ReactNode {
    if (!this.state.error) return this.props.children;

    const { t } = this.props;

    return (
      <div className="rounded-xl border border-danger/40 bg-danger-soft p-6" role="alert">
        <h2 className="font-semibold text-danger">
          {t('Phần "{feature}" gặp lỗi', { feature: t(this.props.feature) })}
        </h2>
        <p className="mt-1 text-sm text-danger">
          {t('Các phần khác vẫn hoạt động bình thường. Vui lòng thử tải lại.')}
        </p>
        <button
          onClick={() => this.setState({ error: null })}
          className="mt-3 rounded-lg bg-danger px-4 py-1.5 text-sm font-medium text-on-fill hover:bg-danger/85"
        >
          {t('Thử lại')}
        </button>
        {import.meta.env.DEV && (
          <pre className="mt-3 overflow-x-auto rounded bg-danger-soft p-3 text-xs text-danger">
            {this.state.error.message}
          </pre>
        )}
      </div>
    );
  }
}

/** Bản dùng ngoài: lấy hàm dịch bằng hook rồi đưa vào boundary. */
export function FeatureErrorBoundary({
  feature,
  children,
}: {
  feature: string;
  children: ReactNode;
}): JSX.Element {
  const t = useT();

  return (
    <ErrorBoundaryView feature={feature} t={t}>
      {children}
    </ErrorBoundaryView>
  );
}
