import { GameState, Grid, FallingPiece, GameScore } from "@/types/game";
import { SalmonId } from "@/types/salmon";
import { Difficulty } from "@/types/difficulty";
import { SALMON_TYPES, GRID_COLS } from "@/constants/salmonTypes";
import { DIFFICULTIES } from "@/constants/difficulties";
import { createGrid, setCell, applyGravity, isEmpty } from "./grid";
import { spawnPiece, movePiece, rotatePiece, dropOne, hardDrop, getSubPos, getGhostPosition } from "./piece";
import { resolveChains } from "./chain";
import { render, preloadImages, BOARD_WIDTH, BOARD_HEIGHT } from "./renderer";

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
  let gameStartTime = 0;
  let lastSpeedUpTime = 0;
  let animationId = 0;

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

  /** ピースをグリッドに固定 */
  function lockPiece(): void {
    if (!currentPiece) return;
    setCell(grid, currentPiece.pos.col, currentPiece.pos.row, currentPiece.main);
    const sub = getSubPos(currentPiece);
    setCell(grid, sub.col, sub.row, currentPiece.sub);

    // 連鎖処理
    const result = resolveChains(grid);
    if (result.chainCount > 0) {
      setScore({
        score: score.score + result.totalScore,
        chainCount: score.chainCount + result.chainCount,
        maxChain: Math.max(score.maxChain, result.chainCount),
      });
      onChain?.(result.chainCount);
    }

    // ゲームオーバー判定: 3列目（index 2）の最上行にサーモンがあるか
    if (!isEmpty(grid, 2, 0) || !isEmpty(grid, 3, 0)) {
      setState("gameover");
      return;
    }

    // 次のピースを出す
    currentPiece = nextPiece;
    nextPiece = spawnPiece(activeSalmonIds);
  }

  /** ゲームループ */
  function gameLoop(timestamp: number): void {
    if (state !== "playing") {
      renderFrame();
      if (state !== "gameover") {
        animationId = requestAnimationFrame(gameLoop);
      } else {
        renderFrame();
      }
      return;
    }

    // 速度アップ
    if (difficulty && timestamp - lastSpeedUpTime >= difficulty.speedUpInterval) {
      dropInterval = Math.max(100, dropInterval * difficulty.speedUpRate);
      lastSpeedUpTime = timestamp;
    }

    // 自動落下
    if (timestamp - lastDropTime >= dropInterval) {
      if (currentPiece) {
        if (!dropOne(grid, currentPiece)) {
          lockPiece();
        }
      }
      lastDropTime = timestamp;
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
      gameStartTime = performance.now();
      lastSpeedUpTime = performance.now();

      currentPiece = spawnPiece(activeSalmonIds);
      nextPiece = spawnPiece(activeSalmonIds);

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
      setState("title");
    },

    handleInput(action: InputAction) {
      if (state !== "playing" || !currentPiece) return;

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
