import { useEffect, useMemo, useRef, useState } from 'react';
import type { ApiMessage } from './api';

type BarrageItem = {
  id: string;
  text: string;
  topPx: number;
  durationMs: number;
  fontSizePx: number;
};

type Props = {
  messages: ApiMessage[];
  paused: boolean;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export default function BarrageLayer({ messages, paused }: Props) {
  const [items, setItems] = useState<BarrageItem[]>([]);
  const seedRef = useRef(0);

  const pool = useMemo(() => {
    return messages
      .map((m) => ({
        id: m.id,
        text: `${m.author}：${m.content}`,
      }))
      .filter((x) => x.text.trim().length > 2);
  }, [messages]);

  useEffect(() => {
    if (paused) return;
    if (pool.length === 0) return;

    const maxOnScreen = 18;
    const spawnEveryMs = 850;

    const tick = window.setInterval(() => {
      setItems((prev) => {
        const next = prev.slice(-maxOnScreen);

        seedRef.current += 1;
        const r = (seedRef.current * 9301 + 49297) % 233280;
        const idx = r % pool.length;
        const picked = pool[idx];

        const h = window.innerHeight || 800;
        const topPx = Math.floor(Math.random() * (h - 40));

        const durationMs = Math.floor(7000 + Math.random() * 7000);
        const fontSizePx = clamp(Math.floor(14 + Math.random() * 10), 14, 24);

        next.push({
          id: `${picked.id}_${Date.now()}_${Math.random().toString(36).slice(2)}`,
          text: picked.text,
          topPx,
          durationMs,
          fontSizePx,
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
            textShadow: '0 2px 10px rgba(0,0,0,0.35)',
            color: 'rgba(255,255,255,0.96)',
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
