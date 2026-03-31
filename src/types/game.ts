import { SalmonId } from "./salmon";

export type GameState = "title" | "selecting" | "playing" | "paused" | "gameover";

export type Cell = SalmonId | null;

export type Grid = Cell[][];

export interface Position {
  col: number;
  row: number;
}

/** ピース内の1ブロック（アンカーからの相対位置） */
export interface PieceBlock {
  salmonId: SalmonId;
  dc: number;
  dr: number;
}

/** ピースの形状タイプ */
export type PieceShape = "single" | "pair" | "triple_i" | "triple_l";

/** 落下中の組ピース（1〜3ブロック） */
export interface FallingPiece {
  blocks: PieceBlock[];
  /** アンカー位置 */
  pos: Position;
  shape: PieceShape;
}

export interface GameScore {
  score: number;
  chainCount: number;
  maxChain: number;
}
