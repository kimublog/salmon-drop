import { Grid } from "@/types/game";
import { findMatches, removeMatches } from "./collision";
import { applyGravity } from "./grid";
import { getBaseScore, getChainMultiplier } from "@/constants/scoring";

export interface ChainResult {
  totalScore: number;
  chainCount: number;
  /** 各連鎖で消えたセル数 */
  stepsRemoved: number[];
}

/**
 * 連鎖処理を一括実行。
 * グリッドを直接変更し、合計スコアと連鎖数を返す。
 */
export function resolveChains(grid: Grid): ChainResult {
  let chainCount = 0;
  let totalScore = 0;
  const stepsRemoved: number[] = [];

  while (true) {
    const matches = findMatches(grid);
    if (matches.length === 0) break;

    chainCount++;
    let removedThisStep = 0;

    for (const group of matches) {
      const count = removeMatches(grid, [group]);
      removedThisStep += count;
      totalScore += getBaseScore(count) * getChainMultiplier(chainCount);
    }

    stepsRemoved.push(removedThisStep);
    applyGravity(grid);
  }

  return { totalScore, chainCount, stepsRemoved };
}
