/** 消した個数に応じた基本スコア */
export function getBaseScore(count: number): number {
  if (count < 4) return 0;
  if (count === 4) return 100;
  if (count === 5) return 200;
  return 300 + (count - 6) * 100;
}

/** 連鎖倍率 */
export function getChainMultiplier(chain: number): number {
  return Math.max(1, chain);
}

/** サーモン力の称号 */
export function getTitle(score: number): string {
  if (score >= 30000) return "サーモン神";
  if (score >= 10000) return "サーモン大将軍";
  if (score >= 5000) return "サーモンマエストロ";
  if (score >= 1000) return "一人前のサーモン職人";
  return "サーモン見習い";
}
