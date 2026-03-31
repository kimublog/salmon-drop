"use client";

import { RefObject, useCallback } from "react";
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
  // タッチイベントのみで処理し、onClickとの二重発火を防ぐ
  const handleTouch = useCallback((action: InputAction) => {
    return (e: React.TouchEvent | React.MouseEvent) => {
      e.preventDefault();
      onInput(action);
    };
  }, [onInput]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[100dvh] bg-gradient-to-b from-[#FFF0EC] to-[#FFE0D6] text-[#3D2C2C] p-2 sm:p-4 overflow-hidden">
      {/* 上部: 難易度 + スコア + 一時停止（モバイル横並び） */}
      <div className="flex items-center gap-3 mb-2 w-full max-w-md justify-center lg:hidden">
        <div className="px-3 py-1 bg-[#E8C4B8]/30 rounded-lg text-xs">
          {difficultyName}
        </div>
        <div className="text-center px-3 py-1 bg-[#E8C4B8]/30 rounded-lg">
          <span className="text-xs text-[#A08080] mr-1">SCORE</span>
          <span className="text-lg font-bold text-orange-300">{score.score.toLocaleString()}</span>
        </div>
        <div className="text-center px-3 py-1 bg-[#E8C4B8]/30 rounded-lg">
          <span className="text-xs text-[#A08080] mr-1">連鎖</span>
          <span className="text-lg font-bold">{score.maxChain}</span>
        </div>
        <button
          onClick={isPaused ? onResume : onPause}
          className="px-3 py-1 bg-[#E8C4B8]/40 rounded-lg text-xs"
        >
          {isPaused ? "再開" : "||"}
        </button>
      </div>

      {/* メインエリア: PC=横並び */}
      <div className="flex flex-col lg:flex-row items-center justify-center gap-4">
        {/* サイドパネル左（PCのみ） */}
        <div className="hidden lg:flex flex-col items-center gap-4">
          <div className="px-4 py-2 bg-[#E8C4B8]/30 rounded-lg text-sm">
            {difficultyName}
          </div>
        </div>

        {/* ゲームボード */}
        <div className="relative">
          <canvas
            ref={canvasRef}
            width={BOARD_WIDTH}
            height={BOARD_HEIGHT}
            className="rounded-xl shadow-2xl border-2 border-[#E8C4B8]/50 max-w-[90vw] max-h-[55dvh] lg:max-h-[80vh]"
            style={{
              width: BOARD_WIDTH,
              height: BOARD_HEIGHT,
              objectFit: "contain",
            }}
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
                  className="px-8 py-3 bg-[#E8C4B8]/40 rounded-lg text-sm hover:bg-white/30 transition-colors"
                >
                  トップへ戻る
                </button>
              </div>
            </div>
          )}
        </div>

        {/* サイドパネル右（PCのみ） */}
        <div className="hidden lg:flex flex-col items-center gap-4">
          <div className="text-center px-6 py-4 bg-[#E8C4B8]/30 rounded-xl min-w-[120px]">
            <p className="text-sm text-[#A08080]">SCORE</p>
            <p className="text-3xl font-bold text-orange-300">{score.score.toLocaleString()}</p>
          </div>
          <div className="text-center px-6 py-4 bg-[#E8C4B8]/30 rounded-xl min-w-[120px]">
            <p className="text-sm text-[#A08080]">MAX CHAIN</p>
            <p className="text-2xl font-bold">{score.maxChain}</p>
          </div>
          <button
            onClick={isPaused ? onResume : onPause}
            className="px-4 py-2 bg-[#E8C4B8]/40 rounded-lg hover:bg-white/30 transition-colors text-sm"
          >
            {isPaused ? "再開" : "一時停止"}
          </button>
        </div>
      </div>

      {/* モバイル操作ボタン */}
      <div className="lg:hidden mt-3 flex flex-col items-center gap-2 w-full max-w-sm select-none">
        {/* 操作説明 */}
        <p className="text-xs text-[#A08080]/70 mb-1">同じサーモンを4つ以上つなげて消そう</p>

        <div className="flex items-center gap-2 w-full justify-center">
          {/* 左: 移動ボタン */}
          <div className="flex gap-2">
            <button
              onTouchStart={handleTouch("left")}
              className="w-16 h-16 bg-[#E8C4B8]/40 rounded-2xl text-2xl active:bg-[#E8C4B8]/60 flex flex-col items-center justify-center touch-manipulation"
            >
              <span className="text-xl">←</span>
              <span className="text-[10px] text-[#A08080]">左</span>
            </button>
            <button
              onTouchStart={handleTouch("right")}
              className="w-16 h-16 bg-[#E8C4B8]/40 rounded-2xl text-2xl active:bg-[#E8C4B8]/60 flex flex-col items-center justify-center touch-manipulation"
            >
              <span className="text-xl">→</span>
              <span className="text-[10px] text-[#A08080]">右</span>
            </button>
          </div>

          {/* 中央: 回転 */}
          <button
            onTouchStart={handleTouch("rotate")}
            className="w-16 h-16 bg-blue-500/30 rounded-2xl active:bg-blue-500/60 flex flex-col items-center justify-center border border-blue-400/30 touch-manipulation"
          >
            <span className="text-xl">↻</span>
            <span className="text-[10px] text-[#8B6F6F]">回転</span>
          </button>

          {/* 右: ドロップ */}
          <div className="flex gap-2">
            <button
              onTouchStart={handleTouch("soft_drop")}
              className="w-16 h-16 bg-[#E8C4B8]/40 rounded-2xl active:bg-[#E8C4B8]/60 flex flex-col items-center justify-center touch-manipulation"
            >
              <span className="text-xl">↓</span>
              <span className="text-[10px] text-[#A08080]">下</span>
            </button>
            <button
              onTouchStart={handleTouch("hard_drop")}
              className="w-16 h-16 bg-[#E74C3C]/40 rounded-2xl active:bg-[#E74C3C]/70 flex flex-col items-center justify-center border border-[#E74C3C]/40 touch-manipulation"
            >
              <span className="text-base">⤓</span>
              <span className="text-[10px] text-orange-200">落下</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
