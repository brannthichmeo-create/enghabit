import { useRef, useState } from 'react';
import Cropper, { type Area, type Point } from 'react-easy-crop';
import { Camera, Trash2 } from 'lucide-react';
import {
  ALLOWED_AVATAR_MIME,
  AVATAR_DIMENSION,
  UserRole,
  parseImageDataUrl,
  type PublicUser,
} from '@enghabit/shared';
import { getErrorMessage } from '../../../shared/lib/api-client';
import { Button, ErrorMessage } from '../../../shared/components/ui';
import { Modal } from '../../../shared/components/Modal';
import { Avatar } from '../../../shared/components/Sidebar';
import { useToast } from '../../../shared/components/Toast';
import { useT } from '../../../shared/i18n/language';
import { useRemoveAvatar, useUpdateAvatar } from '../profile.hooks';
import { useMyFrameUrl } from '../../shop/shop.hooks';

export function AvatarPicker({ user }: { user: PublicUser }): JSX.Element {
  const t = useT();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [cropOpen, setCropOpen] = useState(false);
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const update = useUpdateAvatar();
  const remove = useRemoveAvatar();
  const toast = useToast();
  const myFrame = useMyFrameUrl(user.role !== UserRole.ADMIN);

  const closeCrop = (): void => {
    if (sourceUrl) URL.revokeObjectURL(sourceUrl);
    setSourceUrl(null);
    setCropOpen(false);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
  };

  const openFile = (file: File): void => {
    setError(null);
    if (sourceUrl) URL.revokeObjectURL(sourceUrl);
    const nextUrl = URL.createObjectURL(file);
    setSourceUrl(nextUrl);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    setCropOpen(true);
  };

  const saveCroppedImage = async (): Promise<void> => {
    if (!sourceUrl || !croppedAreaPixels) return;
    setError(null);

    try {
      const dataUrl = await cropCircle(sourceUrl, croppedAreaPixels, AVATAR_DIMENSION);
      const parsed = parseImageDataUrl(dataUrl);
      if (!parsed.ok) {
        setError(t(parsed.reason));
        return;
      }

      update.mutate(dataUrl, {
        onSuccess: () => {
          toast.success(t('Đã đổi ảnh đại diện'));
          closeCrop();
        },
        onError: (mutationError) => setError(getErrorMessage(mutationError)),
      });
    } catch {
      setError(t('Không cắt được ảnh này. Hãy thử điều chỉnh lại vùng cắt.'));
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-4">
      <Avatar name={user.name} src={user.avatarDataUrl} frameUrl={myFrame} size="lg" />

      <div className="min-w-0">
        <div className="flex flex-wrap gap-2">
          <Button size="sm" icon={Camera} loading={update.isPending} onClick={() => inputRef.current?.click()}>
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
          {t('Ảnh JPG, PNG hoặc WebP. Sau khi chọn, bạn có thể kéo và zoom để cắt hình tròn.')}
        </p>

        {error && !cropOpen && (
          <div className="mt-2"><ErrorMessage>{error}</ErrorMessage></div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED_AVATAR_MIME.join(',')}
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = '';
          if (file) openFile(file);
        }}
      />

      <Modal
        open={cropOpen && sourceUrl !== null}
        onClose={() => { if (!update.isPending) closeCrop(); }}
        title={t('Cắt ảnh đại diện')}
        size="md"
        footer={
          <div className="flex w-full flex-wrap justify-end gap-2">
            <Button variant="secondary" onClick={() => inputRef.current?.click()} disabled={update.isPending}>
              {t('Chọn ảnh khác')}
            </Button>
            <Button variant="secondary" onClick={closeCrop} disabled={update.isPending}>
              {t('Huỷ')}
            </Button>
            <Button onClick={() => void saveCroppedImage()} loading={update.isPending} disabled={!croppedAreaPixels}>
              {t('Lưu')}
            </Button>
          </div>
        }
      >
        {sourceUrl && (
          <div>
            <div className="relative h-72 w-full overflow-hidden rounded-xl bg-black/90">
              <Cropper
                image={sourceUrl}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={(_, pixels) => setCroppedAreaPixels(pixels)}
              />
            </div>

            <label className="mt-4 flex items-center gap-3 text-xs text-content-muted">
              <span>{t('Thu nhỏ')}</span>
              <input
                className="min-w-0 flex-1 accent-brand"
                type="range"
                min={1}
                max={3}
                step={0.05}
                value={zoom}
                onChange={(event) => setZoom(Number(event.target.value))}
                disabled={update.isPending}
                aria-label={t('Phóng to ảnh')}
              />
              <span>{t('Phóng to')}</span>
            </label>

            {error && <div className="mt-3"><ErrorMessage>{error}</ErrorMessage></div>}
          </div>
        )}
      </Modal>
    </div>
  );
}

async function cropCircle(sourceUrl: string, crop: Area, size: number): Promise<string> {
  const image = await loadImage(sourceUrl);
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Trình duyệt không hỗ trợ canvas');

  context.clearRect(0, 0, size, size);
  context.beginPath();
  context.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
  context.clip();
  context.drawImage(image, crop.x, crop.y, crop.width, crop.height, 0, 0, size, size);
  return canvas.toDataURL('image/png');
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Không đọc được ảnh'));
    image.src = src;
  });
}
