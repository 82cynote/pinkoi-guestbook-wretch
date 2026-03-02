import { useEffect, useMemo, useState } from 'react';
import MessageForm from './components/MessageForm';
import HeroCarousel from './components/HeroCarousel';
import BarrageLayer from './components/BarrageLayer';
import { addMessage, listMessages, type ApiMessage } from './components/api';

export default function App() {
  const [messages, setMessages] = useState<ApiMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [paused, setPaused] = useState(false);
  const [lastSyncAt, setLastSyncAt] = useState<number | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

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
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8">
      <BarrageLayer messages={sorted} paused={paused} />

      <div className="max-w-3xl mx-auto space-y-8">
        <HeroCarousel />

        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">寫下留言</h2>
              <p className="mt-1 text-sm text-gray-500">
                {isLoading ? '載入中…' : `目前留言數 ${sorted.length}｜最後同步 ${lastSyncLabel}`}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setPaused((p) => !p)}
              className="shrink-0 rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              {paused ? '播放彈幕' : '暫停彈幕'}
            </button>
          </div>

          {loadError ? (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {loadError}
              <div className="mt-2 text-xs text-red-600">
                若你還沒接 Google Sheet，這段訊息屬於正常狀況；你可以先用本機儲存模式看畫面。
              </div>
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
    </div>
  );
}
