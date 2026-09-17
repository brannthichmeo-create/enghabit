import { FeatureKey, KnownItemSlug } from '@enghabit/shared';
import { useFeatureQueryEnabled } from '../../feature-flags/feature-flag.hooks';
import { useInventory } from '../shop.hooks';

/**
 * Linh vật người học đang chọn dùng.
 *
 * Trả `null` khi chưa chọn gì, chưa tải xong, hoặc tính năng Cửa hàng đang tắt — bố cục
 * quanh nó phải nguyên vẹn trong mọi trường hợp đó. Một khoảng trống chừa sẵn cho thứ
 * chưa chắc có làm trang trông như đang hỏng.
 *
 * Chỉ đọc loại `MASCOT`. Loại vật phẩm khác (do quản trị viên tự thêm) vẫn mua và chọn
 * dùng được trong kho, chỉ là chưa có chỗ hiển thị trong giao diện — đúng như thiết kế,
 * loại lạ không được làm vỡ màn hình nào (xem shared/shop > KnownItemSlug).
 */
export function EquippedMascot({
  size = 'md',
  enabled = true,
}: {
  size?: 'sm' | 'md' | 'lg';
  /** Truyền false cho quản trị viên: họ không có vật phẩm nên không gọi API của người học. */
  enabled?: boolean;
}): JSX.Element | null {
  /*
    Tắt Cửa hàng thì KHÔNG gọi API — một request chắc chắn nhận 404, vừa tốn vừa làm
    console có lỗi đỏ không phải lỗi thật.

    Dùng `useFeatureQueryEnabled` (CHỜ biết chắc) chứ không phải bản đồ cờ lạc quan:
    đây là request, không phải chuyện vẽ hay không vẽ (xem CLAUDE.md).
  */
  const shopEnabled = useFeatureQueryEnabled(FeatureKey.SHOP);
  const inventory = useInventory(enabled && shopEnabled);

  const mascot = inventory.data?.equippedBySlug[KnownItemSlug.MASCOT];
  if (!mascot?.imageUrl) return null;

  const box = size === 'lg' ? 'h-24 w-24' : size === 'sm' ? 'h-10 w-10' : 'h-16 w-16';

  return (
    <img
      src={mascot.imageUrl}
      // Tên linh vật là trang trí, không mang thông tin cần đọc — để alt rỗng cho trình
      // đọc màn hình bỏ qua, và dùng title cho người rê chuột.
      alt=""
      title={mascot.name}
      className={`${box} shrink-0 object-contain`}
    />
  );
}
