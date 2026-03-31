import { GameState, Grid, FallingPiece, GameScore, Position } from "@/types/game";
import { SalmonId } from "@/types/salmon";
import { Difficulty } from "@/types/difficulty";
import { SALMON_TYPES, GRID_COLS, GRID_ROWS } from "@/constants/salmonTypes";
import { DIFFICULTIES } from "@/constants/difficulties";
import { createGrid, setCell, applyGravity, isEmpty } from "./grid";
import { spawnPiece, movePiece, rotatePiece, dropOne, hardDrop, getBlockPositions, getGhostPosition } from "./piece";
import { findMatches, removeMatches } from "./collision";
import { getBaseScore, getChainMultiplier } from "@/constants/scoring";
import {
  render, preloadImages, spawnParticles, showChainText,
  addVanishingCells, hasVanishingCells,
  addFallingCells, hasFallingCells,
  resetSmoothPos,
  BOARD_WIDTH, BOARD_HEIGHT,
} from "./renderer";

export interface GameEngine {
  start: (difficultyId: string) => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
  handleInput: (action: InputAction) => void;
  getState: () => GameState;
  getScore: () => GameScore;
  getDifficulty: () => Difficulty | null;
  destroy: () => void;
  onStateChange?: (state: GameState) => void;
  onScoreChange?: (score: GameScore) => void;
  onChain?: (chainCount: number) => void;
}

export type InputAction = "left" | "right" | "rotate" | "soft_drop" | "hard_drop";

/**
 * アニメーションフェーズ:
 * - "idle": 通常操作中
 * - "vanishing": 消滅アニメーション再生中
 * - "falling": 重力落下アニメーション再生中
 * - "checking": 次のマッチを探す
 */
type AnimPhase = "idle" | "vanishing" | "falling" | "checking";

export function createGameEngine(canvas: HTMLCanvasElement): GameEngine {
  const ctx = canvas.getContext("2d")!;
  canvas.width = BOARD_WIDTH;
  canvas.height = BOARD_HEIGHT;

  let state: GameState = "title";
  let grid: Grid = createGrid();
  let currentPiece: FallingPiece | null = null;
  let nextPiece: FallingPiece | null = null;
  let score: GameScore = { score: 0, chainCount: 0, maxChain: 0 };
  let difficulty: Difficulty | null = null;
  let activeSalmonIds: SalmonId[] = [];

  let dropInterval = 800;
  let lastDropTime = 0;
  let lastSpeedUpTime = 0;
  let animationId = 0;

  // アニメーション状態
  let animPhase: AnimPhase = "idle";
  let currentChainCount = 0;
  let pendingParticles: { col: number; row: number; salmonId: SalmonId }[] = [];

  let onStateChange: ((s: GameState) => void) | undefined;
  let onScoreChange: ((s: GameScore) => void) | undefined;
  let onChain: ((chain: number) => void) | undefined;

  function setState(newState: GameState): void {
    state = newState;
    onStateChange?.(state);
  }

  function setScore(newScore: Partial<GameScore>): void {
    score = { ...score, ...newScore };
    onScoreChange?.(score);
  }

  /** 連鎖チェック：マッチがあれば消滅アニメ開始、なければ次のピースへ */
  function checkAndStartChain(): void {
    const matches = findMatches(grid);
    if (matches.length === 0) {
      // 連鎖終了 → 次のピースへ
      if (currentChainCount > 0) {
        onChain?.(currentChainCount);
      }
      currentChainCount = 0;

      // ゲームオーバー判定
      if (!isEmpty(grid, 2, 0) || !isEmpty(grid, 3, 0)) {
        setState("gameover");
        return;
      }

      // 次のピース
      currentPiece = nextPiece;
      nextPiece = spawnPiece(activeSalmonIds);
      if (currentPiece) {
        resetSmoothPos(currentPiece.pos.col, currentPiece.pos.row);
      }
      animPhase = "idle";
      lastDropTime = performance.now();
      return;
    }

    // マッチあり → 連鎖カウント増加
    currentChainCount++;

    // 消滅セルを記録してアニメ開始
    const vanishCells: { col: number; row: number; salmonId: SalmonId }[] = [];
    let removedCount = 0;

    for (const group of matches) {
      for (const { col, row } of group) {
        const sid = grid[row][col];
        if (sid) {
          vanishCells.push({ col, row, salmonId: sid });
        }
      }
      removedCount += group.reduce((n, { col, row }) => n + (grid[row][col] ? 1 : 0), 0);
    }

    // スコア加算
    for (const group of matches) {
      const count = group.length;
      const scoreAdd = getBaseScore(count) * getChainMultiplier(currentChainCount);
      setScore({
        score: score.score + scoreAdd,
        chainCount: score.chainCount + 1,
        maxChain: Math.max(score.maxChain, currentChainCount),
      });
    }

    // 消滅アニメ登録
    addVanishingCells(vanishCells);
    pendingParticles = vanishCells;

    // 連鎖テキスト表示
    showChainText(currentChainCount);

    // グリッドから消去（描画は vanishingCells が担当）
    removeMatches(grid, matches);

    animPhase = "vanishing";
  }

  /** 重力落下をアニメーション付きで実行 */
  function startGravityAnimation(): void {
    // 落下前の状態を記録
    const fallCells: { col: number; fromRow: number; toRow: number; salmonId: SalmonId }[] = [];

    for (let col = 0; col < GRID_COLS; col++) {
      // 各列で下から詰める
      let writeRow = GRID_ROWS - 1;
      for (let row = GRID_ROWS - 1; row >= 0; row--) {
        if (grid[row][col] !== null) {
          if (row !== writeRow) {
            fallCells.push({
              col,
              fromRow: row,
              toRow: writeRow,
              salmonId: grid[row][col]!,
            });
          }
          writeRow--;
        }
      }
    }

    // グリッドに重力適用
    applyGravity(grid);

    if (fallCells.length > 0) {
      addFallingCells(fallCells);
      animPhase = "falling";
    } else {
      // 落下なし → すぐに次のチェック
      animPhase = "checking";
    }
  }

  /** ピースをグリッドに固定 → 連鎖チェック開始 */
  function lockPiece(): void {
    if (!currentPiece) return;
    const positions = getBlockPositions(currentPiece);
    for (let i = 0; i < currentPiece.blocks.length; i++) {
      const p = positions[i];
      if (p.row >= 0) {
        setCell(grid, p.col, p.row, currentPiece.blocks[i].salmonId);
      }
    }
    currentPiece = null;

    // まず重力を適用してから連鎖チェック
    currentChainCount = 0;
    startGravityAnimation();
  }

  /** ゲームループ */
  function gameLoop(timestamp: number): void {
    if (state === "gameover") {
      renderFrame();
      return;
    }

    if (state === "paused") {
      renderFrame();
      animationId = requestAnimationFrame(gameLoop);
      return;
    }

    if (state === "playing") {
      switch (animPhase) {
        case "idle":
          // 通常操作: 自動落下
          if (difficulty && timestamp - lastSpeedUpTime >= difficulty.speedUpInterval) {
            dropInterval = Math.max(100, dropInterval * difficulty.speedUpRate);
            lastSpeedUpTime = timestamp;
          }
          if (timestamp - lastDropTime >= dropInterval) {
            if (currentPiece) {
              if (!dropOne(grid, currentPiece)) {
                lockPiece();
              }
            }
            lastDropTime = timestamp;
          }
          break;

        case "vanishing":
          // 消滅アニメ完了を待つ
          if (!hasVanishingCells()) {
            // パーティクル生成（消滅完了後に弾ける）
            for (const cell of pendingParticles) {
              spawnParticles(cell.col, cell.row, cell.salmonId);
            }
            pendingParticles = [];
            startGravityAnimation();
          }
          break;

        case "falling":
          // 落下アニメ完了を待つ
          if (!hasFallingCells()) {
            animPhase = "checking";
          }
          break;

        case "checking":
          // 次の連鎖チェック
          checkAndStartChain();
          break;
      }
    }

    renderFrame();
    animationId = requestAnimationFrame(gameLoop);
  }

  function renderFrame(): void {
    const ghost = currentPiece ? getGhostPosition(grid, currentPiece) : null;
    render(ctx, grid, currentPiece, ghost);
  }

  const engine: GameEngine = {
    start(difficultyId: string) {
      difficulty = DIFFICULTIES.find((d) => d.id === difficultyId) || DIFFICULTIES[1];
      activeSalmonIds = SALMON_TYPES.slice(0, difficulty.salmonCount).map((s) => s.id);

      grid = createGrid();
      score = { score: 0, chainCount: 0, maxChain: 0 };
      dropInterval = difficulty.initialSpeed;
      lastDropTime = performance.now();
      lastSpeedUpTime = performance.now();
      animPhase = "idle";
      currentChainCount = 0;

      currentPiece = spawnPiece(activeSalmonIds);
      nextPiece = spawnPiece(activeSalmonIds);
      if (currentPiece) {
        resetSmoothPos(currentPiece.pos.col, currentPiece.pos.row);
      }

      setState("playing");
      onScoreChange?.(score);
      animationId = requestAnimationFrame(gameLoop);
    },

    pause() {
      if (state === "playing") setState("paused");
    },

    resume() {
      if (state === "paused") {
        setState("playing");
        lastDropTime = performance.now();
        animationId = requestAnimationFrame(gameLoop);
      }
    },

    reset() {
      cancelAnimationFrame(animationId);
      grid = createGrid();
      currentPiece = null;
      nextPiece = null;
      score = { score: 0, chainCount: 0, maxChain: 0 };
      animPhase = "idle";
      currentChainCount = 0;
      setState("title");
    },

    handleInput(action: InputAction) {
      // アニメ中は操作無効
      if (state !== "playing" || !currentPiece || animPhase !== "idle") return;

      switch (action) {
        case "left":
          movePiece(grid, currentPiece, -1);
          break;
        case "right":
          movePiece(grid, currentPiece, 1);
          break;
        case "rotate":
          rotatePiece(grid, currentPiece);
          break;
        case "soft_drop":
          if (!dropOne(grid, currentPiece)) {
            lockPiece();
          }
          lastDropTime = performance.now();
          break;
        case "hard_drop":
          hardDrop(grid, currentPiece);
          lockPiece();
          break;
      }
    },

    getState: () => state,
    getScore: () => score,
    getDifficulty: () => difficulty,
    destroy() {
      cancelAnimationFrame(animationId);
    },

    set onStateChange(fn: ((s: GameState) => void) | undefined) {
      onStateChange = fn;
    },
    set onScoreChange(fn: ((s: GameScore) => void) | undefined) {
      onScoreChange = fn;
    },
    set onChain(fn: ((chain: number) => void) | undefined) {
      onChain = fn;
    },
  };

  return engine;
}

export { preloadImages, BOARD_WIDTH, BOARD_HEIGHT };
