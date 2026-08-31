import { Component, type ErrorInfo, type ReactNode } from 'react';

/**
 * Error Boundary theo từng feature.
 *
 * Bọc mỗi feature lớn để lỗi ở một chỗ (vd flashcards) không làm sập toàn bộ app —
 * người dùng vẫn dùng được các phần còn lại (xem CLAUDE.md > Quy tắc debug).
 */

interface Props {
  /** Tên feature, hiện trong thông báo lỗi và log để biết ngay hỏng ở đâu. */
  feature: string;
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class FeatureErrorBoundary extends Component<Props, State> {
  override state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error(`[${this.props.feature}] Lỗi hiển thị:`, error, info.componentStack);
  }

  override render(): ReactNode {
    if (!this.state.error) return this.props.children;

    return (
      <div className="rounded-xl border border-danger/40 bg-danger-soft p-6" role="alert">
        <h2 className="font-semibold text-danger">Phần "{this.props.feature}" gặp lỗi</h2>
        <p className="mt-1 text-sm text-danger">
          Các phần khác vẫn hoạt động bình thường. Vui lòng thử tải lại.
        </p>
        <button
          onClick={() => this.setState({ error: null })}
          className="mt-3 rounded-lg bg-danger px-4 py-1.5 text-sm font-medium text-on-fill hover:bg-danger/85"
        >
          Thử lại
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
