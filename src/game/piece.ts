import { FallingPiece, PieceBlock, PieceShape, Grid, Position } from "@/types/game";
import { SalmonId } from "@/types/salmon";
import { GRID_COLS, GRID_ROWS } from "@/constants/salmonTypes";
import { isEmpty } from "./grid";

/** 形状テンプレート: アンカー(0,0)からの相対位置 */
const SHAPE_TEMPLATES: Record<PieceShape, { dc: number; dr: number }[]> = {
  single:    [{ dc: 0, dr: 0 }],
  pair:      [{ dc: 0, dr: 0 }, { dc: 0, dr: -1 }],
  triple_i:  [{ dc: 0, dr: 0 }, { dc: 0, dr: -1 }, { dc: 0, dr: -2 }],
  triple_l:  [{ dc: 0, dr: 0 }, { dc: 0, dr: -1 }, { dc: 1, dr: 0 }],
};

/** ピース内の全ブロックの絶対位置を取得 */
export function getBlockPositions(piece: FallingPiece): Position[] {
  return piece.blocks.map((b) => ({
    col: piece.pos.col + b.dc,
    row: piece.pos.row + b.dr,
  }));
}

/** ピースが有効な位置にあるか */
export function isValidPosition(grid: Grid, piece: FallingPiece): boolean {
  for (const b of piece.blocks) {
    const c = piece.pos.col + b.dc;
    const r = piece.pos.row + b.dr;
    if (c < 0 || c >= GRID_COLS || r >= GRID_ROWS) return false;
    // 上端より上は許可（出現時のため）
    if (r >= 0 && !isEmpty(grid, c, r)) return false;
  }
  return true;
}

/** 出現する形状をランダム選択（重み付き） */
function pickShape(): PieceShape {
  const r = Math.random();
  if (r < 0.50) return "pair";       // 50%
  if (r < 0.65) return "single";     // 15%
  if (r < 0.82) return "triple_i";   // 17%
  return "triple_l";                  // 18%
}

/** 新しいピースを生成 */
export function spawnPiece(salmonIds: SalmonId[]): FallingPiece {
  const pick = () => salmonIds[Math.floor(Math.random() * salmonIds.length)];
  const shape = pickShape();
  const template = SHAPE_TEMPLATES[shape];

  const blocks: PieceBlock[] = template.map((t) => ({
    salmonId: pick(),
    dc: t.dc,
    dr: t.dr,
  }));

  return {
    blocks,
    pos: { col: 2, row: 0 },
    shape,
  };
}

/** 左右移動。成功したら true */
export function movePiece(grid: Grid, piece: FallingPiece, dc: number): boolean {
  const candidate: FallingPiece = {
    ...piece,
    pos: { col: piece.pos.col + dc, row: piece.pos.row },
  };
  if (isValidPosition(grid, candidate)) {
    piece.pos.col = candidate.pos.col;
    return true;
  }
  return false;
}

/** 回転（時計回り）: (dc, dr) → (-dr, dc)。壁蹴り対応 */
export function rotatePiece(grid: Grid, piece: FallingPiece): boolean {
  if (piece.shape === "single") return true; // 回転不要

  const rotatedBlocks = piece.blocks.map((b) => ({
    ...b,
    dc: -b.dr,
    dr: b.dc,
  }));

  // そのまま回転
  const candidate: FallingPiece = { ...piece, blocks: rotatedBlocks };
  if (isValidPosition(grid, candidate)) {
    piece.blocks = rotatedBlocks;
    return true;
  }

  // 壁蹴り: 左右に1〜2マスずらす
  for (const kick of [-1, 1, -2, 2]) {
    const kicked: FallingPiece = {
      ...candidate,
      pos: { col: candidate.pos.col + kick, row: candidate.pos.row },
    };
    if (isValidPosition(grid, kicked)) {
      piece.blocks = rotatedBlocks;
      piece.pos.col = kicked.pos.col;
      return true;
    }
  }

  // 上に1マスずらす
  const upKick: FallingPiece = {
    ...candidate,
    pos: { col: candidate.pos.col, row: candidate.pos.row - 1 },
  };
  if (isValidPosition(grid, upKick)) {
    piece.blocks = rotatedBlocks;
    piece.pos.row = upKick.pos.row;
    return true;
  }

  return false;
}

/** 1行下に落とす。成功したら true */
export function dropOne(grid: Grid, piece: FallingPiece): boolean {
  const candidate: FallingPiece = {
    ...piece,
    pos: { col: piece.pos.col, row: piece.pos.row + 1 },
  };
  if (isValidPosition(grid, candidate)) {
    piece.pos.row = candidate.pos.row;
    return true;
  }
  return false;
}

/** ハードドロップ: 一番下まで落とす */
export function hardDrop(grid: Grid, piece: FallingPiece): void {
  while (dropOne(grid, piece)) {
    // 着地するまで繰り返す
  }
}

/** ゴースト位置を取得 */
export function getGhostPosition(grid: Grid, piece: FallingPiece): FallingPiece {
  const ghost: FallingPiece = {
    ...piece,
    blocks: piece.blocks.map((b) => ({ ...b })),
    pos: { ...piece.pos },
  };
  while (true) {
    const next: FallingPiece = {
      ...ghost,
      pos: { col: ghost.pos.col, row: ghost.pos.row + 1 },
    };
    if (!isValidPosition(grid, next)) break;
    ghost.pos.row = next.pos.row;
  }
  return ghost;
}

