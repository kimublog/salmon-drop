import { Grid, FallingPiece } from "@/types/game";
import { SalmonId } from "@/types/salmon";
import { SALMON_TYPES, GRID_COLS, GRID_ROWS, CELL_SIZE } from "@/constants/salmonTypes";
import { getBlockPositions } from "./piece";

const BOARD_WIDTH = GRID_COLS * CELL_SIZE;
const BOARD_HEIGHT = GRID_ROWS * CELL_SIZE;

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";

const imageCache = new Map<string, HTMLImageElement>();
let imagesLoaded = false;

// ========== パーティクルシステム ==========

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  life: number;
  maxLife: number;
  rotation: number;
  rotationSpeed: number;
}

const particles: Particle[] = [];

const SALMON_COLORS: Record<string, string[]> = {
  atlantic: ["#FA8072", "#E06050", "#FFB0A0"],
  king:     ["#FF6347", "#CC4030", "#FFA090"],
  sockeye:  ["#DC143C", "#B01030", "#FF4060"],
  silver:   ["#C0C0C0", "#909090", "#E0E0E0"],
  trout:    ["#FFA07A", "#DD7050", "#FFC8B0"],
  chum:     ["#CD853F", "#A06830", "#E0A060"],
  pink:     ["#FFB6C1", "#DD9099", "#FFD0D8"],
  cherry:   ["#FF69B4", "#DD5090", "#FF90C8"],
};

export function spawnParticles(col: number, row: number, salmonId: SalmonId): void {
  const cx = col * CELL_SIZE + CELL_SIZE / 2;
  const cy = row * CELL_SIZE + CELL_SIZE / 2;
  const colors = SALMON_COLORS[salmonId] || ["#FFF", "#CCC", "#AAA"];

  const count = 10 + Math.floor(Math.random() * 5);
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
    const speed = 2 + Math.random() * 4;
    const life = 0.5 + Math.random() * 0.4;
    particles.push({
      x: cx + (Math.random() - 0.5) * 8,
      y: cy + (Math.random() - 0.5) * 8,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 1.5,
      size: 3 + Math.random() * 5,
      color: colors[Math.floor(Math.random() * colors.length)],
      life, maxLife: life,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.3,
    });
  }
  // フラッシュ
  particles.push({
    x: cx, y: cy, vx: 0, vy: 0,
    size: CELL_SIZE * 0.9, color: "#FFFFFF",
    life: 0.18, maxLife: 0.18, rotation: 0, rotationSpeed: 0,
  });
}

function updateParticles(dt: number): void {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.life -= dt;
    if (p.life <= 0) { particles.splice(i, 1); continue; }
    p.x += p.vx; p.y += p.vy;
    p.vy += 0.1; p.vx *= 0.97;
    p.rotation += p.rotationSpeed;
    p.size *= 0.97;
  }
}

function drawParticles(ctx: CanvasRenderingContext2D): void {
  for (const p of particles) {
    const alpha = Math.max(0, p.life / p.maxLife);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rotation);
    if (p.size > CELL_SIZE * 0.5) {
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, p.size);
      g.addColorStop(0, `rgba(255,255,255,${alpha})`);
      g.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = g;
      ctx.fillRect(-p.size, -p.size, p.size * 2, p.size * 2);
    } else {
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 6;
      const hs = p.size / 2;
      ctx.beginPath();
      ctx.moveTo(0, -hs); ctx.lineTo(hs, 0);
      ctx.lineTo(0, hs); ctx.lineTo(-hs, 0);
      ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  }
}

export function hasActiveParticles(): boolean {
  return particles.length > 0;
}

// ========== 連鎖テキスト表示 ==========

interface ChainText {
  text: string;
  subText: string;
  x: number;
  y: number;
  life: number;
  maxLife: number;
  color: string;
  scale: number;
}

const chainTexts: ChainText[] = [];

const CHAIN_LABELS = [
  "", "1連鎖!", "2連鎖!", "3連鎖!", "4連鎖!", "5連鎖!",
  "6連鎖!", "7連鎖!", "8連鎖!", "9連鎖!", "10連鎖!",
];
const CHAIN_COLORS = [
  "", "#FFFFFF", "#FFD700", "#FF8C00", "#FF4500", "#FF0000",
  "#FF00FF", "#8B00FF", "#00FFFF", "#00FF00", "#FFFFFF",
];
const CHAIN_WORDS = [
  "", "", "NICE!", "GREAT!", "EXCELLENT!", "AMAZING!",
  "INCREDIBLE!", "FANTASTIC!", "LEGENDARY!", "GODLIKE!", "INSANE!",
];

export function showChainText(chainCount: number): void {
  const idx = Math.min(chainCount, CHAIN_LABELS.length - 1);
  chainTexts.push({
    text: CHAIN_LABELS[idx] || `${chainCount}連鎖!`,
    subText: CHAIN_WORDS[idx] || "AMAZING!",
    x: BOARD_WIDTH / 2,
    y: BOARD_HEIGHT / 2 - 20,
    life: 1.5,
    maxLife: 1.5,
    color: CHAIN_COLORS[idx] || "#FF4500",
    scale: 1 + chainCount * 0.15,
  });
}

function updateChainTexts(dt: number): void {
  for (let i = chainTexts.length - 1; i >= 0; i--) {
    chainTexts[i].life -= dt;
    chainTexts[i].y -= 0.3; // ゆっくり上昇
    if (chainTexts[i].life <= 0) chainTexts.splice(i, 1);
  }
}

function drawChainTexts(ctx: CanvasRenderingContext2D): void {
  for (const ct of chainTexts) {
    const progress = 1 - ct.life / ct.maxLife; // 0→1
    const alpha = progress < 0.1 ? progress / 0.1 : ct.life < 0.3 ? ct.life / 0.3 : 1;
    // 登場時に拡大→通常サイズに戻るバウンスアニメーション
    const bounce = progress < 0.15
      ? 1 + Math.sin(progress / 0.15 * Math.PI) * 0.4
      : 1;
    const scale = ct.scale * bounce;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(ct.x, ct.y);
    ctx.scale(scale, scale);

    // サブテキスト（英語）
    if (ct.subText) {
      ctx.font = "bold 18px 'Noto Sans JP', sans-serif";
      ctx.textAlign = "center";
      ctx.fillStyle = ct.color;
      ctx.shadowColor = "rgba(0,0,0,0.8)";
      ctx.shadowBlur = 6;
      ctx.fillText(ct.subText, 0, -24);
    }

    // メインテキスト（連鎖数）
    ctx.font = "bold 28px 'Noto Sans JP', sans-serif";
    ctx.textAlign = "center";
    ctx.strokeStyle = "rgba(0,0,0,0.7)";
    ctx.lineWidth = 4;
    ctx.shadowColor = ct.color;
    ctx.shadowBlur = 12;
    ctx.strokeText(ct.text, 0, 0);
    ctx.fillStyle = "#FFFFFF";
    ctx.shadowBlur = 0;
    ctx.fillText(ct.text, 0, 0);

    ctx.restore();
  }
}

// ========== 消滅アニメーション（点滅・縮小） ==========

interface VanishingCell {
  col: number;
  row: number;
  salmonId: SalmonId;
  life: number;
  maxLife: number;
}

const vanishingCells: VanishingCell[] = [];

export function addVanishingCells(cells: { col: number; row: number; salmonId: SalmonId }[]): void {
  for (const c of cells) {
    vanishingCells.push({ ...c, life: 0.35, maxLife: 0.35 });
  }
}

function updateVanishingCells(dt: number): void {
  for (let i = vanishingCells.length - 1; i >= 0; i--) {
    vanishingCells[i].life -= dt;
    if (vanishingCells[i].life <= 0) vanishingCells.splice(i, 1);
  }
}

function drawVanishingCells(ctx: CanvasRenderingContext2D): void {
  for (const vc of vanishingCells) {
    const progress = 1 - vc.life / vc.maxLife; // 0→1
    const x = vc.col * CELL_SIZE + CELL_SIZE / 2;
    const y = vc.row * CELL_SIZE + CELL_SIZE / 2;
    const padding = 1;
    const baseSize = CELL_SIZE - padding * 2;

    // 点滅 + 縮小
    const blink = Math.sin(progress * Math.PI * 6) > 0 ? 1 : 0.3;
    const shrink = 1 - progress * 0.6;
    const size = baseSize * shrink;
    const alpha = (1 - progress) * blink;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(x, y);

    // 白い光のグロー
    ctx.shadowColor = "#FFFFFF";
    ctx.shadowBlur = 10 + progress * 15;

    const img = imageCache.get(vc.salmonId);
    if (img) {
      ctx.drawImage(img, -size / 2, -size / 2, size, size);
    }
    ctx.restore();
  }
}

export function hasVanishingCells(): boolean {
  return vanishingCells.length > 0;
}

// ========== 落下アニメーション ==========

interface FallingCell {
  col: number;
  fromRow: number;
  toRow: number;
  salmonId: SalmonId;
  progress: number; // 0→1
}

const fallingCells: FallingCell[] = [];

export function addFallingCells(cells: { col: number; fromRow: number; toRow: number; salmonId: SalmonId }[]): void {
  for (const c of cells) {
    fallingCells.push({ ...c, progress: 0 });
  }
}

function updateFallingCells(dt: number): void {
  for (let i = fallingCells.length - 1; i >= 0; i--) {
    fallingCells[i].progress += dt * 4; // 速度
    if (fallingCells[i].progress >= 1) fallingCells.splice(i, 1);
  }
}

function drawFallingCells(ctx: CanvasRenderingContext2D): void {
  for (const fc of fallingCells) {
    // イージング（バウンス風）
    const t = Math.min(1, fc.progress);
    const ease = t < 0.7
      ? (t / 0.7) * (t / 0.7) // 加速
      : 1 - Math.sin((t - 0.7) / 0.3 * Math.PI) * 0.08; // 軽いバウンス

    const y = (fc.fromRow + (fc.toRow - fc.fromRow) * ease) * CELL_SIZE;
    const x = fc.col * CELL_SIZE;
    const padding = 1;
    const size = CELL_SIZE - padding * 2;

    const img = imageCache.get(fc.salmonId);
    if (img) {
      ctx.save();
      ctx.shadowColor = "rgba(0,0,0,0.5)";
      ctx.shadowBlur = 3;
      ctx.drawImage(img, x + padding, y + padding, size, size);
      ctx.restore();
    }
  }
}

export function hasFallingCells(): boolean {
  return fallingCells.length > 0;
}

// ========== 画像プリロード ==========

export function preloadImages(onProgress?: (loaded: number, total: number) => void): Promise<void> {
  return new Promise((resolve) => {
    const total = SALMON_TYPES.length;
    let loaded = 0;
    if (total === 0) { imagesLoaded = true; resolve(); return; }
    for (const salmon of SALMON_TYPES) {
      const img = new Image();
      img.src = `${BASE_PATH}/images/salmon/${salmon.image}`;
      img.onload = () => {
        imageCache.set(salmon.id, img);
        loaded++;
        onProgress?.(loaded, total);
        if (loaded === total) { imagesLoaded = true; resolve(); }
      };
      img.onerror = () => {
        loaded++;
        onProgress?.(loaded, total);
        if (loaded === total) { imagesLoaded = true; resolve(); }
      };
    }
  });
}

// ========== ピースのスムーズ描画 ==========

/** 描画用の補間位置 */
interface SmoothPos {
  displayCol: number;
  displayRow: number;
}

let smoothPos: SmoothPos = { displayCol: 2, displayRow: 0 };

export function updateSmoothPos(targetCol: number, targetRow: number, lerpSpeed: number = 0.35): void {
  smoothPos.displayCol += (targetCol - smoothPos.displayCol) * lerpSpeed;
  smoothPos.displayRow += (targetRow - smoothPos.displayRow) * lerpSpeed;
  // スナップ: ほぼ到達したら完全一致
  if (Math.abs(smoothPos.displayCol - targetCol) < 0.01) smoothPos.displayCol = targetCol;
  if (Math.abs(smoothPos.displayRow - targetRow) < 0.01) smoothPos.displayRow = targetRow;
}

export function resetSmoothPos(col: number, row: number): void {
  smoothPos = { displayCol: col, displayRow: row };
}

export function getSmoothPos(): SmoothPos {
  return smoothPos;
}

// ========== 描画 ==========

function drawBackground(ctx: CanvasRenderingContext2D): void {
  const gradient = ctx.createLinearGradient(0, 0, 0, BOARD_HEIGHT);
  gradient.addColorStop(0, "#FFF5F2");
  gradient.addColorStop(1, "#FFE8E0");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, BOARD_WIDTH, BOARD_HEIGHT);
}

function drawGridLines(ctx: CanvasRenderingContext2D): void {
  ctx.strokeStyle = "rgba(200, 150, 140, 0.15)";
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

/** ピクセル座標でサーモンを描画（スムーズ移動用） */
function drawSalmonAt(
  ctx: CanvasRenderingContext2D,
  salmonId: SalmonId,
  px: number,
  py: number,
  alpha: number = 1
): void {
  const padding = 1;
  const size = CELL_SIZE - padding * 2;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.shadowColor = "rgba(0,0,0,0.5)";
  ctx.shadowBlur = 3;
  ctx.shadowOffsetX = 1;
  ctx.shadowOffsetY = 1;
  const img = imageCache.get(salmonId);
  if (img) {
    ctx.drawImage(img, px + padding, py + padding, size, size);
  } else {
    const colors: Record<string, string> = {
      atlantic: "#FA8072", king: "#FF6347", sockeye: "#DC143C", silver: "#C0C0C0",
      trout: "#FFA07A", chum: "#CD853F", pink: "#FFB6C1", cherry: "#FF69B4",
    };
    ctx.fillStyle = colors[salmonId] || "#888";
    ctx.fillRect(px + padding, py + padding, size, size);
  }
  ctx.restore();
}

/** グリッドを描画（落下アニメ中のセルはスキップ） */
function drawGrid(ctx: CanvasRenderingContext2D, grid: Grid): void {
  // 落下アニメ中のセルをスキップセットに登録
  const skipSet = new Set<string>();
  for (const fc of fallingCells) {
    skipSet.add(`${fc.col},${fc.toRow}`);
  }

  for (let row = 0; row < GRID_ROWS; row++) {
    for (let col = 0; col < GRID_COLS; col++) {
      const cell = grid[row][col];
      if (cell && !skipSet.has(`${col},${row}`)) {
        drawSalmonAt(ctx, cell, col * CELL_SIZE, row * CELL_SIZE);
      }
    }
  }
}

/** 落下ピースをスムーズ描画（Nブロック対応） */
function drawPieceSmooth(
  ctx: CanvasRenderingContext2D,
  piece: FallingPiece,
  smooth: SmoothPos,
  alpha: number = 1
): void {
  for (const block of piece.blocks) {
    const px = (smooth.displayCol + block.dc) * CELL_SIZE;
    const py = (smooth.displayRow + block.dr) * CELL_SIZE;
    if (py + CELL_SIZE > 0) { // 画面上端より上は描画しない
      drawSalmonAt(ctx, block.salmonId, px, py, alpha);
    }
  }
}

/** ゴーストピース描画（Nブロック対応） */
function drawGhostPiece(ctx: CanvasRenderingContext2D, piece: FallingPiece): void {
  const padding = 1;
  const size = CELL_SIZE - padding * 2;
  const positions = getBlockPositions(piece);
  ctx.save();
  ctx.globalAlpha = 0.2;
  ctx.strokeStyle = "rgba(180,120,100,0.4)";
  ctx.lineWidth = 2;
  ctx.setLineDash([4, 4]);
  for (let i = 0; i < positions.length; i++) {
    const pos = positions[i];
    if (pos.row < 0) continue;
    const x = pos.col * CELL_SIZE + padding;
    const y = pos.row * CELL_SIZE + padding;
    ctx.strokeRect(x, y, size, size);
    const img = imageCache.get(piece.blocks[i].salmonId);
    if (img) {
      ctx.drawImage(img, x, y, size, size);
    }
  }
  ctx.restore();
}

/** メインの描画関数 */
export function render(
  ctx: CanvasRenderingContext2D,
  grid: Grid,
  currentPiece: FallingPiece | null,
  ghostPiece: FallingPiece | null
): void {
  const dt = 0.016;
  updateParticles(dt);
  updateChainTexts(dt);
  updateVanishingCells(dt);
  updateFallingCells(dt);

  // スムーズ位置を更新
  if (currentPiece) {
    updateSmoothPos(currentPiece.pos.col, currentPiece.pos.row);
  }

  ctx.clearRect(0, 0, BOARD_WIDTH, BOARD_HEIGHT);
  drawBackground(ctx);
  drawGridLines(ctx);
  drawGrid(ctx, grid);

  // 落下アニメーション
  drawFallingCells(ctx);

  // 消滅アニメーション
  drawVanishingCells(ctx);

  // ゴースト
  if (ghostPiece) {
    drawGhostPiece(ctx, ghostPiece);
  }

  // 操作中のピース（スムーズ位置で描画）
  if (currentPiece) {
    drawPieceSmooth(ctx, currentPiece, smoothPos);
  }

  // パーティクル
  drawParticles(ctx);

  // 連鎖テキスト（最前面）
  drawChainTexts(ctx);
}

/** ゲームリセット時に全アニメーション状態をクリア */
export function clearAllAnimations(): void {
  particles.length = 0;
  chainTexts.length = 0;
  vanishingCells.length = 0;
  fallingCells.length = 0;
}

export { BOARD_WIDTH, BOARD_HEIGHT };
