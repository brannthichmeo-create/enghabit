import type {
  InventoryView,
  Paginated,
  PurchaseResult,
  ShopItemQueryInput,
  ShopItemView,
  ShopTypeView,
  WalletQueryInput,
  WalletView,
} from '@enghabit/shared';
import { apiClient } from '../../shared/lib/api-client';

/**
 * Lời gọi API của Cửa hàng, Ví và Kho vật phẩm.
 *
 * Ba màn hình dùng chung một feature vì chúng chia sẻ vòng đời dữ liệu: mua một món là
 * cả ba phải đổi cùng lúc (cửa hàng đổi nút, kho có thêm dòng, ví trừ xu). Tách thành
 * ba feature thì ba khoá cache nằm ở ba chỗ và chắc chắn có chỗ quên làm mới.
 */

export async function listTypes(): Promise<ShopTypeView[]> {
  const { data } = await apiClient.get<ShopTypeView[]>('/shop/types');
  return data;
}

export async function listItems(
  query: Partial<ShopItemQueryInput> = {},
): Promise<Paginated<ShopItemView>> {
  const { data } = await apiClient.get<Paginated<ShopItemView>>('/shop/items', { params: query });
  return data;
}

export async function buyItem(itemId: number): Promise<PurchaseResult> {
  const { data } = await apiClient.post<PurchaseResult>(`/shop/items/${itemId}/buy`);
  return data;
}

export async function setFavorite(itemId: number, favorite: boolean): Promise<ShopItemView> {
  const { data } = await apiClient.put<ShopItemView>(`/shop/items/${itemId}/favorite`, { favorite });
  return data;
}

export async function getInventory(): Promise<InventoryView> {
  const { data } = await apiClient.get<InventoryView>('/shop/inventory');
  return data;
}

export async function equipItem(typeId: number, itemId: number): Promise<InventoryView> {
  const { data } = await apiClient.put<InventoryView>(`/shop/equipped/${typeId}`, { itemId });
  return data;
}

export async function unequipItem(typeId: number): Promise<InventoryView> {
  const { data } = await apiClient.delete<InventoryView>(`/shop/equipped/${typeId}`);
  return data;
}

export async function getWallet(query: Partial<WalletQueryInput> = {}): Promise<WalletView> {
  const { data } = await apiClient.get<WalletView>('/shop/wallet', { params: query });
  return data;
}
