import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';
import { FeatureKey, KnownItemSlug } from '@enghabit/shared';
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
import { communityKeys } from '../community/community.hooks';
import { leaderboardKeys } from '../leaderboard/leaderboard.hooks';
import { groupKeys } from '../groups/group.hooks';
import { useFeatureQueryEnabled } from '../feature-flags/feature-flag.hooks';
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
    onSuccess: (inventory) => afterEquipChange(queryClient, inventory),
  });
}

export function useUnequipItem(): UseMutationResult<InventoryView, Error, number> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: shopApi.unequipItem,
    onSuccess: (inventory) => afterEquipChange(queryClient, inventory),
  });
}

/**
 * Việc chung sau khi đổi hoặc bỏ vật phẩm đang dùng.
 *
 * Ghi thẳng kho mới vào cache (sidebar và trang cá nhân đọc khung của mình từ đó nên đổi
 * ngay), rồi làm mới mọi màn hiện khung viền của NGƯỜI DÙNG: bài đăng, bình luận, bảng
 * xếp hạng, thành viên nhóm. Không làm mới thì người vừa đổi khung mở diễn đàn vẫn thấy
 * khung cũ trên chính bài của mình, và tưởng việc đổi khung không có tác dụng.
 */
function afterEquipChange(queryClient: QueryClient, inventory: InventoryView): void {
  queryClient.setQueryData(shopKeys.inventory(), inventory);
  // Danh sách cửa hàng mang cờ `isEquipped`, không làm mới thì thẻ vừa chọn vẫn ghi
  // "Đã sở hữu" thay vì "Đang dùng".
  void queryClient.invalidateQueries({ queryKey: shopKeys.itemsRoot() });
  void queryClient.invalidateQueries({ queryKey: communityKeys.all });
  void queryClient.invalidateQueries({ queryKey: leaderboardKeys.all });
  void queryClient.invalidateQueries({ queryKey: groupKeys.all });
}

/**
 * Khung viền của CHÍNH người đang đăng nhập, cho sidebar và trang cá nhân.
 *
 * Đọc từ kho vật phẩm chứ không từ `/auth/me`: kho được ghi lại ngay khi đổi khung nên
 * sidebar đổi theo tức thì, còn thông tin đăng nhập nằm trong store và chỉ tải lại khi
 * đăng nhập lại.
 *
 * Trả `null` (khung mặc định) cho quản trị viên và khi Cửa hàng đang tắt — đúng như
 * backend làm với khung của người khác (`shop.frame.ts`), nên mình thấy gì thì người
 * khác thấy nấy.
 */
export function useMyFrameUrl(isLearner: boolean): string | null {
  const shopEnabled = useFeatureQueryEnabled(FeatureKey.SHOP);
  const inventory = useInventory(isLearner && shopEnabled);
  return inventory.data?.equippedBySlug[KnownItemSlug.AVATAR_FRAME]?.imageUrl ?? null;
}
