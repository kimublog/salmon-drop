"use client";

import { useState } from "react";
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

  // ゲームオーバー検知
  if (gameState === "gameover" && screen === "game") {
    // 少し遅延してリザルト画面へ
    setTimeout(() => setScreen("result"), 500);
  }

  // ローディング
  if (!imagesReady) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-[#0D3B66] to-[#1B4F72] text-white">
        <p className="text-xl mb-4">サーモンを準備中...</p>
        <div className="w-64 h-3 bg-white/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#E74C3C] rounded-full transition-all duration-300"
            style={{ width: `${loadProgress}%` }}
          />
        </div>
        <p className="text-sm mt-2 text-blue-300">{loadProgress}%</p>
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
