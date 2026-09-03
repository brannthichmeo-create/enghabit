import { useRef, useState } from 'react';
import { Camera, Trash2 } from 'lucide-react';
import {
  ALLOWED_AVATAR_MIME,
  AVATAR_DIMENSION,
  parseImageDataUrl,
  type PublicUser,
} from '@enghabit/shared';
import { getErrorMessage } from '../../../shared/lib/api-client';
import { Button, ErrorMessage } from '../../../shared/components/ui';
import { Avatar } from '../../../shared/components/Sidebar';
import { useToast } from '../../../shared/components/Toast';
import { useT } from '../../../shared/i18n/language';
import { useRemoveAvatar, useUpdateAvatar } from '../profile.hooks';

/**
 * Chọn ảnh từ thiết bị và đổi ảnh đại diện.
 *
 * Ảnh được THU NHỎ NGAY Ở TRÌNH DUYỆT trước khi gửi (canvas, 256×256, JPEG chất lượng
 * 0.85): ảnh chụp từ điện thoại thường 3-5MB, gửi nguyên thì vừa chậm vừa phải cài thêm
 * thư viện xử lý ảnh ở server. Thu nhỏ trước còn giúp mỗi ảnh chỉ vài chục KB, đủ nhẹ
 * để trả thẳng trong `/auth/me`.
 *
 * Ảnh không vuông bị cắt theo cạnh ngắn (crop giữa) chứ không bóp méo — avatar tròn mà
 * bóp méo thì mặt người trông sai lệch rất rõ.
 */
export function AvatarPicker({ user }: { user: PublicUser }): JSX.Element {
  const t = useT();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const update = useUpdateAvatar();
  const remove = useRemoveAvatar();
  const toast = useToast();

  const pick = async (file: File): Promise<void> => {
    setError(null);

    try {
      const dataUrl = await resizeToSquare(file, AVATAR_DIMENSION);

      // Kiểm bằng đúng luật của server để báo lỗi ngay, không phải chờ một vòng mạng.
      const parsed = parseImageDataUrl(dataUrl);
      if (!parsed.ok) {
        // Lý do do shared trả về là câu tiếng Việt — cũng là khoá dịch (xem shared/i18n).
        setError(t(parsed.reason));
        return;
      }

      update.mutate(dataUrl, {
        onSuccess: () => toast.success(t('Đã đổi ảnh đại diện')),
        onError: (mutationError) => setError(getErrorMessage(mutationError)),
      });
    } catch {
      setError(t('Không đọc được ảnh này. Hãy thử một ảnh khác.'));
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-4">
      <Avatar name={user.name} src={user.avatarDataUrl} size="lg" />

      <div className="min-w-0">
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            icon={Camera}
            loading={update.isPending}
            onClick={() => inputRef.current?.click()}
          >
            {user.avatarDataUrl ? t('Đổi ảnh') : t('Tải ảnh lên')}
          </Button>

          {user.avatarDataUrl && (
            <Button
              size="sm"
              variant="secondary"
              icon={Trash2}
              loading={remove.isPending}
              onClick={() =>
                remove.mutate(undefined, {
                  onSuccess: () => toast.success(t('Đã gỡ ảnh đại diện')),
                  onError: (mutationError) => setError(getErrorMessage(mutationError)),
                })
              }
            >
              {t('Gỡ ảnh')}
            </Button>
          )}
        </div>

        <p className="mt-1.5 text-xs text-content-muted">
          {t('Ảnh JPG, PNG hoặc WebP. Ảnh sẽ được thu nhỏ và cắt vuông tự động.')}
        </p>

        {error && (
          <div className="mt-2">
            <ErrorMessage>{error}</ErrorMessage>
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED_AVATAR_MIME.join(',')}
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          // Xoá giá trị để chọn lại đúng file vừa chọn vẫn kích hoạt onChange.
          event.target.value = '';
          if (file) void pick(file);
        }}
      />
    </div>
  );
}

/**
 * Đọc file ảnh, cắt vuông ở giữa và thu về `size`×`size`, trả về data URL JPEG.
 *
 * Dùng canvas của trình duyệt nên không cần thư viện xử lý ảnh nào. Nền trắng được vẽ
 * trước: PNG có nền trong suốt mà xuất sang JPEG thì phần trong suốt sẽ thành đen.
 */
async function resizeToSquare(file: File, size: number): Promise<string> {
  const objectUrl = URL.createObjectURL(file);

  try {
    const image = await loadImage(objectUrl);
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;

    const context = canvas.getContext('2d');
    if (!context) throw new Error('Trình duyệt không hỗ trợ canvas');

    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, size, size);

    // Cắt theo cạnh ngắn, lấy phần giữa ảnh.
    const edge = Math.min(image.width, image.height);
    const sx = (image.width - edge) / 2;
    const sy = (image.height - edge) / 2;
    context.drawImage(image, sx, sy, edge, edge, 0, 0, size, size);

    return canvas.toDataURL('image/jpeg', 0.85);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Không đọc được ảnh'));
    image.src = src;
  });
}
