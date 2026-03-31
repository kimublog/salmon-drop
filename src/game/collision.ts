import { Grid, Position } from "@/types/game";
import { SalmonId } from "@/types/salmon";
import { GRID_COLS, GRID_ROWS } from "@/constants/salmonTypes";

/** 8方向 */
const DIRECTIONS = [
  { dc: 0, dr: -1 },  // 上
  { dc: 0, dr: 1 },   // 下
  { dc: -1, dr: 0 },  // 左
  { dc: 1, dr: 0 },   // 右
  { dc: -1, dr: -1 }, // 左上
  { dc: 1, dr: -1 },  // 右上
  { dc: -1, dr: 1 },  // 左下
  { dc: 1, dr: 1 },   // 右下
];

/**
 * 同じ種類のサーモンで繋がっているグループを探索（BFS）
 * 縦・横・斜めの隣接を探索
 */
function findConnectedGroup(grid: Grid, startCol: number, startRow: number, visited: boolean[][]): Position[] {
  const salmonId = grid[startRow][startCol];
  if (!salmonId) return [];

  const group: Position[] = [];
  const queue: Position[] = [{ col: startCol, row: startRow }];
  visited[startRow][startCol] = true;

  while (queue.length > 0) {
    const { col, row } = queue.shift()!;
    group.push({ col, row });

    for (const { dc, dr } of DIRECTIONS) {
      const nc = col + dc;
      const nr = row + dr;
      if (
        nc >= 0 && nc < GRID_COLS &&
        nr >= 0 && nr < GRID_ROWS &&
        !visited[nr][nc] &&
        grid[nr][nc] === salmonId
      ) {
        visited[nr][nc] = true;
        queue.push({ col: nc, row: nr });
      }
    }
  }

  return group;
}

/**
 * 4つ以上繋がっているグループを全て検出。
 * 返り値: 消すべきセル位置の配列の配列
 */
export function findMatches(grid: Grid): Position[][] {
  const visited: boolean[][] = Array.from({ length: GRID_ROWS }, () =>
    Array.from({ length: GRID_COLS }, () => false)
  );

  const matches: Position[][] = [];

  for (let row = 0; row < GRID_ROWS; row++) {
    for (let col = 0; col < GRID_COLS; col++) {
      if (grid[row][col] !== null && !visited[row][col]) {
        const group = findConnectedGroup(grid, col, row, visited);
        if (group.length >= 4) {
          matches.push(group);
        }
      }
    }
  }

  return matches;
}

/** マッチしたセルを消去。消した個数を返す */
export function removeMatches(grid: Grid, matches: Position[][]): number {
  let count = 0;
  for (const group of matches) {
    for (const { col, row } of group) {
      if (grid[row][col] !== null) {
        grid[row][col] = null;
        count++;
      }
    }
  }
  return count;
}
