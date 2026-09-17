import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';
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
import { rewardsKeys } from '../rewards/rewards.hooks';
import * as shopApi from './shop.api';

/**
 * Khoá cache của Cửa hàng, Ví và Kho vật phẩm.
 *
 * `items` BẮT BUỘC mang cả bộ lọc trong khoá. Thiếu nó thì tab Yêu thích và tab Tất cả
 * dùng chung một ô cache, và người dùng mở tab này sẽ thấy trong chốc lát danh sách của
 * tab kia — đúng lỗi đã gặp với `communityKeys.list` khi khoá thiếu `groupId`.
 */
export const shopKeys = {
  all: ['shop'] as const,
  types: () => ['shop', 'types'] as const,
  /** Tiền tố của MỌI danh sách vật phẩm — dùng để làm mới hết mọi bộ lọc cùng lúc. */
  itemsRoot: () => ['shop', 'items'] as const,
  items: (query: Partial<ShopItemQueryInput>) => ['shop', 'items', query] as const,
  inventory: () => ['shop', 'inventory'] as const,
  wallet: (query: Partial<WalletQueryInput>) => ['shop', 'wallet', query] as const,
};

export function useShopTypes(enabled = true): UseQueryResult<ShopTypeView[]> {
  return useQuery({ queryKey: shopKeys.types(), queryFn: shopApi.listTypes, enabled });
}

export function useShopItems(
  query: Partial<ShopItemQueryInput>,
  enabled = true,
): UseQueryResult<Paginated<ShopItemView>> {
  return useQuery({
    queryKey: shopKeys.items(query),
    queryFn: () => shopApi.listItems(query),
    enabled,
  });
}

export function useInventory(enabled = true): UseQueryResult<InventoryView> {
  return useQuery({ queryKey: shopKeys.inventory(), queryFn: shopApi.getInventory, enabled });
}

export function useWallet(
  query: Partial<WalletQueryInput>,
  enabled = true,
): UseQueryResult<WalletView> {
  return useQuery({
    queryKey: shopKeys.wallet(query),
    queryFn: () => shopApi.getWallet(query),
    enabled,
  });
}

/**
 * Mua một vật phẩm.
 *
 * Làm mới TẤT CẢ dữ liệu của shop cộng với số dư ở thanh trên cùng (`rewardsKeys`).
 * Đây chính là cơ chế khiến "bấm mua ở tab Yêu thích thì cửa hàng cũng cập nhật": không
 * màn nào giữ bản sao trạng thái riêng, cả ba cùng đọc lại từ một nguồn.
 */
export function useBuyItem(): UseMutationResult<PurchaseResult, Error, number> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: shopApi.buyItem,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: shopKeys.all });
      // Số dư xu hiện ở khu phần thưởng của trang Tổng quan — tiêu xu ở đây thì con số
      // bên đó phải đổi theo, nếu không hai chỗ nói hai số khác nhau.
      void queryClient.invalidateQueries({ queryKey: rewardsKeys.all });
    },
  });
}

/**
 * Bật/tắt yêu thích.
 *
 * Gửi trạng thái ĐÍCH chứ không phải lệnh đảo (xem `toggleFavoriteSchema`), nên bấm
 * nhanh hai lần vẫn ra đúng một kết quả.
 */
export function useSetFavorite(): UseMutationResult<
  ShopItemView,
  Error,
  { itemId: number; favorite: boolean }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ itemId, favorite }) => shopApi.setFavorite(itemId, favorite),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: shopKeys.all });
    },
  });
}

/** Chọn vật phẩm dùng cho một loại. Trả về kho mới nên ghi thẳng vào cache. */
export function useEquipItem(): UseMutationResult<
  InventoryView,
  Error,
  { typeId: number; itemId: number }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ typeId, itemId }) => shopApi.equipItem(typeId, itemId),
    onSuccess: (inventory) => {
      queryClient.setQueryData(shopKeys.inventory(), inventory);
      // Danh sách cửa hàng mang cờ `isEquipped` nên cũng phải làm mới, nếu không thẻ
      // vừa chọn vẫn ghi "Đã sở hữu" thay vì "Đang dùng".
      void queryClient.invalidateQueries({ queryKey: shopKeys.itemsRoot() });
    },
  });
}

export function useUnequipItem(): UseMutationResult<InventoryView, Error, number> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: shopApi.unequipItem,
    onSuccess: (inventory) => {
      queryClient.setQueryData(shopKeys.inventory(), inventory);
      void queryClient.invalidateQueries({ queryKey: shopKeys.itemsRoot() });
    },
  });
}
