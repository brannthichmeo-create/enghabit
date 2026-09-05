import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowLeft, ArrowRight, CheckCircle2, Clock, Lock, UserRound, XCircle } from 'lucide-react';
import {
  PasswordResetOutcome,
  passwordResetConfirmSchema,
  passwordResetRequestSchema,
  type PasswordResetState,
} from '@enghabit/shared';
import { getErrorMessage } from '../../../shared/lib/api-client';
import { Button } from '../../../shared/components/ui';
import { Modal } from '../../../shared/components/Modal';
import { useToast } from '../../../shared/components/Toast';
import { useT } from '../../../shared/i18n/language';
import { usePasswordResetConfirm, usePasswordResetRequest } from '../auth.hooks';
import { AuthField, PasswordField, PasswordStrength } from './AuthField';
import { AuthLayout } from './AuthLayout';

/**
 * Quên mật khẩu — quản trị viên duyệt tay.
 *
 * TÀI LIỆU LUỒNG: `docs/luong-quen-mat-khau.md`. Đọc file đó trước khi sửa.
 *
 * Người dùng chỉ làm ĐÚNG MỘT hành động: nhập email hoặc tên tài khoản của mình.
 * Việc họ đang ở bước nào là do backend trả về (`outcome`), không phải do họ tự chọn —
 * nhờ vậy không có đường nào để bấm nhầm sang bước chưa tới lượt.
 *
 *   CREATED   vừa tạo yêu cầu       -> thẻ báo đã gửi
 *   PENDING   đã gửi từ trước       -> popup "đợi quản trị viên xác nhận"
 *   APPROVED  đã được duyệt         -> form đặt mật khẩu mới
 *   REJECTED  bị từ chối            -> thẻ báo lý do + nút gửi lại
 */
export function ForgotPasswordPage(): JSX.Element {
  const t = useT();
  const navigate = useNavigate();
  const toast = useToast();

  const [identifier, setIdentifier] = useState('');
  const [result, setResult] = useState<PasswordResetState | null>(null);
  const [pendingOpen, setPendingOpen] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [passwords, setPasswords] = useState({ newPassword: '', confirmPassword: '' });

  const lookup = usePasswordResetRequest();
  const confirm = usePasswordResetConfirm();

  const submitLookup = (retry: boolean): void => {
    setFieldErrors({});

    const parsed = passwordResetRequestSchema.safeParse({ identifier, retry });
    if (!parsed.success) {
      setFieldErrors(Object.fromEntries(parsed.error.issues.map((i) => [i.path.join('.'), i.message])));
      return;
    }

    lookup.mutate(parsed.data, {
      onSuccess: (state) => {
        setResult(state);
        // Chỉ trạng thái PENDING mới bật popup — CREATED cũng là "đang chờ" nhưng là
        // lần gửi đầu, phải nói "đã gửi" chứ không phải "đã gửi rồi, đợi đi".
        setPendingOpen(state.outcome === PasswordResetOutcome.PENDING);
      },
    });
  };

  const submitNewPassword = (event: FormEvent): void => {
    event.preventDefault();
    setFieldErrors({});

    const parsed = passwordResetConfirmSchema.safeParse({ identifier, ...passwords });
    if (!parsed.success) {
      setFieldErrors(Object.fromEntries(parsed.error.issues.map((i) => [i.path.join('.'), i.message])));
      return;
    }

    confirm.mutate(parsed.data, {
      onSuccess: () => {
        toast.success(t('Đổi mật khẩu thành công'));
        navigate('/login');
      },
    });
  };

  const approved = result?.outcome === PasswordResetOutcome.APPROVED;

  return (
    <AuthLayout>
      {approved ? (
        <form onSubmit={submitNewPassword} className="space-y-5">
          <Heading
            title={t('Đặt mật khẩu mới')}
            description={t('Yêu cầu của bạn đã được duyệt. Nhập mật khẩu mới để tiếp tục.')}
          />

          {confirm.isError && <ServerError message={getErrorMessage(confirm.error)} />}

          <div className="animate-enter-up [animation-delay:60ms]">
            <PasswordField
              label={t('Mật khẩu mới')}
              icon={Lock}
              value={passwords.newPassword}
              onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
              error={fieldErrors.newPassword}
              hint={t('Ít nhất 8 ký tự, gồm cả chữ và số')}
              placeholder={t('Nhập mật khẩu mới')}
              autoComplete="new-password"
              autoFocus
            />
            <PasswordStrength password={passwords.newPassword} />
          </div>

          <div className="animate-enter-up [animation-delay:120ms]">
            <PasswordField
              label={t('Xác nhận mật khẩu mới')}
              icon={Lock}
              value={passwords.confirmPassword}
              onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
              error={fieldErrors.confirmPassword}
              placeholder={t('Nhập lại mật khẩu mới')}
              autoComplete="new-password"
            />
          </div>

          <div className="animate-enter-up [animation-delay:180ms]">
            <Button type="submit" loading={confirm.isPending} className="w-full" icon={ArrowRight}>
              {confirm.isPending ? t('Đang đổi mật khẩu...') : t('Đổi mật khẩu')}
            </Button>
          </div>

          <BackToLogin />
        </form>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submitLookup(false);
          }}
          className="space-y-5"
        >
          <Heading
            title={t('Quên mật khẩu')}
            description={t('Nhập email hoặc tên tài khoản của bạn. Quản trị viên sẽ xem xét yêu cầu.')}
          />

          {lookup.isError && <ServerError message={getErrorMessage(lookup.error)} />}

          <div className="animate-enter-up [animation-delay:60ms]">
            <AuthField
              label={t('Email hoặc tên tài khoản')}
              icon={UserRound}
              type="text"
              value={identifier}
              onChange={(e) => {
                setIdentifier(e.target.value);
                // Đổi ô nhập thì kết quả cũ không còn đúng với thứ đang gõ nữa.
                setResult(null);
              }}
              error={fieldErrors.identifier}
              placeholder={t('ban@example.com hoặc tentaikhoan')}
              autoComplete="username"
              autoFocus
            />
          </div>

          {result?.outcome === PasswordResetOutcome.CREATED && (
            <Notice
              tone="success"
              icon={CheckCircle2}
              title={t('Đã gửi yêu cầu')}
              body={t('Quản trị viên đã nhận được yêu cầu của bạn. Vui lòng quay lại sau khi được duyệt.')}
            />
          )}

          {result?.outcome === PasswordResetOutcome.REJECTED && (
            <div className="space-y-3">
              <Notice
                tone="danger"
                icon={XCircle}
                title={t('Yêu cầu của bạn đã bị từ chối')}
                body={result.rejectReason ?? ''}
                bodyLabel={t('Lý do:')}
              />
              <Button
                type="button"
                variant="secondary"
                className="w-full"
                loading={lookup.isPending}
                onClick={() => submitLookup(true)}
              >
                {t('Gửi lại yêu cầu')}
              </Button>
            </div>
          )}

          <div className="animate-enter-up [animation-delay:120ms]">
            <Button type="submit" loading={lookup.isPending} className="w-full" icon={ArrowRight}>
              {lookup.isPending ? t('Đang kiểm tra...') : t('Xác nhận')}
            </Button>
          </div>

          <BackToLogin />
        </form>
      )}

      <Modal
        open={pendingOpen}
        onClose={() => setPendingOpen(false)}
        title={t('Yêu cầu đang chờ duyệt')}
        footer={
          <Button type="button" onClick={() => setPendingOpen(false)}>
            {t('Đã hiểu')}
          </Button>
        }
      >
        <div className="flex items-start gap-2.5">
          <Clock className="mt-0.5 h-4 w-4 shrink-0 text-brand-strong" aria-hidden />
          <p>{t('Đã gửi yêu cầu, đợi quản trị viên xác nhận')}</p>
        </div>
      </Modal>
    </AuthLayout>
  );
}

function Heading({ title, description }: { title: string; description: string }): JSX.Element {
  return (
    <div className="animate-enter-up">
      <h1 className="text-2xl font-bold tracking-tight text-content">{title}</h1>
      <p className="mt-1.5 text-sm text-content-muted">{description}</p>
    </div>
  );
}

function ServerError({ message }: { message: string }): JSX.Element {
  return (
    <div
      role="alert"
      className="flex animate-slide-up items-start gap-2 rounded-lg border border-danger/40 bg-danger-soft px-3 py-2.5"
    >
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-danger" aria-hidden />
      <span className="text-sm text-danger">{message}</span>
    </div>
  );
}

/** Thẻ kết quả sau khi tra cứu. `tone` chọn bộ màu trạng thái, không phải màu tuỳ ý. */
function Notice({
  tone,
  icon: Icon,
  title,
  body,
  bodyLabel,
}: {
  tone: 'success' | 'danger';
  icon: typeof CheckCircle2;
  title: string;
  body: string;
  bodyLabel?: string;
}): JSX.Element {
  const styles =
    tone === 'success'
      ? { box: 'border-success/40 bg-success-soft', icon: 'text-success' }
      : { box: 'border-danger/40 bg-danger-soft', icon: 'text-danger' };

  return (
    <div className={`flex animate-slide-up items-start gap-2 rounded-lg border px-3 py-2.5 ${styles.box}`}>
      <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${styles.icon}`} aria-hidden />
      <div className="min-w-0 text-sm">
        <p className="font-medium text-content">{title}</p>
        {body && (
          <p className="mt-0.5 text-content-soft">
            {bodyLabel && <span className="font-medium">{bodyLabel} </span>}
            {body}
          </p>
        )}
      </div>
    </div>
  );
}

function BackToLogin(): JSX.Element {
  const t = useT();
  return (
    <p className="animate-enter-up text-center text-sm text-content-muted [animation-delay:240ms]">
      <Link
        to="/login"
        className="inline-flex items-center gap-1 font-medium text-brand-strong underline-offset-2 transition-colors hover:underline"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
        {t('Quay lại đăng nhập')}
      </Link>
    </p>
  );
}
