"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { GameEngine, createGameEngine, preloadImages, InputAction } from "@/game/engine";
import { GameState, GameScore } from "@/types/game";

export function useGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const [gameState, setGameState] = useState<GameState>("title");
  const [score, setScore] = useState<GameScore>({ score: 0, chainCount: 0, maxChain: 0 });
  const [chainPopup, setChainPopup] = useState<number>(0);
  const [imagesReady, setImagesReady] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);

  // 画像プリロード
  useEffect(() => {
    preloadImages((loaded, total) => {
      setLoadProgress(Math.round((loaded / total) * 100));
    }).then(() => {
      setImagesReady(true);
    });
  }, []);

  // エンジン初期化
  useEffect(() => {
    if (!canvasRef.current || !imagesReady) return;

    const engine = createGameEngine(canvasRef.current);
    engine.onStateChange = setGameState;
    engine.onScoreChange = setScore;
    engine.onChain = (chain: number) => {
      setChainPopup(chain);
      setTimeout(() => setChainPopup(0), 1500);
    };
    engineRef.current = engine;

    return () => {
      engine.destroy();
    };
  }, [imagesReady]);

  // キーボード入力
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const engine = engineRef.current;
      if (!engine) return;

      const keyMap: Record<string, InputAction> = {
        ArrowLeft: "left",
        ArrowRight: "right",
        ArrowUp: "rotate",
        ArrowDown: "soft_drop",
        " ": "hard_drop",
      };

      const action = keyMap[e.key];
      if (action) {
        e.preventDefault();
        engine.handleInput(action);
      }

      // Pause/Resume
      if (e.key === "Escape" || e.key === "p") {
        if (engine.getState() === "playing") {
          engine.pause();
        } else if (engine.getState() === "paused") {
          engine.resume();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const startGame = useCallback((difficultyId: string) => {
    engineRef.current?.start(difficultyId);
  }, []);

  const pauseGame = useCallback(() => {
    engineRef.current?.pause();
  }, []);

  const resumeGame = useCallback(() => {
    engineRef.current?.resume();
  }, []);

  const resetGame = useCallback(() => {
    engineRef.current?.reset();
  }, []);

  const handleInput = useCallback((action: InputAction) => {
    engineRef.current?.handleInput(action);
  }, []);

  return {
    canvasRef,
    gameState,
    score,
    chainPopup,
    imagesReady,
    loadProgress,
    startGame,
    pauseGame,
    resumeGame,
    resetGame,
    handleInput,
  };
}
