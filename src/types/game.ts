import { SalmonId } from "./salmon";

export type GameState = "title" | "selecting" | "playing" | "paused" | "gameover";

export type Cell = SalmonId | null;

export type Grid = Cell[][];

export interface Position {
  col: number;
  row: number;
}

/** 落下中の組ピース（メイン + サブ） */
export interface FallingPiece {
  main: SalmonId;
  sub: SalmonId;
  /** メイン位置 */
  pos: Position;
  /** サブの方向（0=上, 1=右, 2=下, 3=左） */
  rotation: 0 | 1 | 2 | 3;
}

export interface GameScore {
  score: number;
  chainCount: number;
  maxChain: number;
}
