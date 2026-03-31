"use client";

import { RefObject } from "react";
import { GameScore } from "@/types/game";
import { InputAction } from "@/game/engine";
import { BOARD_WIDTH, BOARD_HEIGHT } from "@/game/renderer";

interface GameBoardProps {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  score: GameScore;
  chainPopup: number;
  isPaused: boolean;
  onPause: () => void;
  onResume: () => void;
  onInput: (action: InputAction) => void;
  onBackToTitle: () => void;
  difficultyName: string;
}

export default function GameBoard({
  canvasRef,
  score,
  chainPopup,
  isPaused,
  onPause,
  onResume,
  onInput,
  onBackToTitle,
  difficultyName,
}: GameBoardProps) {
  return (
    <div className="flex flex-col lg:flex-row items-center justify-center min-h-screen bg-gradient-to-b from-[#0D3B66] to-[#1B4F72] text-white gap-6 p-4">
      {/* サイドパネル左 */}
      <div className="hidden lg:flex flex-col items-center gap-4">
        <div className="px-4 py-2 bg-white/10 rounded-lg text-sm">
          {difficultyName}
        </div>
      </div>

      {/* ゲームボード */}
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={BOARD_WIDTH}
          height={BOARD_HEIGHT}
          className="rounded-xl shadow-2xl border-2 border-white/20"
          style={{ width: BOARD_WIDTH, height: BOARD_HEIGHT }}
        />

        {/* 連鎖ポップアップ */}
        {chainPopup > 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-5xl font-bold text-yellow-300 animate-ping-once drop-shadow-lg">
              {chainPopup >= 4
                ? "EXCELLENT!"
                : chainPopup >= 3
                  ? "GREAT!"
                  : chainPopup >= 2
                    ? "NICE!"
                    : `${chainPopup}連鎖!`}
            </div>
          </div>
        )}

        {/* ポーズオーバーレイ */}
        {isPaused && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-xl">
            <div className="text-center flex flex-col gap-3">
              <p className="text-3xl font-bold mb-2">PAUSE</p>
              <button
                onClick={onResume}
                className="px-8 py-3 bg-[#E74C3C] rounded-lg text-lg font-bold hover:bg-[#C0392B] transition-colors"
              >
                再開
              </button>
              <button
                onClick={onBackToTitle}
                className="px-8 py-3 bg-white/20 rounded-lg text-sm hover:bg-white/30 transition-colors"
              >
                トップへ戻る
              </button>
            </div>
          </div>
        )}
      </div>

      {/* サイドパネル右 */}
      <div className="flex lg:flex-col items-center gap-4">
        <div className="text-center px-6 py-4 bg-white/10 rounded-xl min-w-[120px]">
          <p className="text-sm text-blue-300">SCORE</p>
          <p className="text-3xl font-bold text-orange-300">{score.score.toLocaleString()}</p>
        </div>
        <div className="text-center px-6 py-4 bg-white/10 rounded-xl min-w-[120px]">
          <p className="text-sm text-blue-300">MAX CHAIN</p>
          <p className="text-2xl font-bold">{score.maxChain}</p>
        </div>
        <button
          onClick={isPaused ? onResume : onPause}
          className="px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors text-sm"
        >
          {isPaused ? "再開" : "一時停止"}
        </button>
      </div>

      {/* モバイル操作ボタン */}
      <div className="lg:hidden flex gap-3 mt-4">
        <button
          onTouchStart={() => onInput("left")}
          onClick={() => onInput("left")}
          className="w-14 h-14 bg-white/20 rounded-xl text-2xl active:bg-white/40"
        >
          ←
        </button>
        <button
          onTouchStart={() => onInput("rotate")}
          onClick={() => onInput("rotate")}
          className="w-14 h-14 bg-white/20 rounded-xl text-2xl active:bg-white/40"
        >
          ↻
        </button>
        <button
          onTouchStart={() => onInput("soft_drop")}
          onClick={() => onInput("soft_drop")}
          className="w-14 h-14 bg-white/20 rounded-xl text-2xl active:bg-white/40"
        >
          ↓
        </button>
        <button
          onTouchStart={() => onInput("right")}
          onClick={() => onInput("right")}
          className="w-14 h-14 bg-white/20 rounded-xl text-2xl active:bg-white/40"
        >
          →
        </button>
        <button
          onTouchStart={() => onInput("hard_drop")}
          onClick={() => onInput("hard_drop")}
          className="w-14 h-14 bg-[#E74C3C]/60 rounded-xl text-lg active:bg-[#E74C3C]/80"
        >
          DROP
        </button>
      </div>
    </div>
  );
}
