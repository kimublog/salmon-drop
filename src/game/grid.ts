import { Cell, Grid } from "@/types/game";
import { GRID_COLS, GRID_ROWS } from "@/constants/salmonTypes";

/** 空のグリッドを生成 */
export function createGrid(): Grid {
  return Array.from({ length: GRID_ROWS }, () =>
    Array.from({ length: GRID_COLS }, () => null)
  );
}

/** グリッドのセルを取得（範囲外は null） */
export function getCell(grid: Grid, col: number, row: number): Cell {
  if (row < 0 || row >= GRID_ROWS || col < 0 || col >= GRID_COLS) return null;
  return grid[row][col];
}

/** グリッドにセルを設定 */
export function setCell(grid: Grid, col: number, row: number, value: Cell): void {
  if (row >= 0 && row < GRID_ROWS && col >= 0 && col < GRID_COLS) {
    grid[row][col] = value;
  }
}

/** セルが空かどうか */
export function isEmpty(grid: Grid, col: number, row: number): boolean {
  if (col < 0 || col >= GRID_COLS || row < 0 || row >= GRID_ROWS) return false;
  return grid[row][col] === null;
}

/** 重力落下: 浮いているサーモンを下に落とす。変化があれば true */
export function applyGravity(grid: Grid): boolean {
  let moved = false;
  for (let col = 0; col < GRID_COLS; col++) {
    let writeRow = GRID_ROWS - 1;
    for (let row = GRID_ROWS - 1; row >= 0; row--) {
      if (grid[row][col] !== null) {
        if (row !== writeRow) {
          grid[writeRow][col] = grid[row][col];
          grid[row][col] = null;
          moved = true;
        }
        writeRow--;
      }
    }
  }
  return moved;
}
