"use client";

interface TitleScreenProps {
  onStart: () => void;
}

export default function TitleScreen({ onStart }: TitleScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[100dvh] bg-gradient-to-b from-[#0D3B66] to-[#1B4F72] text-white p-4">
      <h1 className="text-5xl sm:text-6xl font-bold mb-4 animate-bounce-slow salmon-title">
        Salmon Drop
      </h1>
      <p className="text-lg sm:text-xl mb-2 text-orange-300">サーモンパズルバトル</p>
      <p className="text-xs sm:text-sm mb-8 text-blue-200 opacity-70">リアルなサーモンで遊ぶぷよぷよ風パズル</p>

      <button
        onClick={onStart}
        className="px-12 py-4 bg-[#E74C3C] hover:bg-[#C0392B] text-white text-2xl font-bold rounded-xl shadow-lg transition-all hover:scale-105 active:scale-95"
      >
        スタート
      </button>

      {/* 遊び方 */}
      <div className="mt-8 bg-white/10 rounded-xl p-5 max-w-md w-full">
        <p className="text-center text-sm font-bold text-orange-300 mb-3">遊び方</p>
        <div className="text-sm text-blue-200 space-y-1 mb-4 px-2">
          <p>同じ種類のサーモンを <span className="text-yellow-300 font-bold">4つ以上</span> つなげると消えます</p>
          <p>消した後に連鎖が起きると高得点！</p>
        </div>

        {/* PC操作 */}
        <div className="hidden sm:block">
          <p className="text-center text-xs font-bold text-blue-300 mb-2">キーボード操作</p>
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
            <div className="flex items-center gap-2">
              <kbd className="px-2 py-1 bg-white/20 rounded text-xs font-mono min-w-[32px] text-center">←</kbd>
              <span className="text-blue-200">左に移動</span>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="px-2 py-1 bg-white/20 rounded text-xs font-mono min-w-[32px] text-center">→</kbd>
              <span className="text-blue-200">右に移動</span>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="px-2 py-1 bg-white/20 rounded text-xs font-mono min-w-[32px] text-center">↑</kbd>
              <span className="text-blue-200">回転</span>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="px-2 py-1 bg-white/20 rounded text-xs font-mono min-w-[32px] text-center">↓</kbd>
              <span className="text-blue-200">下に移動</span>
            </div>
            <div className="flex items-center gap-2 col-span-2 justify-center mt-1">
              <kbd className="px-3 py-1 bg-white/20 rounded text-xs font-mono">Space</kbd>
              <span className="text-blue-200">一気に落下</span>
            </div>
            <div className="flex items-center gap-2 col-span-2 justify-center">
              <kbd className="px-3 py-1 bg-white/20 rounded text-xs font-mono">Esc</kbd>
              <span className="text-blue-200">一時停止</span>
            </div>
          </div>
        </div>

        {/* スマホ操作 */}
        <div className="sm:hidden">
          <p className="text-center text-xs font-bold text-blue-300 mb-2">タッチ操作</p>
          <div className="flex justify-center gap-3 text-center text-xs text-blue-200">
            <div className="flex flex-col items-center gap-1">
              <div className="w-10 h-10 bg-white/15 rounded-lg flex items-center justify-center text-base">←</div>
              <span>左</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="w-10 h-10 bg-white/15 rounded-lg flex items-center justify-center text-base">→</div>
              <span>右</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="w-10 h-10 bg-blue-500/30 rounded-lg flex items-center justify-center text-base border border-blue-400/30">↻</div>
              <span>回転</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="w-10 h-10 bg-white/15 rounded-lg flex items-center justify-center text-base">↓</div>
              <span>下</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="w-10 h-10 bg-[#E74C3C]/40 rounded-lg flex items-center justify-center text-base border border-[#E74C3C]/40">⤓</div>
              <span>落下</span>
            </div>
          </div>
          <p className="text-center text-[10px] text-blue-300/60 mt-2">ゲーム画面下のボタンで操作します</p>
        </div>
      </div>
    </div>
  );
}
