import { useState } from 'react';
import { ImageOff, Pencil, Plus, Store, Tag, Trash2, Upload } from 'lucide-react';
import {
  ALLOWED_SHOP_IMAGE_MIME,
  SHOP_IMAGE_MAX_BYTES,
  parseShopImageDataUrl,
  type AdminShopItemView,
  type AdminShopTypeView,
} from '@enghabit/shared';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Field,
  Input,
  PageHeader,
  Select,
  Skeleton,
  Switch,
} from '../../../shared/components/ui';
import { Modal } from '../../../shared/components/Modal';
import { useConfirm } from '../../../shared/components/ConfirmDialog';
import { useToast } from '../../../shared/components/Toast';
import { getErrorMessage } from '../../../shared/lib/api-client';
import { useT } from '../../../shared/i18n/language';
import {
  useAdminShopItems,
  useAdminShopTypes,
  useCreateShopItem,
  useCreateShopType,
  useDeleteShopItem,
  useDeleteShopType,
  useUpdateShopItem,
  useUpdateShopType,
} from '../admin.hooks';

/**
 * Quản lý cửa hàng: loại vật phẩm và vật phẩm.
 *
 * Hai điều màn này cố ý KHÔNG cho làm, vì phía dưới backend cũng chặn:
 *
 * - **Xoá vật phẩm đã có người mua.** Người học đã trả xu để có nó. Nút xoá đổi thành
 *   công tắc "Đang bán" — kết quả quản trị viên thật sự cần, lại đảo ngược được.
 * - **Sửa mã loại (`slug`).** Giao diện gắn code hiển thị theo mã đó; đổi mã là con
 *   linh vật lặng lẽ biến mất khỏi trang Tổng quan mà không ai hiểu vì sao.
 */
export function AdminShopPage(): JSX.Element {
  const t = useT();
  const [typeFilter, setTypeFilter] = useState<number | undefined>(undefined);
  const [itemForm, setItemForm] = useState<{ open: boolean; item?: AdminShopItemView }>({ open: false });
  const [typeForm, setTypeForm] = useState<{ open: boolean; type?: AdminShopTypeView }>({ open: false });

  const types = useAdminShopTypes();
  const items = useAdminShopItems(typeFilter);

  return (
    <div>
      <PageHeader
        title={t('Quản lý cửa hàng')}
        description={t('Thêm và sửa loại vật phẩm, vật phẩm bán cho người học bằng xu')}
        action={
          <div className="flex gap-2">
            <Button variant="secondary" icon={Tag} onClick={() => setTypeForm({ open: true })}>
              {t('Thêm loại')}
            </Button>
            <Button
              icon={Plus}
              disabled={!types.data || types.data.length === 0}
              title={
                types.data && types.data.length === 0
                  ? t('Hãy tạo một loại vật phẩm trước')
                  : undefined
              }
              onClick={() => setItemForm({ open: true })}
            >
              {t('Thêm vật phẩm')}
            </Button>
          </div>
        }
      />

      <Card className="mb-4">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-content-muted">
          {t('Loại vật phẩm')}
        </h2>

        {types.isLoading && <Skeleton className="h-20 w-full" />}
        {types.isError && (
          <ErrorState message={getErrorMessage(types.error)} onRetry={() => void types.refetch()} />
        )}

        {types.data && types.data.length === 0 && (
          <p className="text-sm text-content-muted">
            {t('Chưa có loại nào. Hãy tạo loại đầu tiên, ví dụ Linh vật.')}
          </p>
        )}

        {types.data && types.data.length > 0 && (
          <ul className="flex flex-wrap gap-2">
            {types.data.map((type) => (
              <li key={type.id}>
                <TypeChip type={type} onEdit={() => setTypeForm({ open: true, type })} />
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-content-muted">
            {t('Vật phẩm')}
          </h2>

          <Select
            value={typeFilter ?? ''}
            onChange={(event) => setTypeFilter(event.target.value ? Number(event.target.value) : undefined)}
            aria-label={t('Lọc theo loại')}
            className="!mt-0 w-48"
          >
            <option value="">{t('Tất cả loại')}</option>
            {types.data?.map((type) => (
              <option key={type.id} value={type.id}>
                {type.label}
              </option>
            ))}
          </Select>
        </div>

        {items.isLoading && <Skeleton className="h-64 w-full" />}
        {items.isError && (
          <ErrorState message={getErrorMessage(items.error)} onRetry={() => void items.refetch()} />
        )}

        {items.data && items.data.length === 0 && (
          <EmptyState
            icon={Store}
            title={t('Chưa có vật phẩm nào')}
            description={t('Thêm vật phẩm để người học có thứ để mua bằng xu.')}
          />
        )}

        {items.data && items.data.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-content-muted">
                  <th className="pb-2 pr-3 font-semibold">{t('Vật phẩm')}</th>
                  <th className="pb-2 pr-3 font-semibold">{t('Loại')}</th>
                  <th className="pb-2 pr-3 text-right font-semibold">{t('Giá')}</th>
                  <th className="pb-2 pr-3 text-right font-semibold">{t('Đã bán')}</th>
                  <th className="pb-2 pr-3 font-semibold">{t('Đang bán')}</th>
                  <th className="pb-2 text-right font-semibold">{t('Thao tác')}</th>
                </tr>
              </thead>
              <tbody>
                {items.data.map((item) => (
                  <ItemRow key={item.id} item={item} onEdit={() => setItemForm({ open: true, item })} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {typeForm.open && (
        <TypeFormModal type={typeForm.type} onClose={() => setTypeForm({ open: false })} />
      )}
      {itemForm.open && types.data && (
        <ItemFormModal
          item={itemForm.item}
          types={types.data}
          onClose={() => setItemForm({ open: false })}
        />
      )}
    </div>
  );
}

function TypeChip({ type, onEdit }: { type: AdminShopTypeView; onEdit: () => void }): JSX.Element {
  const t = useT();
  const toast = useToast();
  const confirm = useConfirm();
  const remove = useDeleteShopType();

  return (
    <span className="inline-flex items-center gap-2 rounded-lg border border-line bg-sunken px-3 py-2">
      <span className="text-sm font-medium text-content">{type.label}</span>
      <code className="rounded bg-surface px-1.5 py-0.5 text-xs text-content-muted">{type.slug}</code>
      <span className="text-xs tabular-nums text-content-muted">
        {t('{n} vật phẩm', { n: type.totalItemCount })}
      </span>
      {!type.isActive && <Badge tone="slate">{t('Đã tắt')}</Badge>}

      <button
        type="button"
        onClick={onEdit}
        aria-label={t('Sửa loại {name}', { name: type.label })}
        className="rounded p-1 text-content-muted transition-colors hover:bg-hover hover:text-content"
      >
        <Pencil className="h-3.5 w-3.5" aria-hidden />
      </button>

      <button
        type="button"
        aria-label={t('Xoá loại {name}', { name: type.label })}
        onClick={async () => {
          const ok = await confirm({
            title: t('Xoá loại {name}?', { name: type.label }),
            message: t('Chỉ xoá được loại chưa có vật phẩm nào. Muốn giấu khỏi cửa hàng thì hãy tắt loại.'),
            confirmLabel: t('Xoá'),
            tone: 'danger',
          });
          if (!ok) return;

          remove.mutate(type.id, {
            onSuccess: () => toast.success(t('Đã xoá loại {name}', { name: type.label })),
            onError: (error) => toast.error(getErrorMessage(error)),
          });
        }}
        className="rounded p-1 text-content-muted transition-colors hover:bg-danger-soft hover:text-danger"
      >
        <Trash2 className="h-3.5 w-3.5" aria-hidden />
      </button>
    </span>
  );
}

function ItemRow({ item, onEdit }: { item: AdminShopItemView; onEdit: () => void }): JSX.Element {
  const t = useT();
  const toast = useToast();
  const confirm = useConfirm();
  const update = useUpdateShopItem();
  const remove = useDeleteShopItem();

  const sold = item.ownerCount > 0;

  return (
    <tr className="border-b border-line/60 last:border-0">
      <td className="py-2.5 pr-3">
        <span className="flex items-center gap-3">
          {item.imageUrl ? (
            <img src={item.imageUrl} alt="" className="h-9 w-9 rounded-lg bg-sunken object-contain" />
          ) : (
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-sunken">
              <ImageOff className="h-4 w-4 text-content-muted" aria-hidden />
            </span>
          )}
          <span className="font-medium text-content">{item.name}</span>
        </span>
      </td>
      <td className="py-2.5 pr-3 text-content-soft">{item.typeLabel}</td>
      <td className="py-2.5 pr-3 text-right tabular-nums text-content-soft">{item.price}</td>
      <td className="py-2.5 pr-3 text-right tabular-nums text-content-muted">{item.ownerCount}</td>
      <td className="py-2.5 pr-3">
        <Switch
          checked={item.isActive}
          busy={update.isPending}
          label={t('Đang bán {name}', { name: item.name })}
          onChange={(value) =>
            update.mutate(
              { id: item.id, input: { isActive: value } },
              { onError: (error) => toast.error(getErrorMessage(error)) },
            )
          }
        />
      </td>
      <td className="py-2.5 text-right">
        <span className="inline-flex gap-1">
          <Button variant="ghost" size="sm" icon={Pencil} onClick={onEdit}>
            {t('Sửa')}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            icon={Trash2}
            /* Đã bán thì không xoá được — backend cũng chặn bằng ràng buộc Restrict.
               Nút xám kèm lý do, không để người dùng bấm rồi đoán. */
            disabled={sold}
            title={
              sold
                ? t('Đã có {n} người mua nên không xoá được. Hãy tắt "Đang bán".', { n: item.ownerCount })
                : t('Xoá vật phẩm')
            }
            onClick={async () => {
              const ok = await confirm({
                title: t('Xoá {name}?', { name: item.name }),
                message: t('Thao tác này không hoàn tác được.'),
                confirmLabel: t('Xoá'),
                tone: 'danger',
              });
              if (!ok) return;

              remove.mutate(item.id, {
                onSuccess: () => toast.success(t('Đã xoá {name}', { name: item.name })),
                onError: (error) => toast.error(getErrorMessage(error)),
              });
            }}
          >
            {t('Xoá')}
          </Button>
        </span>
      </td>
    </tr>
  );
}

function TypeFormModal({
  type,
  onClose,
}: {
  type?: AdminShopTypeView;
  onClose: () => void;
}): JSX.Element {
  const t = useT();
  const toast = useToast();
  const create = useCreateShopType();
  const update = useUpdateShopType();

  const [slug, setSlug] = useState(type?.slug ?? '');
  const [label, setLabel] = useState(type?.label ?? '');
  const [description, setDescription] = useState(type?.description ?? '');
  const [isActive, setIsActive] = useState(type?.isActive ?? true);

  const isEdit = type !== undefined;

  function submit(): void {
    const onError = (error: Error): void => toast.error(getErrorMessage(error));

    if (isEdit) {
      update.mutate(
        { id: type.id, input: { label, description, isActive } },
        {
          onSuccess: () => {
            toast.success(t('Đã lưu loại vật phẩm'));
            onClose();
          },
          onError,
        },
      );
      return;
    }

    create.mutate(
      { slug: slug.trim().toUpperCase(), label, description, sortOrder: 0, isActive },
      {
        onSuccess: () => {
          toast.success(t('Đã thêm loại vật phẩm'));
          onClose();
        },
        onError,
      },
    );
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={isEdit ? t('Sửa loại vật phẩm') : t('Thêm loại vật phẩm')}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {t('Huỷ')}
          </Button>
          <Button
            loading={create.isPending || update.isPending}
            disabled={!label.trim() || (!isEdit && !slug.trim())}
            onClick={submit}
          >
            {t('Lưu')}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <Field
          label={t('Mã loại')}
          hint={
            isEdit
              ? t('Mã loại không sửa được vì giao diện gắn chỗ hiển thị theo mã này.')
              : t('CHỮ HOA, số và gạch dưới. Ví dụ: MASCOT')
          }
        >
          <Input
            value={slug}
            disabled={isEdit}
            onChange={(event) => setSlug(event.target.value.toUpperCase())}
            placeholder="MASCOT"
          />
        </Field>

        <Field label={t('Tên loại')} hint={t('Tên hiện trên tab của cửa hàng')}>
          <Input value={label} onChange={(event) => setLabel(event.target.value)} placeholder={t('Linh vật')} />
        </Field>

        <Field label={t('Mô tả')}>
          <Input value={description} onChange={(event) => setDescription(event.target.value)} />
        </Field>

        <label className="flex items-center gap-3">
          <Switch checked={isActive} onChange={setIsActive} label={t('Hiện trong cửa hàng')} />
          <span className="text-sm text-content-soft">{t('Hiện trong cửa hàng')}</span>
        </label>
      </div>
    </Modal>
  );
}

function ItemFormModal({
  item,
  types,
  onClose,
}: {
  item?: AdminShopItemView;
  types: AdminShopTypeView[];
  onClose: () => void;
}): JSX.Element {
  const t = useT();
  const toast = useToast();
  const create = useCreateShopItem();
  const update = useUpdateShopItem();

  const [typeId, setTypeId] = useState(item?.typeId ?? types[0]?.id ?? 0);
  const [name, setName] = useState(item?.name ?? '');
  const [description, setDescription] = useState(item?.description ?? '');
  const [price, setPrice] = useState(String(item?.price ?? 300));
  const [isActive, setIsActive] = useState(item?.isActive ?? true);
  const [imageDataUrl, setImageDataUrl] = useState<string | undefined>(undefined);
  const [imageError, setImageError] = useState<string | undefined>(undefined);

  const isEdit = item !== undefined;
  const preview = imageDataUrl ?? item?.imageUrl ?? null;

  /**
   * Đọc file thành data URL, KHÔNG đi qua canvas.
   *
   * Khác avatar (thu nhỏ bằng canvas rồi xuất JPEG): linh vật cần nền trong suốt, mà
   * xuất JPEG thì phần trong suốt thành đen. Đổi lại quản trị viên phải tự chuẩn bị ảnh
   * đúng cỡ — kiểm tra ngưỡng ngay tại đây bằng đúng hàm mà backend dùng.
   */
  function pickImage(file: File): void {
    const reader = new FileReader();

    reader.onload = () => {
      const dataUrl = String(reader.result);
      const parsed = parseShopImageDataUrl(dataUrl);

      if (!parsed.ok) {
        setImageError(parsed.reason);
        setImageDataUrl(undefined);
        return;
      }

      setImageError(undefined);
      setImageDataUrl(dataUrl);
    };

    reader.onerror = () => setImageError(t('Không đọc được ảnh'));
    reader.readAsDataURL(file);
  }

  function submit(): void {
    const parsedPrice = Number(price);
    if (!Number.isInteger(parsedPrice) || parsedPrice < 0) {
      toast.error(t('Giá phải là số nguyên không âm'));
      return;
    }

    const onError = (error: Error): void => toast.error(getErrorMessage(error));
    const onSuccess = (): void => {
      toast.success(isEdit ? t('Đã lưu vật phẩm') : t('Đã thêm vật phẩm'));
      onClose();
    };

    if (isEdit) {
      update.mutate(
        { id: item.id, input: { typeId, name, description, price: parsedPrice, isActive, imageDataUrl } },
        { onSuccess, onError },
      );
      return;
    }

    create.mutate(
      { typeId, name, description, price: parsedPrice, sortOrder: 0, isActive, imageDataUrl },
      { onSuccess, onError },
    );
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={isEdit ? t('Sửa vật phẩm') : t('Thêm vật phẩm')}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {t('Huỷ')}
          </Button>
          <Button
            loading={create.isPending || update.isPending}
            disabled={!name.trim() || !typeId}
            onClick={submit}
          >
            {t('Lưu')}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <div className="flex items-start gap-4">
          {preview ? (
            <img src={preview} alt="" className="h-24 w-24 rounded-lg bg-sunken object-contain" />
          ) : (
            <span className="flex h-24 w-24 items-center justify-center rounded-lg bg-sunken">
              <ImageOff className="h-6 w-6 text-content-muted" aria-hidden />
            </span>
          )}

          <div className="flex-1">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2 text-sm font-medium text-content-soft transition-colors hover:bg-sunken">
              <Upload className="h-4 w-4" aria-hidden />
              {t('Chọn ảnh')}
              <input
                type="file"
                accept={ALLOWED_SHOP_IMAGE_MIME.join(',')}
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  // Xoá giá trị để chọn lại đúng file vừa chọn vẫn kích hoạt onChange.
                  event.target.value = '';
                  if (file) pickImage(file);
                }}
              />
            </label>

            <p className="mt-1.5 text-xs text-content-muted">
              {t('PNG, WebP hoặc JPG, tối đa {n}KB. Nên dùng PNG nền trong suốt.', {
                n: Math.round(SHOP_IMAGE_MAX_BYTES / 1000),
              })}
            </p>
            {imageError && (
              <p className="mt-1 text-xs text-danger" role="alert">
                {imageError}
              </p>
            )}
          </div>
        </div>

        <Field label={t('Loại')}>
          <Select value={typeId} onChange={(event) => setTypeId(Number(event.target.value))}>
            {types.map((type) => (
              <option key={type.id} value={type.id}>
                {type.label}
              </option>
            ))}
          </Select>
        </Field>

        <Field label={t('Tên vật phẩm')}>
          <Input value={name} onChange={(event) => setName(event.target.value)} />
        </Field>

        <Field label={t('Mô tả')}>
          <Input value={description} onChange={(event) => setDescription(event.target.value)} />
        </Field>

        <Field label={t('Giá (xu)')} hint={t('Đặt 0 để tặng miễn phí')}>
          <Input
            type="number"
            min={0}
            value={price}
            onChange={(event) => setPrice(event.target.value)}
          />
        </Field>

        <label className="flex items-center gap-3">
          <Switch checked={isActive} onChange={setIsActive} label={t('Đang bán')} />
          <span className="text-sm text-content-soft">{t('Đang bán')}</span>
        </label>
      </div>
    </Modal>
  );
}
