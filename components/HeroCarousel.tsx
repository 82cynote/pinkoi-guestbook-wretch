import { useEffect, useMemo, useState } from 'react';

type Props = {
  intervalMs?: number;
};

export default function HeroCarousel({ intervalMs = 4500 }: Props) {
  const [slides, setSlides] = useState<string[]>([]);
  const [index, setIndex] = useState(0);

  const safeSlides = useMemo(() => {
    return slides.length > 0 ? slides : ['./slides/sample-1.svg', './slides/sample-2.svg'];
  }, [slides]);

  useEffect(() => {
    let cancelled = false;
    fetch('./slides/slides.json')
      .then((r) => r.json())
      .then((list: unknown) => {
        if (cancelled) return;
        if (Array.isArray(list)) {
          const mapped = list
            .map((x) => (typeof x === 'string' ? x.trim() : ''))
            .filter(Boolean)
            .map((name) => `./slides/${name}`);
          setSlides(mapped);
        }
      })
      .catch(() => {
        // 用預設示意圖
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (safeSlides.length <= 1) return;
    const t = window.setInterval(() => {
      setIndex((i) => (i + 1) % safeSlides.length);
    }, intervalMs);
    return () => window.clearInterval(t);
  }, [safeSlides.length, intervalMs]);

  const current = safeSlides[index % safeSlides.length];

  return (
    <section className="relative w-full overflow-hidden rounded-3xl bg-gray-900 shadow-sm border border-gray-100">
      <div className="relative h-[260px] sm:h-[340px]">
        <img
          src={current}
          alt="輪播圖片"
          className="absolute inset-0 h-full w-full object-cover"
          draggable={false}
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/20 to-black/10" />

        <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
          <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-white">Pinkoi 留言彈幕</h1>
          <p className="mt-2 text-sm sm:text-base text-white/90">寫下留言，大家都能看見，會飄在整個畫面上</p>
        </div>
      </div>

      <div className="absolute top-4 right-4 flex items-center gap-2">
        {safeSlides.slice(0, 8).map((_, i) => (
          <span
            key={i}
            className={
              'h-2 w-2 rounded-full transition-all ' +
              (i === index ? 'bg-white' : 'bg-white/40')
            }
          />
        ))}
      </div>
    </section>
  );
}
