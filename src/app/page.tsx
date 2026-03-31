"use client";

import { useState, useEffect, useRef } from "react";
import { useGame } from "@/hooks/useGame";
import { DIFFICULTIES } from "@/constants/difficulties";
import TitleScreen from "@/components/TitleScreen";
import DifficultySelect from "@/components/DifficultySelect";
import GameBoard from "@/components/GameBoard";
import ResultScreen from "@/components/ResultScreen";

export default function Home() {
  const {
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
  } = useGame();

  const [screen, setScreen] = useState<"title" | "select" | "game" | "result">("title");
  const [selectedDifficulty, setSelectedDifficulty] = useState("normal");
  const gameOverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ゲームオーバー検知（useEffectで1回だけ発火）
  useEffect(() => {
    if (gameState === "gameover" && screen === "game") {
      if (gameOverTimerRef.current) return; // 既にタイマーが走っている
      gameOverTimerRef.current = setTimeout(() => {
        setScreen("result");
        gameOverTimerRef.current = null;
      }, 500);
    }
    return () => {
      if (gameOverTimerRef.current && gameState !== "gameover") {
        clearTimeout(gameOverTimerRef.current);
        gameOverTimerRef.current = null;
      }
    };
  }, [gameState, screen]);

  // ローディング
  if (!imagesReady) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-[#FFF0EC] to-[#FFE0D6] text-[#3D2C2C]">
        <p className="text-xl mb-4">サーモンを準備中...</p>
        <div className="w-64 h-3 bg-white/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#E74C3C] rounded-full transition-all duration-300"
            style={{ width: `${loadProgress}%` }}
          />
        </div>
        <p className="text-sm mt-2 text-[#A08080]">{loadProgress}%</p>
      </div>
    );
  }

  const difficulty = DIFFICULTIES.find((d) => d.id === selectedDifficulty) || DIFFICULTIES[1];

  return (
    <>
      {/* Canvas は常にレンダリング（非表示でもエンジンが使えるように） */}
      <div className={screen === "game" ? "" : "hidden"}>
        <GameBoard
          canvasRef={canvasRef}
          score={score}
          chainPopup={chainPopup}
          isPaused={gameState === "paused"}
          onPause={pauseGame}
          onResume={resumeGame}
          onInput={handleInput}
          onBackToTitle={() => {
            resetGame();
            setScreen("title");
          }}
          difficultyName={difficulty.name}
        />
      </div>

      {screen === "title" && (
        <TitleScreen onStart={() => setScreen("select")} />
      )}

      {screen === "select" && (
        <DifficultySelect
          onSelect={(id) => {
            setSelectedDifficulty(id);
            setScreen("game");
            startGame(id);
          }}
          onBack={() => setScreen("title")}
        />
      )}

      {screen === "result" && (
        <ResultScreen
          score={score}
          difficultyId={selectedDifficulty}
          difficultyName={difficulty.name}
          onRetry={() => {
            setScreen("game");
            startGame(selectedDifficulty);
          }}
          onSelectDifficulty={() => {
            resetGame();
            setScreen("select");
          }}
        />
      )}
    </>
  );
}
