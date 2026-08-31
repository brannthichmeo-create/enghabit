"""Xuất ảnh tên hệ thống ENG//HABIT từ file thiết kế gốc.

    python fe/scripts/make-wordmark.py <đường-dẫn-ảnh-gốc>

Ảnh thiết kế là ảnh chụp: chữ navy trên nền giấy xám, có bóng đổ. Dán thẳng lên nền
olive của app sẽ ra một khối chữ nhật xám, nên phải tách chữ khỏi nền trước.

Script tạo hai file trong `fe/public`:
  - wordmark.png       navy #16255F, dùng cho chế độ sáng
  - wordmark-dark.png  #C5CDF2, dùng cho chế độ tối (navy trên nền tối chỉ đạt 1.8:1)

Chạy lại script này khi đổi bảng màu nền — màu tên nằm trong file ảnh nên không tự
đổi theo token như phần còn lại của giao diện (xem docs/color-rules.md).
"""

import sys
from pathlib import Path

import numpy as np
from PIL import Image

# Console Windows mặc định dùng cp1252, in tiếng Việt có dấu sẽ ném UnicodeEncodeError
sys.stdout.reconfigure(encoding="utf-8")

OUT_DIR = Path(__file__).resolve().parents[1] / "public"

NAVY = (22, 37, 95)  # #16255f — màu tên ở chế độ sáng
PALE = (197, 205, 242)  # #c5cdf2 — chế độ tối
TARGET_HEIGHT = 160  # đủ nét cho màn hình 3x mà file vẫn nhẹ

# Ngưỡng độ sáng phân tách chữ với nền. Dốc mềm giữa hai mốc để mép chữ còn răng cưa
# mượt; bóng đổ sáng hơn HI nên bị loại hoàn toàn.
LUM_SOLID, LUM_EMPTY = 0.30, 0.60


def main(source: Path) -> None:
    img = Image.open(source).convert("RGB")
    a = np.asarray(img).astype(np.float32) / 255.0
    lum = 0.2126 * a[:, :, 0] + 0.7152 * a[:, :, 1] + 0.0722 * a[:, :, 2]
    alpha = np.clip((LUM_EMPTY - lum) / (LUM_EMPTY - LUM_SOLID), 0.0, 1.0)

    print(f"ảnh gốc {img.size[0]}x{img.size[1]} — tỷ lệ điểm thuộc chữ {(alpha > 0.5).mean():.1%}")

    # Cắt sát vùng có chữ để component không phải bù khoảng trắng thừa
    ys, xs = np.where(alpha > 0.05)
    alpha = alpha[ys.min() : ys.max() + 1, xs.min() : xs.max() + 1]

    write(alpha, NAVY, "wordmark.png")
    write(alpha, PALE, "wordmark-dark.png")


def write(alpha: np.ndarray, color: tuple[int, int, int], name: str) -> None:
    height, width = alpha.shape
    rgba = np.zeros((height, width, 4), dtype=np.uint8)
    rgba[:, :, 0], rgba[:, :, 1], rgba[:, :, 2] = color
    rgba[:, :, 3] = (alpha * 255).astype(np.uint8)

    out = Image.fromarray(rgba, "RGBA")
    ratio = TARGET_HEIGHT / height
    out = out.resize((round(width * ratio), TARGET_HEIGHT), Image.LANCZOS)
    out.save(OUT_DIR / name, optimize=True)
    print(f"{name}: {out.size[0]}x{out.size[1]}")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit("Thiếu đường dẫn ảnh gốc. Ví dụ: python fe/scripts/make-wordmark.py ~/Downloads/imag.png")
    main(Path(sys.argv[1]).expanduser())
