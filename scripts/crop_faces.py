"""
サーモンの顔部分をアップでクロップするスクリプト。
各画像ごとに顔の位置を手動指定して正方形にクロップし、
背景を除去して透過PNGとして出力する。
"""
from PIL import Image, ImageFilter
import numpy as np
import os
from collections import deque

BACKUP_DIR = os.path.join(os.path.dirname(__file__), "..", "public", "images", "salmon", "backup")
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "..", "public", "images", "salmon")
OUTPUT_SIZE = 192

# 各サーモンの顔クロップ領域 (left, top, right, bottom)
# 元画像のサイズに対する比率で指定
FACE_CROPS = {
    # 左向き、左端に顔。顔〜胸びれあたりまで
    "アトランティックサーモン.jpg": (0.0, 0.05, 0.40, 0.95),
    # 左向き、左端寄り（背景グレーが多いので狭めにクロップ）
    "キングサーモン.jpg": (0.02, 0.10, 0.38, 0.78),
    # 左上向き、頭が左上
    "紅鮭.jpg": (0.10, 0.0, 0.55, 0.65),
    # 左向き、左下に顔
    "銀鮭.jpg": (0.0, 0.10, 0.40, 0.90),
    # 左向き、頭が左端
    "トラウトサーモン.png": (0.0, 0.0, 0.45, 1.0),
    # 左向き、左端に顔
    "秋鮭.jpg": (0.0, 0.05, 0.45, 0.85),
    # 左向き、左端に顔
    "カラフトマス.jpg": (0.0, 0.0, 0.40, 0.80),
    # 左向き、左端に顔
    "サクラマス.jpg": (0.0, 0.05, 0.42, 0.80),
}


def remove_background(img: Image.Image) -> Image.Image:
    """フラッドフィルベースの背景除去"""
    img = img.convert("RGBA")
    data = np.array(img)
    h, w = data.shape[:2]

    border_pixels = []
    for x in range(w):
        border_pixels.append(data[0, x, :3].astype(float))
        border_pixels.append(data[h-1, x, :3].astype(float))
    for y in range(h):
        border_pixels.append(data[y, 0, :3].astype(float))
        border_pixels.append(data[y, w-1, :3].astype(float))
    bg_color = np.median(np.array(border_pixels), axis=0)

    diff = np.sqrt(np.sum((data[:, :, :3].astype(float) - bg_color) ** 2, axis=2))

    seed_threshold = 85
    expand_threshold = 55

    visited = np.zeros((h, w), dtype=bool)
    queue = deque()

    for x in range(w):
        if diff[0, x] < seed_threshold:
            queue.append((0, x)); visited[0, x] = True
        if diff[h-1, x] < seed_threshold:
            queue.append((h-1, x)); visited[h-1, x] = True
    for y in range(h):
        if diff[y, 0] < seed_threshold:
            queue.append((y, 0)); visited[y, 0] = True
        if diff[y, w-1] < seed_threshold:
            queue.append((y, w-1)); visited[y, w-1] = True

    while queue:
        cy, cx = queue.popleft()
        for dy in (-1, 0, 1):
            for dx in (-1, 0, 1):
                if dy == 0 and dx == 0:
                    continue
                ny, nx = cy + dy, cx + dx
                if 0 <= ny < h and 0 <= nx < w and not visited[ny][nx]:
                    if diff[ny, nx] < expand_threshold:
                        visited[ny][nx] = True
                        queue.append((ny, nx))

    data[visited, 3] = 0

    result = Image.fromarray(data)
    alpha = result.split()[3]
    alpha = alpha.filter(ImageFilter.GaussianBlur(radius=0.8))
    alpha_data = np.array(alpha)
    alpha_data[alpha_data < 20] = 0
    result.putalpha(Image.fromarray(alpha_data))

    return result


def remove_small_islands(img: Image.Image) -> Image.Image:
    """最大の連結成分だけを残す"""
    data = np.array(img)
    alpha = data[:, :, 3]
    h, w = alpha.shape

    labeled = np.zeros((h, w), dtype=int)
    label = 0
    label_sizes = {}

    for y in range(h):
        for x in range(w):
            if alpha[y, x] > 10 and labeled[y, x] == 0:
                label += 1
                queue = deque()
                queue.append((y, x))
                labeled[y, x] = label
                size = 0
                while queue:
                    cy, cx = queue.popleft()
                    size += 1
                    for dy in (-1, 0, 1):
                        for dx in (-1, 0, 1):
                            if dy == 0 and dx == 0:
                                continue
                            ny, nx = cy + dy, cx + dx
                            if 0 <= ny < h and 0 <= nx < w and labeled[ny][nx] == 0 and alpha[ny, nx] > 10:
                                labeled[ny][nx] = label
                                queue.append((ny, nx))
                label_sizes[label] = size

    if not label_sizes:
        return img

    max_label = max(label_sizes, key=label_sizes.get)
    max_size = label_sizes[max_label]

    for lbl, size in label_sizes.items():
        if lbl != max_label and size < max_size * 0.05:
            data[labeled == lbl, 3] = 0

    return Image.fromarray(data)


def process_face(filename: str, crop_ratio: tuple) -> str:
    filepath = os.path.join(BACKUP_DIR, filename)
    img = Image.open(filepath).convert("RGBA")
    w, h = img.size

    # 顔部分をクロップ
    left = int(w * crop_ratio[0])
    top = int(h * crop_ratio[1])
    right = int(w * crop_ratio[2])
    bottom = int(h * crop_ratio[3])
    cropped = img.crop((left, top, right, bottom))

    # 正方形にする（短辺に合わせてセンタークロップ）
    cw, ch = cropped.size
    side = min(cw, ch)
    cx = (cw - side) // 2
    cy = (ch - side) // 2
    square = cropped.crop((cx, cy, cx + side, cy + side))

    # 背景除去
    square = remove_background(square)
    square = remove_small_islands(square)

    # リサイズ
    # 透過部分をトリミングして、サーモン本体を中央に配置
    data = np.array(square)
    alpha = data[:, :, 3]
    rows = np.any(alpha > 10, axis=1)
    cols = np.any(alpha > 10, axis=0)

    if rows.any() and cols.any():
        rmin, rmax = np.where(rows)[0][[0, -1]]
        cmin, cmax = np.where(cols)[0][[0, -1]]
        pad = 4
        rmin = max(0, rmin - pad)
        rmax = min(data.shape[0] - 1, rmax + pad)
        cmin = max(0, cmin - pad)
        cmax = min(data.shape[1] - 1, cmax + pad)
        trimmed = square.crop((cmin, rmin, cmax + 1, rmax + 1))
    else:
        trimmed = square

    # 正方形キャンバスに配置
    tw, th = trimmed.size
    scale = min(OUTPUT_SIZE / tw, OUTPUT_SIZE / th) * 0.92
    new_w = int(tw * scale)
    new_h = int(th * scale)
    resized = trimmed.resize((new_w, new_h), Image.LANCZOS)

    canvas = Image.new("RGBA", (OUTPUT_SIZE, OUTPUT_SIZE), (0, 0, 0, 0))
    ox = (OUTPUT_SIZE - new_w) // 2
    oy = (OUTPUT_SIZE - new_h) // 2
    canvas.paste(resized, (ox, oy), resized)

    # 出力
    basename = os.path.splitext(filename)[0]
    output_path = os.path.join(OUTPUT_DIR, f"{basename}.png")
    canvas.save(output_path, "PNG", optimize=True)
    return output_path


def main():
    for filename, crop_ratio in FACE_CROPS.items():
        print(f"処理中: {filename}")
        output = process_face(filename, crop_ratio)
        print(f"  → {os.path.basename(output)}")

    print("\n全画像の顔アップ加工が完了しました")


if __name__ == "__main__":
    main()
