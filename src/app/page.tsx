'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';

// ============================================================
// 型定義
// ============================================================
interface SalmonDef {
  id: string;
  name: string;
  file: string;
  width: number;
  stackHeight: number;
}

interface StackedSalmon {
  x: number;
  y: number;
  type: SalmonDef;
  rotation: number;
  animDelay: number;
  scatterVx?: number;
  scatterVy?: number;
  scatterX?: number;
  scatterY?: number;
  scatterR?: number;
}

interface ParticleData {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
}

interface FloatText {
  id: number;
  text: string;
  x: number;
  y: number;
  life: number;
  maxLife: number;
  color: string;
  fontSize: number;
}

interface GameState {
  phase: 'sway' | 'drop' | 'landing' | 'scatter';
  tower: StackedSalmon[];
  current: {
    type: SalmonDef;
    x: number;
    y: number;
    swayPhase: number;
    swayCenter: number;
    dropSpeed: number;
    rotation: number;
  };
  score: number;
  combo: number;
  cameraY: number;
  targetCameraY: number;
  particles: ParticleData[];
  floatTexts: FloatText[];
  keys: { left: boolean; right: boolean };
  landingTimer: number;
  scatterTimer: number;
}

// ============================================================
// サーモン定義（8種類）
// ============================================================
const SALMON_TYPES: SalmonDef[] = [
  { id: 'atlantic', name: 'アトランティックサーモン', file: 'アトランティックサーモン.png', width: 110, stackHeight: 50 },
  { id: 'pink',     name: 'カラフトマス',           file: 'カラフトマス.png',           width: 95,  stackHeight: 45 },
  { id: 'king',     name: 'キングサーモン',         file: 'キングサーモン.png',         width: 120, stackHeight: 55 },
  { id: 'cherry',   name: 'サクラマス',             file: 'サクラマス.png',             width: 80,  stackHeight: 38 },
  { id: 'trout',    name: 'トラウトサーモン',       file: 'トラウトサーモン.png',       width: 100, stackHeight: 48 },
  { id: 'silver',   name: '銀鮭',                   file: '銀鮭.png',                   width: 100, stackHeight: 48 },
  { id: 'sockeye',  name: '紅鮭',                   file: '紅鮭.png',                   width: 100, stackHeight: 48 },
  { id: 'chum',     name: '秋鮭',                   file: '秋鮭.png',                   width: 115, stackHeight: 52 },
];

// サーモン画像の表示高さを算出（stackHeightは積み上げ間隔、displayHeightは画像表示用）
function salmonDisplayHeight(s: SalmonDef): number {
  return Math.round(s.width * 0.65);
}

// ============================================================
// 定数
// ============================================================
const GAME_W = 400;
const GAME_H = 650;
const BASE_Y = 580;
const BASE_W = 200;
const GRAVITY = 0.45;
const MAX_OFFSET_RATIO = 0.55;
const PERFECT_THRESHOLD = 0.85;
const NICE_THRESHOLD = 0.5;
const CAMERA_MARGIN = 250;
const SPAWN_OFFSET = 40;

const SPLASH_COLORS = ['#4fc3f7', '#29b6f6', '#03a9f4', '#0288d1', '#81d4fa', '#e1f5fe'];
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || '';

// ============================================================
// ユーティリティ
// ============================================================
let _uid = 0;
function uid() { return ++_uid; }

function randomSalmon(): SalmonDef {
  return SALMON_TYPES[Math.floor(Math.random() * SALMON_TYPES.length)];
}

function getBackground(count: number): string {
  if (count <= 10) {
    const t = Math.min(1, count / 10);
    return `linear-gradient(to top, #071222, ${blend('#0d2847', '#1a5276', t)})`;
  }
  if (count <= 20) {
    const t = (count - 10) / 10;
    return `linear-gradient(to top, #1a5276, ${blend('#2e86c1', '#85c1e9', t)})`;
  }
  if (count <= 30) {
    const t = (count - 20) / 10;
    return `linear-gradient(to top, #85c1e9, ${blend('#5dade2', '#1b4f72', t)})`;
  }
  return 'linear-gradient(to top, #0b0b2e, #000000)';
}

function blend(a: string, b: string, t: number): string {
  const p = (h: string) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const [r1, g1, b1] = p(a);
  const [r2, g2, b2] = p(b);
  return `rgb(${Math.round(r1 + (r2 - r1) * t)},${Math.round(g1 + (g2 - g1) * t)},${Math.round(b1 + (b2 - b1) * t)})`;
}

// ============================================================
// メインコンポーネント
// ============================================================
export default function SalmonTower() {
  const [gamePhase, setGamePhase] = useState<'title' | 'playing' | 'gameover'>('title');
  const [, setTick] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [perfectFlash, setPerfectFlash] = useState(false);
  const [newRecord, setNewRecord] = useState(false);

  // 星（宇宙フェーズ用）
  const stars = useMemo(() =>
    Array.from({ length: 100 }, () => ({
      x: Math.random() * GAME_W,
      y: Math.random() * 3000 - 1500,
      size: Math.random() * 2.5 + 0.5,
      twinkleDelay: Math.random() * 4,
    })),
  []);

  // ゲーム状態（mutable ref）
  const gs = useRef<GameState>({
    phase: 'sway',
    tower: [],
    current: { type: SALMON_TYPES[0], x: GAME_W / 2, y: 0, swayPhase: 0, swayCenter: GAME_W / 2, dropSpeed: 0, rotation: 0 },
    score: 0,
    combo: 0,
    cameraY: 0,
    targetCameraY: 0,
    particles: [],
    floatTexts: [],
    keys: { left: false, right: false },
    landingTimer: 0,
    scatterTimer: 0,
  });

  const rafRef = useRef(0);

  // --------------------------------------------------------
  // サーモン生成
  // --------------------------------------------------------
  const spawnSalmon = useCallback(() => {
    const g = gs.current;
    g.current = {
      type: randomSalmon(),
      x: GAME_W / 2,
      y: g.cameraY + SPAWN_OFFSET,
      swayPhase: Math.random() * Math.PI * 2,
      swayCenter: GAME_W / 2,
      dropSpeed: 0,
      rotation: 0,
    };
    g.phase = 'sway';
  }, []);

  // --------------------------------------------------------
  // パーティクル・テキスト
  // --------------------------------------------------------
  const spawnParticles = useCallback((x: number, y: number, count: number) => {
    const g = gs.current;
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.8;
      const speed = Math.random() * 5 + 2;
      g.particles.push({
        id: uid(), x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 3,
        life: 35 + Math.random() * 20,
        color: SPLASH_COLORS[Math.floor(Math.random() * SPLASH_COLORS.length)],
        size: Math.random() * 5 + 2,
      });
    }
  }, []);

  const addFloatText = useCallback((text: string, x: number, y: number, color: string, fontSize: number) => {
    const life = 70;
    gs.current.floatTexts.push({ id: uid(), text, x, y, color, fontSize, life, maxLife: life });
  }, []);

  // --------------------------------------------------------
  // 着地処理
  // --------------------------------------------------------
  const landSalmon = useCallback(() => {
    const g = gs.current;
    const cur = g.current;
    const tower = g.tower;

    const prevX = tower.length === 0 ? GAME_W / 2 : tower[tower.length - 1].x;
    const prevWidth = tower.length === 0 ? BASE_W : tower[tower.length - 1].type.width;
    const offset = Math.abs(cur.x - prevX);
    const avgWidth = (prevWidth + cur.type.width) / 2;
    const maxOffset = avgWidth * MAX_OFFSET_RATIO;

    // ゲームオーバー
    if (offset > maxOffset) {
      g.phase = 'scatter';
      g.scatterTimer = 120;
      g.tower.forEach(s => {
        s.scatterVx = (Math.random() - 0.5) * 14;
        s.scatterVy = -(Math.random() * 10 + 3);
        s.scatterX = 0;
        s.scatterY = 0;
        s.scatterR = 0;
      });
      return;
    }

    // 精度・スコア計算
    const accuracy = 1 - offset / maxOffset;
    let points = 100;
    let msg = 'ピチッ！';
    let msgColor = '#ffffff';

    if (accuracy >= PERFECT_THRESHOLD) {
      g.combo++;
      points += 200 + g.combo * 50;
      msg = g.combo >= 3 ? `${g.combo}コンボ！\nパーフェクトサーモン！！` : 'パーフェクトサーモン！！';
      msgColor = '#ffd700';
      setPerfectFlash(true);
      setTimeout(() => setPerfectFlash(false), 200);
    } else if (accuracy >= NICE_THRESHOLD) {
      points += 50;
      msg = 'ナイスサーモン！';
      msgColor = '#4fc3f7';
      g.combo = 0;
    } else {
      g.combo = 0;
    }
    points += Math.floor(accuracy * 100);
    g.score += points;

    // タワーに追加
    const landingY = tower.length === 0
      ? BASE_Y - cur.type.stackHeight
      : tower[tower.length - 1].y - cur.type.stackHeight;
    const tiltAngle = ((cur.x - prevX) / maxOffset) * 10;

    tower.push({
      x: cur.x, y: landingY, type: cur.type,
      rotation: tiltAngle, animDelay: Math.random() * 2,
    });

    // エフェクト
    spawnParticles(cur.x, landingY + cur.type.stackHeight / 2, 18);
    addFloatText(msg, cur.x, landingY - 30, msgColor, accuracy >= PERFECT_THRESHOLD ? 26 : 20);
    addFloatText(`+${points}`, cur.x + 40, landingY, '#ffeb3b', 16);

    // カメラ
    g.targetCameraY = Math.min(0, landingY - CAMERA_MARGIN);

    g.phase = 'landing';
    g.landingTimer = 18;
  }, [spawnParticles, addFloatText]);

  // --------------------------------------------------------
  // ゲームループ
  // --------------------------------------------------------
  const gameLoop = useCallback(() => {
    const g = gs.current;

    // sway
    if (g.phase === 'sway') {
      const n = g.tower.length;
      const swaySpeed = 0.03 + n * 0.0012;
      const swayAmplitude = Math.min(175, 80 + n * 3.5);

      g.current.swayPhase += swaySpeed;
      if (g.keys.left) g.current.swayCenter = Math.max(g.current.type.width / 2, g.current.swayCenter - 4.5);
      if (g.keys.right) g.current.swayCenter = Math.min(GAME_W - g.current.type.width / 2, g.current.swayCenter + 4.5);

      g.current.x = g.current.swayCenter + Math.sin(g.current.swayPhase) * swayAmplitude;
      g.current.x = Math.max(g.current.type.width / 2, Math.min(GAME_W - g.current.type.width / 2, g.current.x));
      g.current.y = g.cameraY + SPAWN_OFFSET;
      g.current.rotation = Math.sin(g.current.swayPhase * 2.5) * 15;
    }

    // drop
    if (g.phase === 'drop') {
      g.current.y += g.current.dropSpeed;
      g.current.dropSpeed += GRAVITY;
      g.current.rotation += 10;

      const landingY = g.tower.length === 0
        ? BASE_Y - g.current.type.stackHeight
        : g.tower[g.tower.length - 1].y - g.current.type.stackHeight;
      if (g.current.y >= landingY) {
        g.current.y = landingY;
        landSalmon();
      }
    }

    // landing
    if (g.phase === 'landing') {
      g.landingTimer--;
      if (g.landingTimer <= 0) spawnSalmon();
    }

    // scatter（ゲームオーバー演出）
    if (g.phase === 'scatter') {
      g.scatterTimer--;
      for (const s of g.tower) {
        if (s.scatterVx !== undefined) {
          s.scatterX = (s.scatterX || 0) + s.scatterVx;
          s.scatterY = (s.scatterY || 0) + (s.scatterVy || 0);
          s.scatterVy = (s.scatterVy || 0) + 0.35;
          s.scatterR = (s.scatterR || 0) + s.scatterVx * 1.5;
        }
      }
      if (g.scatterTimer <= 0) {
        const finalScore = g.score;
        setHighScore(prev => {
          if (finalScore > prev) { setNewRecord(true); return finalScore; }
          return prev;
        });
        setGamePhase('gameover');
        return;
      }
    }

    // カメラ追従
    g.cameraY += (g.targetCameraY - g.cameraY) * 0.07;

    // パーティクル
    g.particles = g.particles.filter(p => {
      p.x += p.vx; p.y += p.vy; p.vy += 0.15; p.vx *= 0.98; p.life--;
      return p.life > 0;
    });

    // フロートテキスト
    g.floatTexts = g.floatTexts.filter(ft => { ft.y -= 0.8; ft.life--; return ft.life > 0; });

    setTick(t => t + 1);
    rafRef.current = requestAnimationFrame(gameLoop);
  }, [landSalmon, spawnSalmon]);

  // --------------------------------------------------------
  // ゲーム開始
  // --------------------------------------------------------
  const startGame = useCallback(() => {
    const g = gs.current;
    g.tower = []; g.score = 0; g.combo = 0;
    g.cameraY = 0; g.targetCameraY = 0;
    g.particles = []; g.floatTexts = [];
    g.keys = { left: false, right: false };
    g.scatterTimer = 0;
    spawnSalmon();
    setGamePhase('playing');
    setNewRecord(false);
  }, [spawnSalmon]);

  // --------------------------------------------------------
  // 落とす
  // --------------------------------------------------------
  const dropSalmon = useCallback(() => {
    const g = gs.current;
    if (g.phase !== 'sway') return;
    g.phase = 'drop';
    g.current.dropSpeed = 3 + g.tower.length * 0.12;
  }, []);

  // --------------------------------------------------------
  // キーボード
  // --------------------------------------------------------
  useEffect(() => {
    if (gamePhase !== 'playing') return;
    const down = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft')  { gs.current.keys.left = true; e.preventDefault(); }
      if (e.key === 'ArrowRight') { gs.current.keys.right = true; e.preventDefault(); }
      if (e.key === ' ')          { dropSalmon(); e.preventDefault(); }
    };
    const up = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft')  gs.current.keys.left = false;
      if (e.key === 'ArrowRight') gs.current.keys.right = false;
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, [gamePhase, dropSalmon]);

  // ゲームループ開始・停止
  useEffect(() => {
    if (gamePhase === 'playing') {
      rafRef.current = requestAnimationFrame(gameLoop);
    }
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [gamePhase, gameLoop]);

  // 描画用の値
  const g = gs.current;

  // ============================================================
  // タイトル画面
  // ============================================================
  if (gamePhase === 'title') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen"
           style={{ background: 'linear-gradient(to bottom, #0d2847, #1a5276, #071222)' }}>
        <div className="relative mb-10 px-8">
          <img src={`${BASE_PATH}/images/salmon/紅鮭.png`} alt="" draggable={false}
               className="absolute pointer-events-none"
               style={{ width: 75, left: -60, top: 10, animation: 'title-salmon-left 1.5s ease-in-out infinite' }} />
          <h1 className="text-5xl font-black text-center leading-snug"
              style={{
                color: '#FA8072',
                textShadow: '0 0 40px rgba(250,128,114,0.5), 0 4px 12px rgba(0,0,0,0.6)',
                animation: 'title-bounce 2s ease-in-out infinite',
              }}>
            ピチピチ<br />サーモン<br />タワー
          </h1>
          <img src={`${BASE_PATH}/images/salmon/銀鮭.png`} alt="" draggable={false}
               className="absolute pointer-events-none"
               style={{ width: 75, right: -60, bottom: 10, animation: 'title-salmon-right 1.8s ease-in-out infinite' }} />
        </div>

        <button onClick={startGame}
                className="px-12 py-4 rounded-2xl text-xl font-bold text-white cursor-pointer active:scale-95 transition-transform"
                style={{ background: 'linear-gradient(135deg, #e74c3c, #FA8072)', boxShadow: '0 4px 20px rgba(231,76,60,0.5)' }}>
          スタート
        </button>

        {highScore > 0 && (
          <p className="mt-6 text-lg font-bold" style={{ color: '#ffd700' }}>
            ハイスコア：{highScore}点
          </p>
        )}

        <p className="mt-10 text-sm text-center leading-relaxed" style={{ color: '#85c1e9', opacity: 0.6 }}>
          ← → で位置調整<br />スペースキーで落とす<br />（モバイル：下のボタンで操作）
        </p>
      </div>
    );
  }

  // ============================================================
  // ゲームオーバー画面
  // ============================================================
  if (gamePhase === 'gameover') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen"
           style={{ background: 'linear-gradient(to bottom, #1a1a2e, #16213e, #0f3460)' }}>
        <h2 className="text-3xl font-black mb-6" style={{ color: '#e74c3c', textShadow: '0 0 20px rgba(231,76,60,0.4)' }}>
          ピチッ…！崩れた！
        </h2>

        <p className="text-lg mb-1" style={{ color: '#85c1e9' }}>
          積み上げた匹数：<span className="font-bold text-white">{g.tower.length}匹</span>
        </p>

        <p className="text-6xl font-black mb-2" style={{ color: '#ffd700', textShadow: '0 0 20px rgba(255,215,0,0.4)' }}>
          {g.score}<span className="text-2xl">点</span>
        </p>

        {newRecord && (
          <p className="mb-4 text-2xl font-black"
             style={{ color: '#ff6b6b', animation: 'new-record-pulse 0.5s ease-in-out infinite alternate', textShadow: '0 0 25px rgba(255,107,107,0.8)' }}>
            NEW RECORD!!
          </p>
        )}

        <div className="flex flex-col gap-3 mt-4">
          <button onClick={startGame}
                  className="px-10 py-3 rounded-xl text-lg font-bold text-white cursor-pointer active:scale-95 transition-transform"
                  style={{ background: 'linear-gradient(135deg, #e74c3c, #FA8072)', boxShadow: '0 4px 15px rgba(231,76,60,0.4)' }}>
            もう一回
          </button>
          <button onClick={() => setGamePhase('title')}
                  className="px-8 py-2 rounded-lg text-sm cursor-pointer"
                  style={{ color: '#85c1e9', background: 'rgba(255,255,255,0.08)' }}>
            タイトルに戻る
          </button>
        </div>
      </div>
    );
  }

  // ============================================================
  // ゲームプレイ画面
  // ============================================================
  const cameraOffset = -g.cameraY;
  const towerLen = g.tower.length;
  const bgStyle = getBackground(towerLen);
  const showStars = towerLen > 25;
  const showSeaweed = towerLen <= 15;
  const showClouds = towerLen > 20 && towerLen <= 35;

  return (
    <div className="flex flex-col items-center min-h-screen" style={{ background: '#060612' }}>
      {/* HUD */}
      <div className="flex justify-between items-center py-2 px-4" style={{ width: GAME_W, color: 'white' }}>
        <div className="text-xl font-black">{g.score}<span className="text-sm font-normal ml-1">点</span></div>
        <div className="text-base font-bold" style={{ color: '#ffd700' }}>{towerLen}匹</div>
      </div>

      {/* ゲームエリア */}
      <div className="relative overflow-hidden"
           style={{ width: GAME_W, height: GAME_H, background: bgStyle, borderRadius: 8, boxShadow: '0 0 30px rgba(0,0,0,0.6)' }}>

        {/* パーフェクトフラッシュ */}
        {perfectFlash && (
          <div className="absolute inset-0 z-30 pointer-events-none"
               style={{ background: 'rgba(255,215,0,0.25)', animation: 'flash 0.2s ease-out forwards' }} />
        )}

        {/* 星 */}
        {showStars && stars.map((s, i) => (
          <div key={i} className="absolute rounded-full pointer-events-none"
               style={{
                 left: s.x, top: s.y + cameraOffset, width: s.size, height: s.size,
                 background: '#fff',
                 opacity: Math.min(1, (towerLen - 25) / 5) * 0.8,
                 animation: `twinkle ${2 + s.twinkleDelay}s ease-in-out ${s.twinkleDelay}s infinite`,
               }} />
        ))}

        {/* 雲 */}
        {showClouds && [0, 1, 2].map(i => (
          <div key={`cloud-${i}`} className="absolute pointer-events-none rounded-full"
               style={{
                 left: 60 + i * 130, top: -400 - i * 200 + cameraOffset,
                 width: 100 + i * 30, height: 35 + i * 10,
                 background: 'rgba(255,255,255,0.15)', filter: 'blur(8px)',
                 animation: `cloud-drift ${4 + i}s ease-in-out infinite alternate`,
               }} />
        ))}

        {/* 海藻 */}
        {showSeaweed && (
          <>
            <div className="absolute pointer-events-none" style={{
              left: 30, top: BASE_Y + 30 + cameraOffset, width: 18, height: 70,
              background: 'linear-gradient(to top, #1b5e20, #4caf50)', borderRadius: '50% 50% 0 0',
              opacity: 0.35, animation: 'seaweed-sway 3s ease-in-out infinite',
            }} />
            <div className="absolute pointer-events-none" style={{
              right: 35, top: BASE_Y + 30 + cameraOffset, width: 14, height: 55,
              background: 'linear-gradient(to top, #1b5e20, #66bb6a)', borderRadius: '50% 50% 0 0',
              opacity: 0.25, animation: 'seaweed-sway 2.5s ease-in-out infinite 0.5s',
            }} />
            <div className="absolute pointer-events-none" style={{
              left: 170, top: BASE_Y + 30 + cameraOffset, width: 12, height: 50,
              background: 'linear-gradient(to top, #2e7d32, #81c784)', borderRadius: '50% 50% 0 0',
              opacity: 0.2, animation: 'seaweed-sway 3.5s ease-in-out infinite 1s',
            }} />
          </>
        )}

        {/* ワールドコンテナ */}
        <div className="absolute inset-0 pointer-events-none" style={{ transform: `translateY(${cameraOffset}px)` }}>

          {/* まな板 */}
          <div className="absolute" style={{
            left: (GAME_W - BASE_W) / 2, top: BASE_Y, width: BASE_W, height: 28,
            background: 'linear-gradient(to bottom, #a0845c, #7a5c38)', borderRadius: 4,
            boxShadow: '0 4px 10px rgba(0,0,0,0.4)',
          }}>
            <div className="absolute inset-x-1 top-0 bottom-0" style={{
              background: 'repeating-linear-gradient(90deg, transparent, transparent 22px, rgba(0,0,0,0.08) 22px, rgba(0,0,0,0.08) 24px)',
            }} />
            <div className="absolute inset-x-0 top-0 h-1" style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '4px 4px 0 0' }} />
          </div>

          {/* 積み上がったサーモン */}
          {g.tower.map((s, i) => {
            const sx = s.scatterX || 0;
            const sy = s.scatterY || 0;
            const sr = s.scatterR || 0;
            const opacity = g.phase === 'scatter' ? Math.max(0, g.scatterTimer / 80) : 1;
            const pichiSpeed = Math.max(0.4, 0.9 - towerLen * 0.015);
            const dh = salmonDisplayHeight(s.type);
            const yOffset = (dh - s.type.stackHeight) / 2;

            return (
              <div key={i} className="absolute"
                   style={{
                     left: s.x - s.type.width / 2 + sx,
                     top: s.y - yOffset + sy,
                     width: s.type.width,
                     height: dh,
                     transform: `rotate(${s.rotation + sr}deg)`,
                     opacity,
                   }}>
                <img src={`${BASE_PATH}/images/salmon/${s.type.file}`} alt={s.type.name} draggable={false}
                     className="w-full h-full object-contain"
                     style={{
                       animation: g.phase !== 'scatter'
                         ? `pichipichi ${pichiSpeed}s ease-in-out ${s.animDelay}s infinite`
                         : 'none',
                     }} />
              </div>
            );
          })}

          {/* 現在のサーモン */}
          {(g.phase === 'sway' || g.phase === 'drop') && (() => {
            const curDh = salmonDisplayHeight(g.current.type);
            const curYOffset = (curDh - g.current.type.stackHeight) / 2;
            return (
              <div className="absolute"
                   style={{
                     left: g.current.x - g.current.type.width / 2,
                     top: g.current.y - curYOffset,
                     width: g.current.type.width,
                     height: curDh,
                     transform: `rotate(${g.current.rotation}deg)`,
                     zIndex: 10,
                   }}>
                <img src={`${BASE_PATH}/images/salmon/${g.current.type.file}`} alt={g.current.type.name} draggable={false}
                     className="w-full h-full object-contain"
                     style={{
                       animation: g.phase === 'sway' ? 'pichipichi 0.5s ease-in-out infinite' : 'none',
                       filter: g.phase === 'drop' ? 'brightness(1.2)' : 'none',
                     }} />
              </div>
            );
          })()}

          {/* ガイドライン */}
          {g.phase === 'sway' && (() => {
            const targetY = g.tower.length === 0 ? BASE_Y : g.tower[g.tower.length - 1].y;
            const lineTop = g.current.y + g.current.type.stackHeight;
            const lineH = targetY - lineTop;
            if (lineH <= 0) return null;
            return (
              <div className="absolute" style={{
                left: g.current.x - 1, top: lineTop,
                width: 2, height: lineH,
                background: 'rgba(255,255,255,0.08)',
              }} />
            );
          })()}

          {/* パーティクル */}
          {g.particles.map(p => (
            <div key={p.id} className="absolute rounded-full"
                 style={{
                   left: p.x - p.size / 2, top: p.y - p.size / 2,
                   width: p.size, height: p.size,
                   background: p.color,
                   opacity: Math.min(1, p.life / 20),
                   boxShadow: `0 0 ${p.size}px ${p.color}`,
                 }} />
          ))}

          {/* フロートテキスト */}
          {g.floatTexts.map(ft => (
            <div key={ft.id} className="absolute font-black text-center whitespace-pre-line"
                 style={{
                   left: ft.x, top: ft.y,
                   transform: 'translateX(-50%)',
                   fontSize: ft.fontSize, color: ft.color,
                   opacity: Math.min(1, ft.life / (ft.maxLife * 0.3)),
                   textShadow: `0 2px 6px rgba(0,0,0,0.9), 0 0 12px ${ft.color}44`,
                   pointerEvents: 'none',
                 }}>
              {ft.text}
            </div>
          ))}
        </div>

        {/* コンボ表示 */}
        {g.combo >= 2 && g.phase !== 'scatter' && (
          <div className="absolute top-3 right-3 z-20 text-sm font-black px-3 py-1 rounded-full"
               style={{ background: 'rgba(255,215,0,0.2)', color: '#ffd700', border: '1px solid rgba(255,215,0,0.3)' }}>
            {g.combo} COMBO
          </div>
        )}
      </div>

      {/* モバイルコントロール */}
      <div className="flex gap-3 mt-3 px-2" style={{ width: GAME_W }}>
        <button
          className="flex-1 py-5 rounded-xl text-3xl font-bold text-white cursor-pointer active:brightness-75 transition-all"
          style={{ background: 'rgba(255,255,255,0.12)', touchAction: 'none' }}
          onTouchStart={e => { e.preventDefault(); gs.current.keys.left = true; }}
          onTouchEnd={() => { gs.current.keys.left = false; }}
          onTouchCancel={() => { gs.current.keys.left = false; }}
          onMouseDown={() => { gs.current.keys.left = true; }}
          onMouseUp={() => { gs.current.keys.left = false; }}
          onMouseLeave={() => { gs.current.keys.left = false; }}
        >
          ←
        </button>
        <button
          className="flex-1 py-5 rounded-xl text-lg font-black text-white cursor-pointer active:scale-95 transition-transform"
          style={{ background: 'linear-gradient(135deg, #e74c3c, #FA8072)', touchAction: 'none', boxShadow: '0 3px 12px rgba(231,76,60,0.4)' }}
          onTouchStart={e => { e.preventDefault(); dropSalmon(); }}
          onClick={() => dropSalmon()}
        >
          落とす！
        </button>
        <button
          className="flex-1 py-5 rounded-xl text-3xl font-bold text-white cursor-pointer active:brightness-75 transition-all"
          style={{ background: 'rgba(255,255,255,0.12)', touchAction: 'none' }}
          onTouchStart={e => { e.preventDefault(); gs.current.keys.right = true; }}
          onTouchEnd={() => { gs.current.keys.right = false; }}
          onTouchCancel={() => { gs.current.keys.right = false; }}
          onMouseDown={() => { gs.current.keys.right = true; }}
          onMouseUp={() => { gs.current.keys.right = false; }}
          onMouseLeave={() => { gs.current.keys.right = false; }}
        >
          →
        </button>
      </div>

      <p className="mt-2 text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>
        PC: ← → キー + スペース
      </p>
    </div>
  );
}
