import { useEffect, useMemo, useState } from 'react';
import MessageForm from './components/MessageForm';
import HeroCarousel from './components/HeroCarousel';
import BarrageLayer from './components/BarrageLayer';
import { addMessage, listMessages, type ApiMessage } from './components/api';

export default function App() {
  const [messages, setMessages] = useState<ApiMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastSyncAt, setLastSyncAt] = useState<number | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  // ✅ 新增：播放模式
  const [isPlaying, setIsPlaying] = useState(false);

  const sorted = useMemo(() => {
    return [...messages].sort((a, b) => a.timestamp - b.timestamp);
  }, [messages]);

  async function refresh() {
    try {
      setLoadError(null);
      const data = await listMessages(220);
      setMessages(data);
      setLastSyncAt(Date.now());
    } catch (e: any) {
      setLoadError(e?.message || '載入留言失敗');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    refresh();

    const t = window.setInterval(() => {
      refresh();
    }, 9000);

    return () => window.clearInterval(t);
  }, []);

  // ✅ 播放時鎖住捲動（避免背景頁面滾動）
  useEffect(() => {
    if (!isPlaying) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isPlaying]);

  async function handleSend(author: string, content: string) {
    const optimistic: ApiMessage = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2)}`,
      author,
      content,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, optimistic]);

    const saved = await addMessage(author, content);

    setMessages((prev) =>
      prev.map((m) =>
        m.id === optimistic.id
          ? { ...m, id: saved.id, timestamp: saved.timestamp }
          : m
      )
    );
  }

  const lastSyncLabel = useMemo(() => {
    if (!lastSyncAt) return '尚未同步';
    return new Date(lastSyncAt).toLocaleTimeString('zh-TW', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }, [lastSyncAt]);

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 relative">
      <div
        className="fixed inset-0 -z-10"
        style={{
          backgroundImage: 'url(./slides/bg.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          opacity: 0.3,
        }}
      />
      {isPlaying ? (
        <>
          {/* ✅ 滿版輪播 */}
          <div className="fixed inset-0 z-40 bg-black">
            <HeroCarousel fullScreen />
          </div>

          {/* ✅ 播放時才出現彈幕 */}
          <BarrageLayer messages={sorted} paused={false} />

          {/* ✅ 右上角小叉叉 */}
          <button
            type="button"
            onClick={() => setIsPlaying(false)}
            aria-label="關閉播放"
            className="fixed top-4 right-4 z-[60] h-10 w-10 rounded-full bg-black/45 text-white text-xl leading-none flex items-center justify-center backdrop-blur hover:bg-black/60"
            title="關閉"
          >
            ×
          </button>
        </>
      ) : (
        <div className="max-w-3xl mx-auto space-y-8">
          {/* ✅ 最上方置中標題（只在留言模式顯示） */}
          <header className="text-center">
            <h1 className="text-[48px] font-semibold text-gray-900">
              Pinkoi 留言板
            </h1>
          </header>

          {/* ✅ 進站只顯示留言區 */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">寫下留言</h2>
                <p className="mt-1 text-sm text-gray-500">
                  {isLoading
                    ? '載入中…'
                    : `目前留言數 ${sorted.length}｜最後同步 ${lastSyncLabel}`}
                </p>
              </div>

              {/* ✅ 播放按鈕 */}
              <button
                type="button"
                onClick={() => setIsPlaying(true)}
                className="shrink-0 rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                播放
              </button>
            </div>

            {loadError ? (
              <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {loadError}
              </div>
            ) : null}

            <div className="mt-6">
              <MessageForm onSendMessage={handleSend} />
            </div>
          </div>

          <footer className="text-center text-gray-400 text-sm pb-10">
            &copy; {new Date().getFullYear()} Pinkoi 留言板
          </footer>
        </div>
      )}
    </div>
  );
}