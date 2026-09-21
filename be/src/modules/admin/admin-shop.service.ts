import {
  AdminAction,
  parseShopImageDataUrl,
  type AdminShopItemView,
  type AdminShopTypeView,
  type CreateShopItemInput,
  type CreateShopTypeInput,
  type UpdateShopItemInput,
  type UpdateShopTypeInput,
} from '@enghabit/shared';
import { prisma } from '../../lib/prisma.js';
import { BadRequestError, ConflictError, NotFoundError } from '../../common/errors/app-error.js';
import { imageUrlFor } from '../shop/shop.service.js';
import { createdFields, diffFields, recordAdminAction } from './admin-audit.service.js';

/** Các trường được so trong nhật ký thao tác khi sửa loại / vật phẩm. */
const TYPE_FIELDS = ['label', 'description', 'sortOrder', 'isActive'] as const;
const ITEM_FIELDS = ['typeId', 'name', 'description', 'price', 'sortOrder', 'isActive'] as const;

/**
 * Chuẩn hoá mô tả như lúc ghi (`'' → null`), để xoá trắng mô tả được ghi đúng là
 * "có → trống" chứ không bị bỏ qua vì so `''` với `null`.
 */
function withNullDescription<T extends { description?: string | null }>(input: T): T {
  return input.description === undefined ? input : { ...input, description: input.description || null };
}

/**
 * Quản trị cửa hàng: CRUD loại vật phẩm và vật phẩm.
 *
 * Hai quy tắc an toàn của module này:
 *
 * 1. **Không xoá thứ người dùng đã trả xu để có.** Vật phẩm đã có người mua chỉ ngừng
 *    bán được (`isActive = false`), loại đang có vật phẩm chỉ tắt được. Ràng buộc
 *    Restrict dưới DB chặn thật; hàm ở đây chỉ dịch nó thành câu tiếng Việt đọc được.
 * 2. **Không sửa `slug` của loại.** Giao diện gắn code hiển thị theo slug, đổi nó là
 *    con linh vật lặng lẽ biến mất khỏi trang Tổng quan mà không ai hiểu vì sao.
 */

// ---------------------------------------------------------------------------
// Loại vật phẩm
// ---------------------------------------------------------------------------

export async function listTypes(): Promise<AdminShopTypeView[]> {
  const types = await prisma.shopItemType.findMany({
    orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    include: {
      _count: { select: { items: true } },
      items: { where: { isActive: true }, select: { id: true } },
    },
  });

  return types.map((type) => ({
    id: type.id,
    slug: type.slug,
    label: type.label,
    description: type.description,
    isActive: type.isActive,
    sortOrder: type.sortOrder,
    itemCount: type.items.length,
    totalItemCount: type._count.items,
  }));
}

export async function createType(input: CreateShopTypeInput, adminId: number): Promise<AdminShopTypeView> {
  const existing = await prisma.shopItemType.findUnique({ where: { slug: input.slug } });
  if (existing) throw new ConflictError(`Mã loại "${input.slug}" đã tồn tại`);

  const type = await prisma.$transaction(async (tx) => {
    const created = await tx.shopItemType.create({
      data: {
        slug: input.slug,
        label: input.label,
        description: input.description ?? null,
        sortOrder: input.sortOrder,
        isActive: input.isActive,
      },
    });
    await recordAdminAction(
      {
        actorId: adminId,
        action: AdminAction.SHOP_TYPE_CREATED,
        targetId: created.id,
        targetLabel: created.label,
        changes: createdFields(withNullDescription(input), ['slug', ...TYPE_FIELDS]),
      },
      tx,
    );
    return created;
  });

  return {
    id: type.id,
    slug: type.slug,
    label: type.label,
    description: type.description,
    isActive: type.isActive,
    sortOrder: type.sortOrder,
    itemCount: 0,
    totalItemCount: 0,
  };
}

/** Sửa loại. `slug` không nằm trong input nên không có đường nào đổi được nó. */
export async function updateType(
  id: number,
  input: UpdateShopTypeInput,
  adminId: number,
): Promise<AdminShopTypeView> {
  const before = await prisma.shopItemType.findUnique({ where: { id } });
  if (!before) throw new NotFoundError('Loại vật phẩm không tồn tại');
  const changes = diffFields(before, withNullDescription(input), TYPE_FIELDS);

  const type = await prisma.$transaction(async (tx) => {
    const updated = await tx.shopItemType.update({
      where: { id },
      data: {
        ...(input.label !== undefined ? { label: input.label } : {}),
        ...(input.description !== undefined ? { description: input.description || null } : {}),
        ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
        ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
      },
      include: {
        _count: { select: { items: true } },
        items: { where: { isActive: true }, select: { id: true } },
      },
    });
    if (changes) {
      await recordAdminAction(
        { actorId: adminId, action: AdminAction.SHOP_TYPE_UPDATED, targetId: id, targetLabel: updated.label, changes },
        tx,
      );
    }
    return updated;
  });

  return {
    id: type.id,
    slug: type.slug,
    label: type.label,
    description: type.description,
    isActive: type.isActive,
    sortOrder: type.sortOrder,
    itemCount: type.items.length,
    totalItemCount: type._count.items,
  };
}

/**
 * Xoá một loại.
 *
 * Chỉ xoá được loại RỖNG. Loại đang có vật phẩm thì xoá là kéo theo cả kho hàng —
 * quản trị viên muốn giấu nó khỏi cửa hàng thì tắt `isActive`, việc đó đảo ngược được.
 */
export async function deleteType(id: number, adminId: number): Promise<void> {
  const type = await prisma.shopItemType.findUnique({ where: { id }, select: { label: true, slug: true } });
  if (!type) throw new NotFoundError('Loại vật phẩm không tồn tại');

  const itemCount = await prisma.shopItem.count({ where: { typeId: id } });
  if (itemCount > 0) {
    throw new BadRequestError(
      `Loại này còn ${itemCount} vật phẩm. Hãy xoá hoặc chuyển chúng trước, hoặc tắt loại thay vì xoá`,
    );
  }

  await prisma.$transaction(async (tx) => {
    await recordAdminAction(
      { actorId: adminId, action: AdminAction.SHOP_TYPE_DELETED, targetId: id, targetLabel: type.label, note: type.slug },
      tx,
    );
    await tx.shopItemType.delete({ where: { id } });
  });
}

// ---------------------------------------------------------------------------
// Vật phẩm
// ---------------------------------------------------------------------------

export async function listItems(typeId?: number): Promise<AdminShopItemView[]> {
  const items = await prisma.shopItem.findMany({
    where: typeId ? { typeId } : {},
    orderBy: [{ typeId: 'asc' }, { sortOrder: 'asc' }, { id: 'asc' }],
    include: {
      type: { select: { label: true } },
      image: { select: { updatedAt: true } },
      _count: { select: { owners: true } },
    },
  });

  return items.map((item) => ({
    id: item.id,
    typeId: item.typeId,
    typeLabel: item.type.label,
    name: item.name,
    description: item.description,
    price: item.price,
    isActive: item.isActive,
    sortOrder: item.sortOrder,
    imageUrl: imageUrlFor(item.id, item.image?.updatedAt),
    ownerCount: item._count.owners,
    createdAt: item.createdAt.toISOString(),
  }));
}

export async function createItem(
  adminId: number,
  input: CreateShopItemInput,
): Promise<AdminShopItemView> {
  await assertTypeExists(input.typeId);

  const item = await prisma.shopItem.create({
    data: {
      typeId: input.typeId,
      name: input.name,
      description: input.description ?? null,
      price: input.price,
      sortOrder: input.sortOrder,
      isActive: input.isActive,
      createdById: adminId,
    },
  });

  if (input.imageDataUrl) await saveImage(item.id, input.imageDataUrl);

  // Vật phẩm và ảnh ghi bằng hai lệnh riêng (ảnh là blob lớn, kiểm tra riêng), nên nhật
  // ký ghi SAU cả hai: dòng "đã tạo" chỉ xuất hiện khi vật phẩm đã tạo trọn vẹn.
  await recordAdminAction({
    actorId: adminId,
    action: AdminAction.SHOP_ITEM_CREATED,
    targetId: item.id,
    targetLabel: item.name,
    changes: {
      ...createdFields(withNullDescription(input), ITEM_FIELDS),
      ...(input.imageDataUrl ? { image: { from: null, to: true } } : {}),
    },
  });

  return getItem(item.id);
}

export async function updateItem(
  id: number,
  input: UpdateShopItemInput,
  adminId: number,
): Promise<AdminShopItemView> {
  const before = await prisma.shopItem.findUnique({
    where: { id },
    include: { image: { select: { itemId: true } } },
  });
  if (!before) throw new NotFoundError('Vật phẩm không tồn tại');
  if (input.typeId !== undefined) await assertTypeExists(input.typeId);

  await prisma.shopItem.update({
    where: { id },
    data: {
      ...(input.typeId !== undefined ? { typeId: input.typeId } : {}),
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.description !== undefined ? { description: input.description || null } : {}),
      ...(input.price !== undefined ? { price: input.price } : {}),
      ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
    },
  });

  if (input.imageDataUrl) await saveImage(id, input.imageDataUrl);

  /*
    Đổi loại của một vật phẩm đang được ai đó dùng thì dòng "đang dùng" của họ trở nên
    sai loại, nên bỏ nó đi. Người dùng chỉ mất lựa chọn hiển thị, KHÔNG mất vật phẩm —
    nó vẫn nằm nguyên trong kho và chọn lại được ở loại mới.
  */
  if (input.typeId !== undefined) {
    await prisma.userEquippedItem.deleteMany({ where: { itemId: id, typeId: { not: input.typeId } } });
  }

  const changes = {
    ...diffFields(before, withNullDescription(input), ITEM_FIELDS),
    // Ảnh là blob nên không so nội dung — chỉ ghi là đã thay, và trước đó có ảnh hay chưa.
    ...(input.imageDataUrl ? { image: { from: before.image !== null, to: true } } : {}),
  };
  if (Object.keys(changes).length > 0) {
    await recordAdminAction({
      actorId: adminId,
      action: AdminAction.SHOP_ITEM_UPDATED,
      targetId: id,
      targetLabel: input.name ?? before.name,
      changes,
    });
  }

  return getItem(id);
}

/**
 * Xoá một vật phẩm.
 *
 * Chỉ xoá được vật phẩm CHƯA AI MUA. Đã có người trả xu thì xoá là lấy mất thứ họ đã
 * mua và làm dòng lịch sử trong ví của họ mất tên — ngừng bán bằng `isActive` cho kết
 * quả mà quản trị viên thật sự cần, lại đảo ngược được.
 */
export async function deleteItem(id: number, adminId: number): Promise<void> {
  const item = await prisma.shopItem.findUnique({
    where: { id },
    include: { _count: { select: { owners: true } } },
  });

  if (!item) throw new NotFoundError('Vật phẩm không tồn tại');

  if (item._count.owners > 0) {
    throw new BadRequestError(
      `Đã có ${item._count.owners} người mua vật phẩm này nên không xoá được. Hãy tắt "Đang bán" để ngừng bán`,
    );
  }

  await prisma.$transaction(async (tx) => {
    await recordAdminAction(
      {
        actorId: adminId,
        action: AdminAction.SHOP_ITEM_DELETED,
        targetId: id,
        targetLabel: item.name,
        changes: { price: { from: item.price, to: null } },
      },
      tx,
    );
    await tx.shopItem.delete({ where: { id } });
  });
}

/** Gỡ ảnh của một vật phẩm. Vật phẩm không ảnh vẫn bán được, FE vẽ ô giữ chỗ. */
export async function deleteItemImage(id: number, adminId: number): Promise<AdminShopItemView> {
  const item = await prisma.shopItem.findUnique({ where: { id }, select: { name: true } });
  if (!item) throw new NotFoundError('Vật phẩm không tồn tại');

  await prisma.$transaction(async (tx) => {
    const { count } = await tx.shopItemImage.deleteMany({ where: { itemId: id } });
    // Gỡ ảnh của vật phẩm vốn không có ảnh thì không có gì xảy ra để ghi.
    if (count > 0) {
      await recordAdminAction(
        {
          actorId: adminId,
          action: AdminAction.SHOP_ITEM_IMAGE_DELETED,
          targetId: id,
          targetLabel: item.name,
          changes: { image: { from: true, to: false } },
        },
        tx,
      );
    }
  });
  return getItem(id);
}

// ---------------------------------------------------------------------------
// Dùng chung
// ---------------------------------------------------------------------------

/**
 * Ghi ảnh vật phẩm.
 *
 * Kiểm tra LẠI ở đây bằng đúng hàm mà FE dùng (`parseShopImageDataUrl` của shared) —
 * FE có thể bị bỏ qua hoàn toàn bằng cách gọi thẳng API, và ngưỡng chỉ có một chỗ định
 * nghĩa nên hai phía không bao giờ lệch.
 */
async function saveImage(itemId: number, dataUrl: string): Promise<void> {
  const parsed = parseShopImageDataUrl(dataUrl);
  if (!parsed.ok) throw new BadRequestError(parsed.reason);

  const data = Buffer.from(parsed.base64, 'base64');

  await prisma.shopItemImage.upsert({
    where: { itemId },
    create: { itemId, data, mimeType: parsed.mimeType },
    update: { data, mimeType: parsed.mimeType },
  });
}

async function getItem(id: number): Promise<AdminShopItemView> {
  const item = await prisma.shopItem.findUnique({
    where: { id },
    include: {
      type: { select: { label: true } },
      image: { select: { updatedAt: true } },
      _count: { select: { owners: true } },
    },
  });

  if (!item) throw new NotFoundError('Vật phẩm không tồn tại');

  return {
    id: item.id,
    typeId: item.typeId,
    typeLabel: item.type.label,
    name: item.name,
    description: item.description,
    price: item.price,
    isActive: item.isActive,
    sortOrder: item.sortOrder,
    imageUrl: imageUrlFor(item.id, item.image?.updatedAt),
    ownerCount: item._count.owners,
    createdAt: item.createdAt.toISOString(),
  };
}

async function assertTypeExists(id: number): Promise<void> {
  const type = await prisma.shopItemType.findUnique({ where: { id }, select: { id: true } });
  if (!type) throw new NotFoundError('Loại vật phẩm không tồn tại');
}
