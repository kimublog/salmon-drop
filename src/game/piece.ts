import { FallingPiece, Grid, Position } from "@/types/game";
import { SalmonId } from "@/types/salmon";
import { GRID_COLS, GRID_ROWS } from "@/constants/salmonTypes";
import { isEmpty } from "./grid";

/** サブピースの相対位置（rotation: 0=上, 1=右, 2=下, 3=左） */
const ROTATION_OFFSETS: Record<0 | 1 | 2 | 3, { dc: number; dr: number }> = {
  0: { dc: 0, dr: -1 },
  1: { dc: 1, dr: 0 },
  2: { dc: 0, dr: 1 },
  3: { dc: -1, dr: 0 },
};

/** サブピースの絶対位置を取得 */
export function getSubPos(piece: FallingPiece): Position {
  const offset = ROTATION_OFFSETS[piece.rotation];
  return {
    col: piece.pos.col + offset.dc,
    row: piece.pos.row + offset.dr,
  };
}

/** ピースが有効な位置にあるか */
export function isValidPosition(grid: Grid, piece: FallingPiece): boolean {
  const { col, row } = piece.pos;
  const sub = getSubPos(piece);
  return (
    col >= 0 && col < GRID_COLS && row >= 0 && row < GRID_ROWS &&
    sub.col >= 0 && sub.col < GRID_COLS && sub.row >= 0 && sub.row < GRID_ROWS &&
    isEmpty(grid, col, row) && isEmpty(grid, sub.col, sub.row)
  );
}

/** 新しいピースを生成（ボード上部中央から出現） */
export function spawnPiece(salmonIds: SalmonId[]): FallingPiece {
  const pick = () => salmonIds[Math.floor(Math.random() * salmonIds.length)];
  return {
    main: pick(),
    sub: pick(),
    pos: { col: 2, row: 0 },
    rotation: 0,
  };
}

/** 左右移動。成功したら true */
export function movePiece(grid: Grid, piece: FallingPiece, dc: number): boolean {
  const next: FallingPiece = {
    ...piece,
    pos: { col: piece.pos.col + dc, row: piece.pos.row },
  };
  if (isValidPosition(grid, next)) {
    piece.pos.col = next.pos.col;
    return true;
  }
  return false;
}

/** 回転（時計回り）。壁蹴り対応 */
export function rotatePiece(grid: Grid, piece: FallingPiece): boolean {
  const nextRotation = ((piece.rotation + 1) % 4) as 0 | 1 | 2 | 3;
  const candidate: FallingPiece = { ...piece, rotation: nextRotation };

  // そのまま回転できるか
  if (isValidPosition(grid, candidate)) {
    piece.rotation = nextRotation;
    return true;
  }

  // 壁蹴り: 左右に1マスずらす
  for (const kick of [-1, 1]) {
    const kicked: FallingPiece = {
      ...candidate,
      pos: { col: candidate.pos.col + kick, row: candidate.pos.row },
    };
    if (isValidPosition(grid, kicked)) {
      piece.pos.col = kicked.pos.col;
      piece.rotation = nextRotation;
      return true;
    }
  }

  return false;
}

/** 1行下に落とす。成功したら true */
export function dropOne(grid: Grid, piece: FallingPiece): boolean {
  const next: FallingPiece = {
    ...piece,
    pos: { col: piece.pos.col, row: piece.pos.row + 1 },
  };
  if (isValidPosition(grid, next)) {
    piece.pos.row = next.pos.row;
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
    pos: { ...piece.pos },
  };
  while (dropOne(grid, { ...ghost, pos: { ...ghost.pos } })) {
    ghost.pos.row++;
  }
  return ghost;
}
