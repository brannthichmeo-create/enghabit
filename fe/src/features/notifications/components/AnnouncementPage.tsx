import { useState, type FormEvent } from 'react';
import { Megaphone, Send } from 'lucide-react';
import { UserRole, createAnnouncementSchema } from '@enghabit/shared';
import { getErrorMessage } from '../../../shared/lib/api-client';
import {
  Button,
  Card,
  ErrorMessage,
  Field,
  Input,
  PageHeader,
  SectionTitle,
  Select,
} from '../../../shared/components/ui';
import { useToast } from '../../../shared/components/Toast';
import { useAudienceCount, useSendAnnouncement } from '../notification.hooks';
import { displayFor, timeAgo } from './notification-display';

type Audience = 'all' | 'USER' | 'ADMIN';

/**
 * Quản trị viên gửi thông báo tới người dùng.
 *
 * Có ô xem trước và số người nhận hiện ngay trên nút gửi: thông báo đã gửi thì không
 * thu hồi được, nên phải thấy rõ mình sắp gửi cái gì cho bao nhiêu người.
 */
export function AnnouncementPage(): JSX.Element {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [audience, setAudience] = useState<Audience>('all');
  const [link, setLink] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const role = audience === 'all' ? undefined : (audience as UserRole);
  const audienceCount = useAudienceCount(role);
  const send = useSendAnnouncement();
  const toast = useToast();

  const submit = (event: FormEvent): void => {
    event.preventDefault();

    const parsed = createAnnouncementSchema.safeParse({
      title,
      body,
      audience: audience === 'all' ? 'all' : 'role',
      role,
      link: link.trim() || undefined,
    });

    if (!parsed.success) {
      setValidationError(parsed.error.issues[0]?.message ?? 'Dữ liệu không hợp lệ');
      return;
    }
    setValidationError(null);

    const recipients = audienceCount.data ?? 0;
    if (!confirm(`Gửi thông báo này tới ${recipients} người dùng? Đã gửi thì không thu hồi được.`)) return;

    send.mutate(parsed.data, {
      onSuccess: (result) => {
        toast.success(`Đã gửi tới ${result.recipients} người dùng`);
        setTitle('');
        setBody('');
        setLink('');
      },
    });
  };

  const { icon: PreviewIcon, tone } = displayFor('ANNOUNCEMENT');

  return (
    <div>
      <PageHeader
        title="Gửi thông báo"
        description="Thông báo thủ công tới người dùng, hiện trong chuông thông báo của họ"
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <form onSubmit={submit}>
          <Card>
            {validationError && <ErrorMessage>{validationError}</ErrorMessage>}
            {send.isError && <ErrorMessage>{getErrorMessage(send.error)}</ErrorMessage>}

            <Field label="Tiêu đề">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ví dụ: Bổ sung 20 từ vựng chủ đề Du lịch"
                maxLength={150}
              />
            </Field>

            <div className="mt-4">
              <label className="block">
                <span className="text-sm font-medium text-content-soft">Nội dung</span>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={4}
                  maxLength={500}
                  placeholder="Nội dung ngắn gọn, người đọc chỉ liếc qua trong chuông thông báo."
                  className="mt-1.5 w-full rounded-lg border border-line-control bg-surface px-3 py-2 text-sm text-content outline-none transition-colors placeholder:text-content-muted focus:border-brand focus:ring-4 focus:ring-brand/10"
                />
                <span className="mt-1 block text-xs text-content-muted">{body.length}/500 ký tự</span>
              </label>
            </div>

            <div className="mt-4">
              <Field label="Gửi cho">
                <Select value={audience} onChange={(e) => setAudience(e.target.value as Audience)}>
                  <option value="all">Tất cả người dùng</option>
                  <option value={UserRole.USER}>Chỉ người học</option>
                  <option value={UserRole.ADMIN}>Chỉ quản trị viên</option>
                </Select>
              </Field>
            </div>

            <div className="mt-4">
              <Field
                label="Đường dẫn kèm theo (không bắt buộc)"
                hint='Đường dẫn trong app, vd "/learn". Bỏ trống thì thông báo không bấm được.'
              >
                <Input value={link} onChange={(e) => setLink(e.target.value)} placeholder="/learn" />
              </Field>
            </div>

            <div className="mt-5 flex items-center gap-3 border-t border-line pt-4">
              <Button type="submit" icon={Send} loading={send.isPending}>
                Gửi tới {audienceCount.data ?? '…'} người
              </Button>
            </div>
          </Card>
        </form>

        <section>
          <SectionTitle>Xem trước</SectionTitle>
          <Card>
            <p className="mb-3 text-xs text-content-muted">
              Đây là cách thông báo hiện ra trong chuông của người nhận.
            </p>
            <div className="flex gap-2.5 rounded-lg border border-line bg-brand-soft/50 p-3">
              <PreviewIcon className={`mt-0.5 h-4 w-4 shrink-0 ${tone}`} aria-hidden />
              <div className="min-w-0">
                <p className="text-sm font-medium text-content">
                  {title || 'Tiêu đề thông báo'}
                </p>
                <p className="mt-0.5 text-xs text-content-soft">
                  {body || 'Nội dung thông báo sẽ hiện ở đây.'}
                </p>
                <p className="mt-0.5 text-[11px] text-content-muted">{timeAgo(new Date().toISOString())}</p>
              </div>
            </div>

            <div className="mt-4 flex items-start gap-2 border-t border-line pt-4 text-xs text-content-muted">
              <Megaphone className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
              <p>
                Thông báo thủ công gửi ngay, không phụ thuộc giờ nhắc của người dùng và không bị tắt bởi
                cài đặt nhắc nhở tự động — vì vậy chỉ dùng cho việc thật sự cần báo.
              </p>
            </div>
          </Card>
        </section>
      </div>
    </div>
  );
}
