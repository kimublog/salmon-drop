"use client";

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";

interface TitleScreenProps {
  onStart: () => void;
}

export default function TitleScreen({ onStart }: TitleScreenProps) {
  return (
    <div className="flex flex-col items-center min-h-[100dvh] bg-gradient-to-b from-[#FFF0EC] to-[#FFE0D6] text-[#3D2C2C] p-3 sm:p-4 overflow-y-auto">
      {/* バナー画像 */}
      <img
        src={`${BASE_PATH}/images/banner.jpg`}
        alt="サモドロ — 究極の鮭を4つ繋げて消せ！大連鎖パズルバトル！"
        className="w-full max-w-lg rounded-2xl shadow-xl mt-4 sm:mt-6"
      />

      <button
        onClick={onStart}
        className="mt-6 px-12 py-4 bg-[#E74C3C] hover:bg-[#C0392B] text-white text-2xl font-bold rounded-xl shadow-lg transition-all hover:scale-105 active:scale-95"
      >
        スタート
      </button>

      {/* 遊び方 */}
      <div className="mt-6 bg-[#E8C4B8]/30 rounded-xl p-5 max-w-md w-full">
        <p className="text-center text-sm font-bold text-orange-300 mb-3">遊び方</p>
        <div className="text-sm text-[#8B6F6F] space-y-1 mb-4 px-2">
          <p>同じ種類のサーモンを <span className="text-[#E74C3C] font-bold">4つ以上</span> つなげると消えます</p>
          <p>消した後に連鎖が起きると高得点！</p>
        </div>

        {/* PC操作 */}
        <div className="hidden sm:block">
          <p className="text-center text-xs font-bold text-[#A08080] mb-2">キーボード操作</p>
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
            <div className="flex items-center gap-2">
              <kbd className="px-2 py-1 bg-[#E8C4B8]/40 rounded text-xs font-mono min-w-[32px] text-center">←</kbd>
              <span className="text-[#8B6F6F]">左に移動</span>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="px-2 py-1 bg-[#E8C4B8]/40 rounded text-xs font-mono min-w-[32px] text-center">→</kbd>
              <span className="text-[#8B6F6F]">右に移動</span>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="px-2 py-1 bg-[#E8C4B8]/40 rounded text-xs font-mono min-w-[32px] text-center">↑</kbd>
              <span className="text-[#8B6F6F]">回転</span>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="px-2 py-1 bg-[#E8C4B8]/40 rounded text-xs font-mono min-w-[32px] text-center">↓</kbd>
              <span className="text-[#8B6F6F]">下に移動</span>
            </div>
            <div className="flex items-center gap-2 col-span-2 justify-center mt-1">
              <kbd className="px-3 py-1 bg-[#E8C4B8]/40 rounded text-xs font-mono">Space</kbd>
              <span className="text-[#8B6F6F]">一気に落下</span>
            </div>
            <div className="flex items-center gap-2 col-span-2 justify-center">
              <kbd className="px-3 py-1 bg-[#E8C4B8]/40 rounded text-xs font-mono">Esc</kbd>
              <span className="text-[#8B6F6F]">一時停止</span>
            </div>
          </div>
        </div>

        {/* スマホ操作 */}
        <div className="sm:hidden">
          <p className="text-center text-xs font-bold text-[#A08080] mb-2">タッチ操作</p>
          <div className="flex justify-center gap-3 text-center text-xs text-[#8B6F6F]">
            <div className="flex flex-col items-center gap-1">
              <div className="w-10 h-10 bg-[#E8C4B8]/50 rounded-lg flex items-center justify-center text-base">←</div>
              <span>左</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="w-10 h-10 bg-[#E8C4B8]/50 rounded-lg flex items-center justify-center text-base">→</div>
              <span>右</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="w-10 h-10 bg-blue-500/30 rounded-lg flex items-center justify-center text-base border border-blue-400/30">↻</div>
              <span>回転</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="w-10 h-10 bg-[#E8C4B8]/50 rounded-lg flex items-center justify-center text-base">↓</div>
              <span>下</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="w-10 h-10 bg-[#E74C3C]/40 rounded-lg flex items-center justify-center text-base border border-[#E74C3C]/40">⤓</div>
              <span>落下</span>
            </div>
          </div>
          <p className="text-center text-[10px] text-[#A08080]/60 mt-2">ゲーム画面下のボタンで操作します</p>
        </div>
      </div>
    </div>
  );
}
