"use client";

import { DIFFICULTIES } from "@/constants/difficulties";
import { SALMON_TYPES } from "@/constants/salmonTypes";

interface DifficultySelectProps {
  onSelect: (difficultyId: string) => void;
  onBack: () => void;
}

export default function DifficultySelect({ onSelect, onBack }: DifficultySelectProps) {
  return (
    <div className="flex flex-col items-center min-h-[100dvh] bg-gradient-to-b from-[#FFF0EC] to-[#FFE0D6] text-[#3D2C2C] p-3 sm:p-4 py-4 sm:py-8 overflow-y-auto">
      <h2 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-8">難易度を選択</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 max-w-4xl w-full">
        {DIFFICULTIES.map((diff) => {
          const salmons = SALMON_TYPES.slice(0, diff.salmonCount);
          const highScore = typeof window !== "undefined"
            ? localStorage.getItem(`salmon-drop-highscore-${diff.id}`) || "0"
            : "0";

          return (
            <button
              key={diff.id}
              onClick={() => onSelect(diff.id)}
              className="p-3 sm:p-6 rounded-xl border-2 transition-all hover:scale-105 active:scale-95 text-left"
              style={{
                borderColor: diff.color,
                background: `linear-gradient(135deg, ${diff.color}20, ${diff.color}40)`,
              }}
            >
              <div className="flex items-center gap-2 mb-1 sm:mb-3">
                <span className="text-xl sm:text-2xl">{diff.icon}</span>
                <span className="text-lg sm:text-xl font-bold">{diff.name}</span>
                <span className="text-xs text-[#8B6F6F] ml-auto">{diff.salmonCount}種類</span>
              </div>
              <div className="flex flex-wrap gap-1 mb-1 sm:mb-3">
                {salmons.map((s) => (
                  <img
                    key={s.id}
                    src={`${process.env.NEXT_PUBLIC_BASE_PATH || ""}/images/salmon/${s.image}`}
                    alt={s.name}
                    className="w-6 h-6 sm:w-8 sm:h-8 rounded object-cover"
                  />
                ))}
              </div>
              <p className="text-xs text-[#A08080]">
                ハイスコア: {Number(highScore).toLocaleString()}
              </p>
            </button>
          );
        })}
      </div>

      <button
        onClick={onBack}
        className="mt-4 sm:mt-8 px-6 py-2 text-[#A08080] hover:text-[#3D2C2C] transition-colors"
      >
        ← 戻る
      </button>
    </div>
  );
}
