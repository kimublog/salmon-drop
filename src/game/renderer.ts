import { Grid, FallingPiece } from "@/types/game";
import { SalmonId } from "@/types/salmon";
import { SALMON_TYPES, GRID_COLS, GRID_ROWS, CELL_SIZE } from "@/constants/salmonTypes";
import { getSubPos } from "./piece";

const BOARD_WIDTH = GRID_COLS * CELL_SIZE;
const BOARD_HEIGHT = GRID_ROWS * CELL_SIZE;

/** basePath を取得（GitHub Pages対応） */
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";

/** 画像キャッシュ */
const imageCache = new Map<string, HTMLImageElement>();
let imagesLoaded = false;

/** 全サーモン画像をプリロード */
export function preloadImages(onProgress?: (loaded: number, total: number) => void): Promise<void> {
  return new Promise((resolve) => {
    const total = SALMON_TYPES.length;
    let loaded = 0;

    if (total === 0) {
      imagesLoaded = true;
      resolve();
      return;
    }

    for (const salmon of SALMON_TYPES) {
      const img = new Image();
      img.src = `${BASE_PATH}/images/salmon/${salmon.image}`;
      img.onload = () => {
        imageCache.set(salmon.id, img);
        loaded++;
        onProgress?.(loaded, total);
        if (loaded === total) {
          imagesLoaded = true;
          resolve();
        }
      };
      img.onerror = () => {
        loaded++;
        onProgress?.(loaded, total);
        if (loaded === total) {
          imagesLoaded = true;
          resolve();
        }
      };
    }
  });
}

/** 背景を描画（海のグラデーション） */
function drawBackground(ctx: CanvasRenderingContext2D): void {
  const gradient = ctx.createLinearGradient(0, 0, 0, BOARD_HEIGHT);
  gradient.addColorStop(0, "#0D3B66");
  gradient.addColorStop(1, "#1B4F72");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, BOARD_WIDTH, BOARD_HEIGHT);
}

/** グリッド線を描画 */
function drawGridLines(ctx: CanvasRenderingContext2D): void {
  ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
  ctx.lineWidth = 1;

  for (let col = 0; col <= GRID_COLS; col++) {
    ctx.beginPath();
    ctx.moveTo(col * CELL_SIZE, 0);
    ctx.lineTo(col * CELL_SIZE, BOARD_HEIGHT);
    ctx.stroke();
  }

  for (let row = 0; row <= GRID_ROWS; row++) {
    ctx.beginPath();
    ctx.moveTo(0, row * CELL_SIZE);
    ctx.lineTo(BOARD_WIDTH, row * CELL_SIZE);
    ctx.stroke();
  }
}

/** 1つのサーモンセルを描画 */
function drawSalmon(
  ctx: CanvasRenderingContext2D,
  salmonId: SalmonId,
  col: number,
  row: number,
  alpha: number = 1
): void {
  const x = col * CELL_SIZE;
  const y = row * CELL_SIZE;
  const padding = 1;
  const size = CELL_SIZE - padding * 2;

  ctx.save();
  ctx.globalAlpha = alpha;

  // ドロップシャドウ
  ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
  ctx.shadowBlur = 3;
  ctx.shadowOffsetX = 1;
  ctx.shadowOffsetY = 1;

  const img = imageCache.get(salmonId);
  if (img) {
    // 透過PNG: セル全体にそのまま描画（画像は正方形に加工済み）
    ctx.drawImage(img, x + padding, y + padding, size, size);
  } else {
    // フォールバック: 色付き四角
    const colors: Record<string, string> = {
      atlantic: "#FA8072", king: "#FF6347", sockeye: "#DC143C", silver: "#C0C0C0",
      trout: "#FFA07A", chum: "#CD853F", pink: "#FFB6C1", cherry: "#FF69B4",
    };
    ctx.fillStyle = colors[salmonId] || "#888";
    ctx.fillRect(x + padding, y + padding, size, size);
  }

  ctx.restore();
}

/** グリッド全体を描画 */
function drawGrid(ctx: CanvasRenderingContext2D, grid: Grid): void {
  for (let row = 0; row < GRID_ROWS; row++) {
    for (let col = 0; col < GRID_COLS; col++) {
      const cell = grid[row][col];
      if (cell) {
        drawSalmon(ctx, cell, col, row);
      }
    }
  }
}

/** 落下ピースを描画 */
function drawPiece(ctx: CanvasRenderingContext2D, piece: FallingPiece, alpha: number = 1): void {
  drawSalmon(ctx, piece.main, piece.pos.col, piece.pos.row, alpha);
  const sub = getSubPos(piece);
  drawSalmon(ctx, piece.sub, sub.col, sub.row, alpha);
}

/** メインの描画関数 */
export function render(
  ctx: CanvasRenderingContext2D,
  grid: Grid,
  currentPiece: FallingPiece | null,
  ghostPiece: FallingPiece | null
): void {
  ctx.clearRect(0, 0, BOARD_WIDTH, BOARD_HEIGHT);
  drawBackground(ctx);
  drawGridLines(ctx);
  drawGrid(ctx, grid);

  if (ghostPiece) {
    drawPiece(ctx, ghostPiece, 0.25);
  }

  if (currentPiece) {
    drawPiece(ctx, currentPiece);
  }
}

export { BOARD_WIDTH, BOARD_HEIGHT };
