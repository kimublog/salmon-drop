import { Grid, Position } from "@/types/game";
import { SalmonId } from "@/types/salmon";
import { findMatches, removeMatches } from "./collision";
import { applyGravity } from "./grid";
import { getBaseScore, getChainMultiplier } from "@/constants/scoring";

export interface RemovedCell {
  col: number;
  row: number;
  salmonId: SalmonId;
}

export interface ChainResult {
  totalScore: number;
  chainCount: number;
  /** 各連鎖で消えたセル数 */
  stepsRemoved: number[];
  /** 消滅したセルの一覧（パーティクル生成用） */
  removedCells: RemovedCell[];
}

/**
 * 連鎖処理を一括実行。
 * グリッドを直接変更し、合計スコアと連鎖数を返す。
 */
export function resolveChains(grid: Grid): ChainResult {
  let chainCount = 0;
  let totalScore = 0;
  const stepsRemoved: number[] = [];
  const removedCells: RemovedCell[] = [];

  while (true) {
    const matches = findMatches(grid);
    if (matches.length === 0) break;

    chainCount++;
    let removedThisStep = 0;

    for (const group of matches) {
      // 消す前にサーモンIDを記録
      for (const { col, row } of group) {
        const salmonId = grid[row][col];
        if (salmonId) {
          removedCells.push({ col, row, salmonId });
        }
      }

      const count = removeMatches(grid, [group]);
      removedThisStep += count;
      totalScore += getBaseScore(count) * getChainMultiplier(chainCount);
    }

    stepsRemoved.push(removedThisStep);
    applyGravity(grid);
  }

  return { totalScore, chainCount, stepsRemoved, removedCells };
}
