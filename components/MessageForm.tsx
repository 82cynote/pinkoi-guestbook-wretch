import { useMemo, useState } from 'react';

type Props = {
  onSendMessage: (author: string, content: string) => Promise<void>;
};

export default function MessageForm({ onSendMessage }: Props) {
  const [author, setAuthor] = useState('');
  const [content, setContent] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const authorLeft = useMemo(() => 20 - author.length, [author.length]);
  const contentLeft = useMemo(() => 200 - content.length, [content.length]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const a = author.trim();
    const c = content.trim();
    if (!a || !c) {
      setError('暱稱與留言都要填');
      return;
    }

    if (a.length > 20) {
      setError('暱稱最多 20 字');
      return;
    }

    if (c.length > 200) {
      setError('留言最多 200 字');
      return;
    }

    setIsSending(true);
    try {
      await onSendMessage(a, c);
      setAuthor('');
      setContent('');
    } catch (err: any) {
      setError(err?.message || '送出失敗');
    } finally {
      setIsSending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <div className="flex items-end justify-between">
          <label htmlFor="author" className="block text-sm font-medium text-gray-700 mb-1">
            暱稱
          </label>
          <span className={"text-xs mb-1 " + (authorLeft < 0 ? 'text-red-500' : 'text-gray-400')}>
            {authorLeft}
          </span>
        </div>
        <input
          id="author"
          type="text"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          placeholder="請輸入暱稱"
          maxLength={40}
          className="block w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200"
          disabled={isSending}
        />
      </div>

      <div>
        <div className="flex items-end justify-between">
          <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
            留言
          </label>
          <span className={"text-xs mb-1 " + (contentLeft < 0 ? 'text-red-500' : 'text-gray-400')}>
            {contentLeft}
          </span>
        </div>
        <textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="寫下想說的話..."
          rows={4}
          maxLength={400}
          className="block w-full resize-none rounded-xl border border-gray-200 px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200"
          disabled={isSending}
        />
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <button
        type="submit"
        disabled={isSending}
        className={
          'inline-flex w-full items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-200 ' +
          (isSending ? 'bg-gray-300 text-gray-600' : 'bg-gray-900 text-white hover:bg-gray-800')
        }
      >
        {isSending ? '送出中...' : '送出留言'}
      </button>

      <p className="text-xs text-gray-400 leading-relaxed">
        若你還沒接 Google Sheet，畫面會先用本機儲存模式運作。
      </p>
    </form>
  );
}
