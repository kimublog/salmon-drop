"use client";

interface TitleScreenProps {
  onStart: () => void;
}

export default function TitleScreen({ onStart }: TitleScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-[#0D3B66] to-[#1B4F72] text-white">
      <h1 className="text-6xl font-bold mb-4 animate-bounce-slow salmon-title">
        Salmon Drop
      </h1>
      <p className="text-xl mb-2 text-orange-300">サーモンパズルバトル</p>
      <p className="text-sm mb-12 text-blue-200 opacity-70">リアルなサーモンで遊ぶぷよぷよ風パズル</p>

      <button
        onClick={onStart}
        className="px-12 py-4 bg-[#E74C3C] hover:bg-[#C0392B] text-white text-2xl font-bold rounded-xl shadow-lg transition-all hover:scale-105 active:scale-95"
      >
        スタート
      </button>

      <div className="mt-10 bg-white/10 rounded-xl p-6 max-w-md w-full mx-4">
        <p className="text-center text-sm font-bold text-orange-300 mb-4">操作方法</p>
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
            <span className="text-blue-200">ソフトドロップ</span>
          </div>
          <div className="flex items-center gap-2 col-span-2 justify-center mt-1">
            <kbd className="px-3 py-1 bg-white/20 rounded text-xs font-mono">Space</kbd>
            <span className="text-blue-200">ハードドロップ（即落下）</span>
          </div>
          <div className="flex items-center gap-2 col-span-2 justify-center">
            <kbd className="px-3 py-1 bg-white/20 rounded text-xs font-mono">Esc</kbd>
            <span className="text-blue-200">一時停止</span>
          </div>
        </div>
      </div>
    </div>
  );
}
