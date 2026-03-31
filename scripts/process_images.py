"""
サーモン画像の加工スクリプト:
1. 背景（白/グレー/黒）を除去して透過PNGに変換
2. 離れた小さなゴミ領域を除去
3. サーモン本体のバウンディングボックスでトリミング
4. 横長の魚を斜め回転させて正方形に収まるようにする
5. 192x192px（Retina用）で出力
"""
from PIL import Image, ImageFilter
import numpy as np
import os
import glob
from collections import deque

INPUT_DIR = os.path.join(os.path.dirname(__file__), "..", "public", "images", "salmon")
OUTPUT_DIR = INPUT_DIR
OUTPUT_SIZE = 192


def remove_background(img: Image.Image) -> Image.Image:
    """フラッドフィルベースの背景除去"""
    img = img.convert("RGBA")
    data = np.array(img)
    h, w = data.shape[:2]

    # 四辺のピクセルを集めて背景色を推定
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
    expand_threshold = 60

    visited = np.zeros((h, w), dtype=bool)
    queue = deque()

    for x in range(w):
        if diff[0, x] < seed_threshold:
            queue.append((0, x))
            visited[0, x] = True
        if diff[h-1, x] < seed_threshold:
            queue.append((h-1, x))
            visited[h-1, x] = True
    for y in range(h):
        if diff[y, 0] < seed_threshold:
            queue.append((y, 0))
            visited[y, 0] = True
        if diff[y, w-1] < seed_threshold:
            queue.append((y, w-1))
            visited[y, w-1] = True

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

    # エッジのぼかし
    result = Image.fromarray(data)
    alpha = result.split()[3]
    alpha = alpha.filter(ImageFilter.GaussianBlur(radius=0.8))
    alpha_data = np.array(alpha)
    alpha_data[alpha_data < 20] = 0
    result.putalpha(Image.fromarray(alpha_data))

    return result


def remove_small_islands(img: Image.Image, min_area_ratio: float = 0.05) -> Image.Image:
    """
    メインのサーモン本体以外の小さな不透明領域（影の残骸等）を除去。
    最大の連結成分だけを残す。
    """
    data = np.array(img)
    alpha = data[:, :, 3]
    h, w = alpha.shape

    # 不透明ピクセルをラベリング（簡易BFS連結成分）
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

    # 最大の連結成分を特定
    max_label = max(label_sizes, key=label_sizes.get)
    max_size = label_sizes[max_label]

    # 最大成分以外で、最大成分の min_area_ratio 未満のサイズの領域を除去
    for lbl, size in label_sizes.items():
        if lbl != max_label and size < max_size * min_area_ratio:
            data[labeled == lbl, 3] = 0

    return Image.fromarray(data)


def trim_to_content(img: Image.Image, padding: int = 4) -> Image.Image:
    """透過でない部分のバウンディングボックスでトリミング"""
    data = np.array(img)
    alpha = data[:, :, 3]
    rows = np.any(alpha > 10, axis=1)
    cols = np.any(alpha > 10, axis=0)

    if not rows.any() or not cols.any():
        return img

    rmin, rmax = np.where(rows)[0][[0, -1]]
    cmin, cmax = np.where(cols)[0][[0, -1]]

    rmin = max(0, rmin - padding)
    rmax = min(data.shape[0] - 1, rmax + padding)
    cmin = max(0, cmin - padding)
    cmax = min(data.shape[1] - 1, cmax + padding)

    return img.crop((cmin, rmin, cmax + 1, rmax + 1))


def fit_to_square(img: Image.Image, size: int) -> Image.Image:
    """横長のサーモンを斜めに回転させて正方形に収める"""
    import math

    w, h = img.size
    aspect = w / h

    if aspect > 1.3:
        rotation_angle = min(40, max(25, math.degrees(math.atan2(h, w))))
        rotated = img.rotate(
            rotation_angle,
            expand=True,
            resample=Image.BICUBIC,
            fillcolor=(0, 0, 0, 0),
        )
        rotated = trim_to_content(rotated, padding=2)
    else:
        rotated = img

    rw, rh = rotated.size
    scale = min(size / rw, size / rh) * 0.9
    new_w = int(rw * scale)
    new_h = int(rh * scale)

    resized = rotated.resize((new_w, new_h), Image.LANCZOS)

    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    offset_x = (size - new_w) // 2
    offset_y = (size - new_h) // 2
    canvas.paste(resized, (offset_x, offset_y), resized)

    return canvas


def process_image(filepath: str) -> str:
    img = Image.open(filepath).convert("RGBA")
    img = remove_background(img)
    img = remove_small_islands(img)
    img = trim_to_content(img)
    img = fit_to_square(img, OUTPUT_SIZE)

    basename = os.path.splitext(os.path.basename(filepath))[0]
    output_path = os.path.join(OUTPUT_DIR, f"{basename}.png")
    img.save(output_path, "PNG", optimize=True)
    return output_path


def main():
    # jpgを先に処理（同名pngがあっても上書きされるので問題なし）
    files = sorted(glob.glob(os.path.join(INPUT_DIR, "*.jpg")))
    # jpg版がないpngのみ追加
    jpg_basenames = {os.path.splitext(os.path.basename(f))[0] for f in files}
    for f in sorted(glob.glob(os.path.join(INPUT_DIR, "*.png"))):
        bn = os.path.splitext(os.path.basename(f))[0]
        if bn not in jpg_basenames:
            files.append(f)

    for f in files:
        basename = os.path.basename(f)
        print(f"処理中: {basename}")
        output = process_image(f)
        print(f"  → {os.path.basename(output)}")

    # 元のjpgファイルを削除
    for f in glob.glob(os.path.join(INPUT_DIR, "*.jpg")):
        os.remove(f)
        print(f"削除: {os.path.basename(f)}")

    print("\n完了")


if __name__ == "__main__":
    main()
