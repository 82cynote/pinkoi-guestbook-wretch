import { Message } from '../types';

type MessageListProps = {
  messages: Message[];
};

export default function MessageList({ messages }: MessageListProps) {
  if (messages.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-300">
        <p className="text-gray-400">目前還沒有任何留言</p>
      </div>
    );
  }

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString('zh-TW', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      {messages.map((message) => (
        <div key={message.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 rounded-full bg-gray-200" />
              <div>
                <h3 className="text-sm font-bold text-gray-900">{message.author}</h3>
                <p className="text-xs text-gray-400">{formatDate(message.timestamp)}</p>
              </div>
            </div>
          </div>
          <div className="mt-4 text-gray-700 leading-relaxed whitespace-pre-wrap">{message.content}</div>
        </div>
      ))}
    </div>
  );
}
