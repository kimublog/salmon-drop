"use client";

import { GameScore } from "@/types/game";
import { getTitle } from "@/constants/scoring";

interface ResultScreenProps {
  score: GameScore;
  difficultyId: string;
  difficultyName: string;
  onRetry: () => void;
  onSelectDifficulty: () => void;
}

export default function ResultScreen({
  score,
  difficultyId,
  difficultyName,
  onRetry,
  onSelectDifficulty,
}: ResultScreenProps) {
  const title = getTitle(score.score);

  // ハイスコア更新チェック
  const highScoreKey = `salmon-drop-highscore-${difficultyId}`;
  const prevHighScore = typeof window !== "undefined"
    ? Number(localStorage.getItem(highScoreKey) || "0")
    : 0;
  const isNewRecord = score.score > prevHighScore;

  if (isNewRecord && typeof window !== "undefined") {
    localStorage.setItem(highScoreKey, String(score.score));
  }

  const shareText = `サモドロで${difficultyName}モード ${score.score.toLocaleString()}点を獲得！サーモン力は「${title}」級！ #サモドロ #サーモンパズル`;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-[#FFF0EC] to-[#FFE0D6] text-[#3D2C2C] p-4">
      <h2 className="text-4xl font-bold mb-2">GAME OVER</h2>

      {isNewRecord && (
        <div className="text-2xl font-bold text-yellow-400 mb-4 animate-pulse">
          NEW RECORD!
        </div>
      )}

      <div className="bg-[#E8C4B8]/30 rounded-2xl p-8 text-center mb-8 min-w-[300px]">
        <p className="text-sm text-[#A08080] mb-1">{difficultyName}</p>
        <p className="text-5xl font-bold text-orange-300 mb-4">
          {score.score.toLocaleString()}
        </p>
        <p className="text-sm text-[#A08080] mb-1">最大連鎖</p>
        <p className="text-2xl font-bold mb-4">{score.maxChain}連鎖</p>

        <div className="border-t border-[#E8C4B8]/40 pt-4 mt-4">
          <p className="text-sm text-[#A08080] mb-1">サーモン力</p>
          <p className="text-2xl font-bold text-yellow-300">{title}</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={onRetry}
          className="px-8 py-3 bg-[#E74C3C] hover:bg-[#C0392B] rounded-xl text-lg font-bold transition-all hover:scale-105"
        >
          もう一度
        </button>
        <button
          onClick={onSelectDifficulty}
          className="px-8 py-3 bg-[#E8C4B8]/40 hover:bg-white/30 rounded-xl text-lg font-bold transition-all hover:scale-105"
        >
          難易度選択へ
        </button>
      </div>

      {/* SNSシェア */}
      <div className="flex gap-3 mt-6">
        <a
          href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 bg-[#5C3D3D]/30 rounded-lg text-sm hover:bg-black/60 transition-colors"
        >
          Xでシェア
        </a>
        <button
          onClick={() => {
            navigator.clipboard.writeText(shareText);
          }}
          className="px-4 py-2 bg-[#5C3D3D]/30 rounded-lg text-sm hover:bg-black/60 transition-colors"
        >
          コピー
        </button>
      </div>
    </div>
  );
}
