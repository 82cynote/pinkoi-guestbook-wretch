import { useEffect, useMemo, useRef, useState } from 'react';
import type { ApiMessage } from './api';

type BarrageItem = {
  id: string;
  text: string;
  topPx: number;
  durationMs: number;
  fontSizePx: number;
  color: string;
  sourceId: string; // 來自哪一則留言（用來避免連續重複）
};

type Props = {
  messages: ApiMessage[];
  paused: boolean;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function hashString(input: string): number {
  // 簡單穩定的 hash（同暱稱會得到同一個值）
  let h = 5381;
  for (let i = 0; i < input.length; i++) {
    h = (h * 33) ^ input.charCodeAt(i);
  }
  return h >>> 0;
}

const AUTHOR_PALETTE = [
  'rgba(255, 179, 186, 0.96)', // 粉紅
  'rgba(255, 223, 186, 0.96)', // 杏桃
  'rgba(255, 255, 186, 0.96)', // 淡黃
  'rgba(186, 255, 201, 0.96)', // 淡綠
  'rgba(186, 225, 255, 0.96)', // 淡藍
  'rgba(214, 186, 255, 0.96)', // 淡紫
  'rgba(255, 186, 247, 0.96)', // 玫粉
  'rgba(186, 255, 250, 0.96)', // 薄荷
  'rgba(255, 209, 220, 0.96)', // 櫻花
  'rgba(204, 255, 204, 0.96)', // 草綠
];

function colorForAuthor(author: string): string {
  const idx = hashString(author.trim() || 'anonymous') % AUTHOR_PALETTE.length;
  return AUTHOR_PALETTE[idx];
}

function isInActiveWindow(messageTimestamp: number, now: number): boolean {
  // 10 分鐘可出現、2 分鐘休息（以留言 timestamp 為週期起點）
  const activeMs = 10 * 60 * 1000;
  const restMs = 2 * 60 * 1000;
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
  const seedRef = useRef(0);
  const lastSourceIdRef = useRef<string>('');

  const pool = useMemo(() => {
    return messages
      .map((m) => ({
        id: m.id,
        author: m.author || '',
        content: m.content || '',
        timestamp: Number(m.timestamp || 0),
      }))
      .map((m) => ({
        id: m.id,
        author: m.author.trim(),
        timestamp: m.timestamp,
        text: `${m.author.trim()}：${String(m.content).trim()}`,
      }))
      .filter((x) => x.text.trim().length > 2);
  }, [messages]);

  useEffect(() => {
    if (paused) return;
    if (pool.length === 0) return;

    // BM3：B 密度（先沿用你現有參數）
    const maxOnScreen = 17;
    const spawnEveryMs = 1850;

    const tick = window.setInterval(() => {
      setItems((prev) => {
        const next = prev.slice(-maxOnScreen);

        const now = Date.now();
        const eligible = pool.filter((m) => isInActiveWindow(m.timestamp, now));
        if (eligible.length === 0) return next;

        // 用 seed 讓抽樣更穩定一點
        seedRef.current += 1;
        const r = (seedRef.current * 9301 + 49297) % 233280;
        let idx = r % eligible.length;

        // 避免「同一則連續兩次」抽到
        if (eligible.length > 1 && eligible[idx].id === lastSourceIdRef.current) {
          idx = (idx + 1) % eligible.length;
        }

        const picked = eligible[idx];
        lastSourceIdRef.current = picked.id;

        const h = window.innerHeight || 800;
        const topPx = Math.floor(Math.random() * Math.max(1, h - 40));

        // BM3：M 速度（仍有快慢差，但集中在中速）
        // 9–12 秒：你如果覺得太慢或太快，我們再微調這兩個數字
        const durationMs = Math.floor(9000 + Math.random() * 3000);

        // 仍保留大小差
        const fontSizePx = clamp(Math.floor(14 + Math.random() * 10), 14, 24);

        next.push({
          id: `${picked.id}_${now}_${Math.random().toString(36).slice(2)}`,
          sourceId: picked.id,
          text: picked.text,
          topPx,
          durationMs,
          fontSizePx,
          color: colorForAuthor(picked.author),
        });

        return next;
      });
    }, spawnEveryMs);

    return () => window.clearInterval(tick);
  }, [pool, paused]);

  return (
    <div aria-hidden="true" className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      <style>{`
        @keyframes guestbook-move-left {
          0% { transform: translateX(110vw); }
          100% { transform: translateX(-120vw); }
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
            WebkitTextStroke: '2px rgba(0,0,0,0.9)',
            textShadow: [
              '2px 0 0 rgba(0,0,0,0.9)',
              '-2px 0 0 rgba(0,0,0,0.9)',
              '0 2px 0 rgba(0,0,0,0.9)',
              '0 -2px 0 rgba(0,0,0,0.9)',
              '1.5px 1.5px 0 rgba(0,0,0,0.9)',
              '-1.5px 1.5px 0 rgba(0,0,0,0.9)',
              '1.5px -1.5px 0 rgba(0,0,0,0.9)',
              '-1.5px -1.5px 0 rgba(0,0,0,0.9)',
              '0 2px 10px rgba(0,0,0,0.35)',
            ].join(', '),
            fontWeight: 600,
            letterSpacing: '0.2px',
          }}
        >
          {it.text}
        </div>
      ))}
    </div>
  );
}