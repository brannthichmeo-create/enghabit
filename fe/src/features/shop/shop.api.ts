import type {
  InventoryView,
  OwnedItemView,
  Paginated,
  PurchaseResult,
  ShopItemQueryInput,
  ShopItemView,
  ShopTypeView,
  WalletQueryInput,
  WalletView,
} from '@enghabit/shared';
import { apiClient } from '../../shared/lib/api-client';
import { apiUrl } from '../../shared/lib/config';

/**
 * Lời gọi API của Cửa hàng, Ví và Kho vật phẩm.
 *
 * Ba màn hình dùng chung một feature vì chúng chia sẻ vòng đời dữ liệu: mua một món là
 * cả ba phải đổi cùng lúc (cửa hàng đổi nút, kho có thêm dòng, ví trừ xu). Tách thành
 * ba feature thì ba khoá cache nằm ở ba chỗ và chắc chắn có chỗ quên làm mới.
 *
 * MỌI hàm trả vật phẩm đều đi qua `withImageSrc` trước khi rời file này. Backend trả
 * `imageUrl` là đường dẫn dưới gốc API; ghép nó ở ĐÂY một lần thì component nào cũng
 * nhận được URL dùng thẳng làm `src`. Ghép ở từng component thì component viết sau quên
 * ghép sẽ vỡ ảnh — và chỉ vỡ trên production, vì local có Vite proxy che mất lỗi.
 */

/** Ghép `imageUrl` với gốc API. Dùng chung với admin.api qua export. */
export function withImageSrc<T extends { imageUrl: string | null }>(item: T): T {
  return item.imageUrl ? { ...item, imageUrl: apiUrl(item.imageUrl) } : item;
}

function withInventoryImageSrc(inventory: InventoryView): InventoryView {
  const equippedBySlug: Record<string, OwnedItemView> = {};
  for (const [slug, item] of Object.entries(inventory.equippedBySlug)) {
    equippedBySlug[slug] = withImageSrc(item);
  }

  return { ...inventory, items: inventory.items.map(withImageSrc), equippedBySlug };
}

export async function listTypes(): Promise<ShopTypeView[]> {
  const { data } = await apiClient.get<ShopTypeView[]>('/shop/types');
  return data;
}

export async function listItems(
  query: Partial<ShopItemQueryInput> = {},
): Promise<Paginated<ShopItemView>> {
  const { data } = await apiClient.get<Paginated<ShopItemView>>('/shop/items', { params: query });
  return { ...data, items: data.items.map(withImageSrc) };
}

export async function buyItem(itemId: number): Promise<PurchaseResult> {
  const { data } = await apiClient.post<PurchaseResult>(`/shop/items/${itemId}/buy`);
  return { ...data, item: withImageSrc(data.item) };
}

export async function setFavorite(itemId: number, favorite: boolean): Promise<ShopItemView> {
  const { data } = await apiClient.put<ShopItemView>(`/shop/items/${itemId}/favorite`, { favorite });
  return withImageSrc(data);
}

export async function getInventory(): Promise<InventoryView> {
  const { data } = await apiClient.get<InventoryView>('/shop/inventory');
  return withInventoryImageSrc(data);
}

export async function equipItem(typeId: number, itemId: number): Promise<InventoryView> {
  const { data } = await apiClient.put<InventoryView>(`/shop/equipped/${typeId}`, { itemId });
  return withInventoryImageSrc(data);
}

export async function unequipItem(typeId: number): Promise<InventoryView> {
  const { data } = await apiClient.delete<InventoryView>(`/shop/equipped/${typeId}`);
  return withInventoryImageSrc(data);
}

export async function getWallet(query: Partial<WalletQueryInput> = {}): Promise<WalletView> {
  const { data } = await apiClient.get<WalletView>('/shop/wallet', { params: query });
  return data;
}
