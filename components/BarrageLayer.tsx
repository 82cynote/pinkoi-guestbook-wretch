import { useEffect, useMemo, useRef, useState } from 'react';
import type { ApiMessage } from './api';

type BarrageItem = {
  id: string;
  text: string;
  topPx: number;
  durationMs: number;
  fontSizePx: number;
  color: string;
  sourceId: string; // 來自哪一則留言
};

type Props = {
  messages: ApiMessage[];
  paused: boolean;
};


const BARRAGE_PALETTE = [
  '#003354',
  '#EE847D',
  '#5FC3E1',
  '#73D269',
  '#FAF050',
  '#6941D2',
  '#9BFAFA',
  '#FFF57D',
  '#FFE1D7',
  '#6EE1D2',
  '#196EFA',
  '#FA6496',
  '#BEFA46',
  '#551EE1',
  '#FA6946',
  '#000000',
  '#FAFADC',
  '#C3B496',
  '#D2D2C8',
  '#828282',
] as const;

function randomPaletteColor(): string {
  const idx = Math.floor(Math.random() * BARRAGE_PALETTE.length);
  return BARRAGE_PALETTE[idx];
}

function isInActiveWindow(messageTimestamp: number, now: number): boolean {
  // ✅ 7 分鐘可出現、3 分鐘休息（以留言 timestamp 為週期起點；每則留言各自計算）
  const activeMs = 7 * 60 * 1000;
  const restMs = 3 * 60 * 1000;
  const cycleMs = activeMs + restMs;

  if (!Number.isFinite(messageTimestamp) || messageTimestamp <= 0) return true;
  const elapsed = now - messageTimestamp;

  // 使用者裝置時間怪怪的情況，先讓它可出現
  if (elapsed < 0) return true;

  const phase = elapsed % cycleMs;
  return phase < activeMs;
}

export default function BarrageLayer({ messages, paused }: Props) {
  const [items, setItems] = useState<BarrageItem[]>([]);

  // ✅ 輪流用指標（round-robin cursor）
  const cursorRef = useRef(0);

  // 避免「同一則連續兩次」出現（有多則 eligible 時才避免）
  const lastSourceIdRef = useRef<string>('');

  const pool = useMemo(() => {
    return messages
      .map((m) => ({
        id: m.id,
        author: (m.author || '').trim(),
        content: String(m.content || '').trim(),
        timestamp: Number(m.timestamp || 0),
      }))
      .map((m) => ({
        id: m.id,
        author: m.author,
        timestamp: m.timestamp,
        text: `${m.author}：${m.content}`,
      }))
      .filter((x) => x.text.trim().length > 2)
      .sort((a, b) => (a.timestamp - b.timestamp) || a.id.localeCompare(b.id));
  }, [messages]);

  useEffect(() => {
    if (paused) return;
    if (pool.length === 0) return;

    const maxOnScreen = 17;
    const spawnEveryMs = 1850;

    let tickId: number | null = null;

    const spawnTick = () => {
      setItems((prev) => {
        const next = prev.slice(-maxOnScreen);

        const now = Date.now();

        let eligibleCount = 0;
        for (const m of pool) {
          if (isInActiveWindow(m.timestamp, now)) eligibleCount += 1;
        }
        if (eligibleCount === 0) return next;

        const n = pool.length;
        const start = ((cursorRef.current % n) + n) % n;

        const pickNext = (avoidLast: boolean) => {
          for (let step = 0; step < n; step += 1) {
            const idx = (start + step) % n;
            const m = pool[idx];

            if (!isInActiveWindow(m.timestamp, now)) continue;
            if (avoidLast && eligibleCount > 1 && m.id === lastSourceIdRef.current) continue;

            cursorRef.current = (idx + 1) % n;
            return m;
          }
          return null;
        };

        const picked = pickNext(true) ?? pickNext(false);
        if (!picked) return next;

        lastSourceIdRef.current = picked.id;

        const h = window.innerHeight || 800;
        const durationMs = Math.floor(12000 + Math.random() * 4000);
        const fontSizePx = Math.floor(64 + Math.random() * 24);
        const maxTop = Math.max(0, h - fontSizePx - 20);
        const topPx = Math.floor(Math.random() * Math.max(1, maxTop));

        next.push({
          id: `${picked.id}_${Date.now()}_${Math.random().toString(36).slice(2)}`,
          sourceId: picked.id,
          text: picked.text,
          topPx,
          durationMs,
          fontSizePx,
          color: randomPaletteColor(),
        });

        return next;
      });
    };

    const startInterval = () => {
      if (tickId !== null) return;
      tickId = window.setInterval(spawnTick, spawnEveryMs);
    };

    const stopInterval = () => {
      if (tickId !== null) {
        window.clearInterval(tickId);
        tickId = null;
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // 切到背景：停止 spawn，避免累積
        stopInterval();
      } else {
        // 回到前景：清除動畫已凍結的舊 items，重新乾淨地開始
        setItems([]);
        startInterval();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    if (!document.hidden) {
      startInterval();
    }

    return () => {
      stopInterval();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [pool, paused]);

  return (
    <div aria-hidden="true" className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      <style>{`
        @keyframes guestbook-move-left {
          0% { transform: translateX(110vw); }
          100% { transform: translateX(calc(-100% - 120vw)); }
        }
      `}</style>

      {items.map((it) => (
        <div
          key={it.id}
          className="absolute left-0 whitespace-nowrap select-none"
          style={{
            top: `${it.topPx}px`,
            fontSize: `${it.fontSizePx}px`,
            animation: `guestbook-move-left ${it.durationMs}ms linear 0ms 1 both`,
            color: it.color,
            textShadow: '0 2px 6px rgba(0,0,0,0.55)',
            fontWeight: 600,
            letterSpacing: '0px',
          }}
        >
          {it.text}
        </div>
      ))}
    </div>
  );
}